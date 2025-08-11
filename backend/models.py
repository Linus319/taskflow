from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    goals = db.relationship("Goal", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Goal(db.Model):
    __tablename__ = 'goal'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_goal_user_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

    tasks = db.relationship('Task', back_populates='goal', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
        }

class Task(db.Model):
    __tablename__ = 'task'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('goal.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=db.func.now())
    order_idx = db.Column(db.Integer) # what does this do
    status = db.Column(db.String(20), default='active') # active, done, archived

    goal = db.relationship("Goal", back_populates="tasks")
    parent = db.relationship(
        'Task', remote_side=[id], 
        backref=db.backref('subtasks', 
        cascade="all, delete-orphan", 
        single_parent=True)
    )

    def to_dict(self, recursive=True):
        base = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "goal_id": self.goal_id,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat(),
            "order_idx": self.order_idx,
            "status": self.status,
        }

        if recursive:
            base["subtasks"] = [subtask.to_dict() for subtask in self.subtasks]

        return base
