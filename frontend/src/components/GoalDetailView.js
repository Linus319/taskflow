import { useState } from 'react';
import AddTaskForm from "./AddTaskForm";
import TaskTree from "./depreciated/TaskTree";
import "../css/GoalDetailView.css";

function GoalDetailView({ goal, tasks, onAddTask, onUpdateTask, onDeleteTask }) {
    const [showAddTask, setShowAddTask] = useState(false);

    const containerClass = `goal-detail-view ${!goal ? "empty" : ""}`;

    return (
        <div className={containerClass}>
            {!goal ? (
                <div>Please select a goal from the sidebar.</div>
            ) : (
                <>
                    <h2>{goal.title}</h2>
                    <p>Hello from goal "{goal.title}"! 🎯</p>
                </>
            )}
        </div>
    );
}

export default GoalDetailView;