from utils.decorators import login_required
from flask import Blueprint, request, session, jsonify
from models import db, Task, Goal

bp = Blueprint("tasks", __name__)

@bp.route("/api/goals/<int:goal_id>/subtasks", methods=['POST'])
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


@bp.route("/api/goals/<int:goal_id>/tasks", methods=['GET'])
@login_required
def get_tasks_for_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    
    all_tasks = Task.query.filter_by(goal_id=goal_id).all()

    return jsonify([task.to_dict(recursive=True) for task in all_tasks])

@bp.route("/api/goals/<int:goal_id>/tasks", methods=['POST'])
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

@bp.route("/api/tasks/<int:task_id>", methods=['PUT'])
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


@bp.route('/api/tasks/batch-update', methods=["POST"])
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



@bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200


@bp.route("/api/goals/<int:goal_id>/tasks/reorder", methods=["POST"])
@login_required
def reorder_root_tasks(goal_id):
    data = request.get_json()
    ordered_ids = data.get("ordered_ids")
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