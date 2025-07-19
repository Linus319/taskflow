from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Goal(db.Model):
    __tablename__ = 'goal'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

    # one to many: goal -> tasks (only top level)
    tasks = db.relationship('Task', backref='goal', lazy=True, cascade="all, delete-orphan")

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

    # foreign key to link this task to its goal
    goal_id = db.Column(db.Integer, db.ForeignKey('goal.id'), nullable=False)

    # self referencing foreign key to support nested subtasks
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)

    # relationships
    subtasks = db.relationship(
        'Task',
        backref=db.backref('parent', remote_side=[id]),
        lazy=True,
        cascade="all, delete-orphan"
    )

    created_at = db.Column(db.DateTime, default=db.func.now())
    order_idx = db.Column(db.Integer)
    status = db.Column(db.String(20), default='active') # active, done, archived

    def to_dict(self, recursive=True):
        base = {
            "id": self.id,
            "title": self.title,
            "goal_id": self.goal_id,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat(),
            "order_idx": self.order_idx,
            "status": self.status,
        }

        if recursive:
            base["subtasks"] = [subtask.to_dict() for subtask in self.subtasks]

        return base
