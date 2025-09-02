from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import requests
import os
from models import db, Goal, Task, User
import json
from flask_migrate import Migrate
from functools import wraps

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder="../frontend/build", static_url_path='/')
CORS(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(basedir, 'app.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
db.init_app(app)
migrate = Migrate(app, db)

@app.before_request
def log_request_info():
    print("REQUEST:", request.method, request.path)

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static_file(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")
    
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"message": "Signup successful"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session["user_id"] = user.id
        return jsonify({"message": "Login successful"})
    return jsonify({"error": "Invalid username or password"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route("/api/goals", methods=["GET", "POST"])
@login_required
def list_or_create_goals():
    if request.method == "POST":
        data = request.get_json()
        goal_title = data.get("title")
        if not goal_title:
            return jsonify({"error": "Missing goal title"}), 400
        new_goal = Goal(title=goal_title, user_id=session["user_id"])
        db.session.add(new_goal)
        db.session.commit()
        return jsonify(new_goal.to_dict()), 201
    goals = Goal.query.filter_by(user_id=session["user_id"]).all()
    return jsonify([goal.to_dict() for goal in goals])

@app.route("/api/goals/<int:goal_id>", methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"}), 200

@app.route("/api/goals/<int:goal_id>", methods=['PUT'])
@login_required
def update_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    data = request.get_json()
    new_title = data.get("title")
    if not new_title:
        return jsonify({"error": "Missing 'title' in request"}), 400
    
    goal.title = new_title
    db.session.commit()

    return jsonify(goal.to_dict()), 200

@app.route("/api/goals/<int:goal_id>/subtasks", methods=['POST'])
@login_required
def add_subtask(goal_id):
    data = request.get_json()
    title = data.get("title")
    parent_id = data.get("parent_id", None)

    if not title:
        return jsonify({"error": "Missing subtask title"}), 400
    
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    new_task = Task(
        title=title,
        goal_id = goal.id,
        parent_id = parent_id
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.to_dict()), 201


@app.route("/api/goals/<int:goal_id>/tasks", methods=['GET'])
@login_required
def get_tasks_for_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    all_tasks = Task.query.filter_by(goal_id=goal_id).all()

    return jsonify([task.to_dict(recursive=True) for task in all_tasks])

@app.route("/api/goals/<int:goal_id>/tasks", methods=['POST'])
@login_required
def add_task(goal_id):
    data = request.get_json()
    title = data.get("title")
    parent_id = data.get("parent_id")
    description = data.get("description", "")

    if not title:
        return jsonify({'error': 'Missing task title'}), 400
    
    siblings = Task.query.filter_by(goal_id=goal_id, parent_id=parent_id).all()
    max_order = max([s.order_idx for s in siblings if s.order_idx is not None], default=-1)
    new_order_idx = max_order + 1
    
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({'error': "Goal not found"}), 404
    
    new_task = Task(
        title=title,
        description=description,
        goal_id=goal_id,
        parent_id=parent_id,
        order_idx = new_order_idx
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

@app.route("/api/tasks/<int:task_id>", methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    if data is None:
        return jsonify({"error": "No JSON data received"}), 400
    
    task.title = data.get("title", task.title)
    task.description = data.get("description", task.description)

    if "status" in data:
        task.status = data["status"]
    
    if "order_idx" in data:
        task.order_idx = data["order_idx"]

    db.session.commit()
    return jsonify(task.to_dict()), 200


@app.route('/api/tasks/batch-update', methods=["POST"])
@login_required
def batch_update_tasks():
    data = request.get_json()
    updates = data.get("updates", [])

    if not updates:
        return jsonify({"error": "No updates provided"}), 400
    
    try:
        for update in updates:
            task_id = update.get("id")
            task = Task.query.get(task_id)

            if not task:
                return jsonify({"error": f"Task {task_id} not found"}), 404
            
            if "order_idx" in update:
                task.order_idx = update["order_idx"]
            
            if "status" in update:
                task.status = update["status"]
            if "title" in update:
                task.title = update["title"]
        
        db.session.commit()

        return jsonify({
            "message": f"Successfully updated {len(updates)} tasks",
            "updated_count": len(updates)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update tasks: {str(e)}"}), 500



@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200


@app.route("/api/goals/<int:goal_id>/tasks/reorder", methods=["POST"])
@login_required
def reorder_root_tasks(goal_id):
    print(f"Starting reorder tasks for goal")
    data = request.get_json()
    ordered_ids = data.get("ordered_ids")
    print("ORDERED_IDS:", ordered_ids)
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
        
    for item in ordered_ids:
        task_id = item.get('id')
        new_order_idx = item.get('order_idx')
        task = Task.query.get(task_id)
        task.order_idx = new_order_idx
            
    db.session.commit()

    root_tasks = Task.query.filter_by(goal_id=goal_id, parent_id=None).order_by(Task.order_idx.asc()).all()

    return jsonify([task.to_dict(recursive=True) for task in root_tasks])

    
    



@app.route("/api/tasks/<int:task_id>/reorder", methods=["POST"])
@login_required
def reorder_sub_tasks(task_id):
    print(f"Starting reorder for subtasks of task {task_id}")
    jsonify()



@app.route(f"/api/goals/<int:goal_id>/generate-plan", methods=['POST'])
@login_required
def generate_plan_for_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)

    prompt = f"""
    Generate a concise project plan for the following goal as valid JSON.
    Only output JSON. No explanations.

    Goal: "{goal.title}"

    Each task must have:
    - title
    - description

    Example:
    [
      {{
        "title": "First task",
        "description": "This is a brief description."
      }}
    ]
    """
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral",
            "prompt": prompt.strip(),
            "stream": False,
            "options": {
                "temperature": 0.2,    # less randomness
                "num_predict": 400     # limit output length
            }
        },
        # timeout=120  # safety timeout
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to generate tasks"}), 500

    try:
        raw_output = response.json().get("response", "")
        json_str = raw_output[raw_output.find("["): raw_output.rfind("]") + 1]
        task_plan = json.loads(json_str)
    except Exception as e:
        return jsonify({"error": "Failed to parse AI output", "details": str(e)}), 400
    
    order_idx = 0
    for t in task_plan:
        new_task = Task(
            title=t["title"],
            description=t.get("description", ""),
            goal_id=goal.id,
            parent_id=None,
            order_idx=order_idx,
        )
        db.session.add(new_task)
        order_idx += 1
    
    db.session.commit()
    
    return jsonify(task_plan), 200


@app.route(f"/api/tasks/<int:task_id>/generate-plan", methods=['POST'])
@login_required
def generate_plan_for_task(task_id):
    task = Task.query.get_or_404(task_id)
    goal = Goal.query.get_or_404(task.goal_id)

    prompt = f"""
    Generate a concise list of subtasks for this task as valid JSON.
    Only output JSON. No explanations.

    Goal: "{goal.title}"
    Task: "{task.title}"
    Description: "{task.description or ''}"

    Each subtask must have:
    - title
    - description

    Example:
    [
      {{
        "title": "First subtask",
        "description": "Brief description"
      }}
    ]
    """

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral", 
            "prompt": prompt.strip(),
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_predict": 400
            }
        },
        # timeout=120
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to generate subtasks"}), 500

    try:
        raw_output = response.json().get("response", "")
        json_str = raw_output[raw_output.find("["): raw_output.rfind("]") + 1]
        subtask_plan = json.loads(json_str)
    except Exception as e:
        return jsonify({"error": "Failed to parse AI output", "details": str(e)}), 400
    
    order_idx = 0
    for sub in subtask_plan:
        new_subtask = Task(
            title=sub["title"],
            description=sub.get("description", ""),
            goal_id=task.goal_id,
            parent_id=task.id,
            order_idx=order_idx
        )
        db.session.add(new_subtask)
        order_idx += 1
    db.session.commit()

    return jsonify(subtask_plan), 200



if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=5000)