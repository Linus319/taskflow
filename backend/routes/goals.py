from utils.decorators import login_required
from flask import Blueprint, request, session, jsonify
from models import db, Goal

bp = Blueprint("goals", __name__)

@bp.route("/api/goals", methods=["GET"])
@login_required
def list_goals():
    goals = Goal.query.filter_by(user_id=session["user_id"]).all()
    return jsonify([goal.to_dict() for goal in goals]), 200

@bp.route("/api/goals", methods=["POST"])
@login_required
def create_goal():
    data = request.get_json()
    goal_title = data.get("title")
    if not goal_title:
        return jsonify({"error": "Missing goal title"}), 400
    new_goal = Goal(title=goal_title, user_id=session["user_id"])
    db.session.add(new_goal)
    db.session.commit()
    return jsonify(new_goal.to_dict()), 201

@bp.route("/api/goals/<int:goal_id>", methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    db.session.delete(goal)
    db.session.commit()
    return jsonify({"message": "Goal deleted"}), 200

@bp.route("/api/goals/<int:goal_id>", methods=['PUT'])
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