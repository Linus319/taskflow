from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
from models import db, Goal, Task
import json
from flask_migrate import Migrate

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder="../frontend/build", static_url_path='/')
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()

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

@app.route("/api/goals", methods=["GET", "POST"])
def list_or_create_goals():
    if request.method == "POST":
        data = request.get_json()
        goal_title = data.get("title")
        if not goal_title:
            return jsonify({"error": "Missing goal title"}), 400
        new_goal = Goal(title=goal_title)
        db.session.add(new_goal)
        db.session.commit()
        return jsonify(new_goal.to_dict()), 201
    goals = Goal.query.all()
    return jsonify([goal.to_dict() for goal in goals])

@app.route("/api/goals/<int:goal_id>", methods=['DELETE'])
def delete_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"}), 200

@app.route("/api/goals/<int:goal_id>/", methods=['PUT'])
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
        parent_id = parent_id  # none or reference another task
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.to_dict()), 201


@app.route("/api/goals/<int:goal_id>/tasks", methods=['GET'])
def get_tasks_for_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    # get top level tasks for goal
    top_tasks = Task.query.filter_by(goal_id=goal_id, parent_id=None).all()
    return jsonify([task.to_dict(recursive=True) for task in top_tasks])


@app.route("/api/goals/<int:goal_id>/tasks", methods=['POST'])
def add_task(goal_id):
    data = request.get_json()
    print(data)
    title = data.get("title")
    parent_id = data.get("parent_id")
    description = data.get("description", "")

    print("Creating task:", title, "| Description:", description)

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
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    # Debug the request
    print(f"Content-Type: {request.content_type}")
    print(f"Raw data: {request.data}")
    print(f"get_json(): {request.get_json()}")
    
    data = request.get_json()
    
    # Add this safety check
    if data is None:
        return jsonify({"error": "No JSON data received"}), 400
    
    task.title = data.get("title", task.title)
    db.session.commit()
    return jsonify(task.to_dict()), 200

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200



@app.route(f"/api/goals/<int:goal_id>/generate-plan", methods=['POST'])
def generate_plan(goal_id):
    goal = Goal.query.get_or_404(goal_id)

    prompt = f"""
    You are an expert project planner. Given the following goal, generate a task plan as structured JSON.

    Goal: "{goal.title}"

    Each task should include:
    - title
    - description

    Output format:
    [
      {{
        "title": "First task",
        "description": "This is a brief description."
      }},
      ...
    ]
    """
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt.strip(),
            "stream": False
        }
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to generate tasks"}), 500
    
    data = response.json()
    raw_output = data.get("response", "")
    before, sep, after = raw_output.partition("```")
    cleaned = after.strip()
    before, sep, after = cleaned.partition("```")
    cleaned = before.strip()

    try:
        task_plan = json.loads(cleaned)
    except Exception as e:
        return jsonify({"error": "Failed to parse AI output", "details": str(e)}), 400
    
    return jsonify(task_plan), 200




if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=5000)