from flask import Blueprint, jsonify
from models import Goal, Task, db
from utils.decorators import login_required
from services.ai_service import generate_plan_from_ai
from flask import current_app as app

bp = Blueprint("ai", __name__)

@bp.route("/api/goals/<int:goal_id>/generate-plan", methods=["POST"])
@login_required
def generate_plan_for_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    prompt = f"""
    Generate a concise project plan for the following goal as valid JSON.
    Only output JSON. No explanations, and no comments.

    Goal: "{goal.title}"

    Each task must have:
    - title
    - description
    """
    try:
        tasks = generate_plan_from_ai(prompt, goal_id, parent_id=None, ollama_api_url=app.config['OLLAMA_API'])
        for t in tasks:
            db.session.add(t)
        db.session.commit()
        return jsonify([t.to_dict() for t in tasks]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/api/tasks/<int:task_id>/generate-plan", methods=["POST"])
@login_required
def generate_plan_for_task(task_id):
    task = Task.query.get_or_404(task_id)
    goal = Goal.query.get_or_404(task.goal_id)
    prompt = f"""
    Generate a concise list of subtasks for this task as valid JSON.
    Only output JSON. No explanations, and no comments.

    Goal: "{goal.title}"
    Task: "{task.title}"
    Description: "{task.description or ''}"

    Each subtask must have:
    - title
    - description
    """
    try:
        subtasks = generate_plan_from_ai(prompt, goal_id=task.goal_id, parent_id=task.id, ollama_api_url=app.config['OLLAMA_API'])
        for t in subtasks:
            db.session.add(t)
        db.session.commit()
        return jsonify([t.to_dict() for t in subtasks]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500