import { useState } from 'react';
import AddTaskForm from "./AddTaskForm";
import TaskTree from "./TaskTree";
import "../css/GoalDetailView.css";

function GoalDetailView({ goal, tasks, onAddTask, onUpdateTask, onDeleteTask, refreshTasks }) {
    const [showAddTask, setShowAddTask] = useState(false);
    
    if (!goal) {
        return <div className="goal-detail-view empty">Please select a goal from the sidebar.</div>;
    }

    const goalTasks = tasks.filter(t => t.goal_id === goal.id);
    const hasTopLevelTasks = goalTasks.some(t => !t.parent_id);
    // const containerClass = `goal-detail-view ${!goal ? "empty" : ""}`;

    const handleAddTaskClick = (e) => {
        e.preventDefault();
        setShowAddTask(true);
    };

    const handleAddTask = ({ title, parentId = null, description }) => {
        // console.log("handleAddTask in GoalDetailView, parent_id:", parentId);

        if (title) {
            onAddTask({ title, parentId: parentId, description });
        }
        setShowAddTask(false);
    };

    const handleCancelTask = () => {
        setShowAddTask(false);
    };

    async function handleGeneratePlan() {
        try {
            const res = await fetch(`/api/goals/${goal.id}/generate-plan`, {
                method: "POST",
                headers: {"Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to generate plan");
            
            // await res.json();
            
            refreshTasks();
            
        } catch (err) {
            console.error(err);
            alert("Could not generate plan");
        }
    }

    return (
        <div className={"goal-detail-view"}>
            <h2>{goal.title}</h2>
            <TaskTree
                tasks={goalTasks}
                onAddTask={handleAddTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                refreshTasks={refreshTasks}
            />
            <button onClick={handleAddTaskClick}>Add Task</button>
            {showAddTask && (
                <AddTaskForm goalId={goal.id} onSubmit={handleAddTask} onCancel={handleCancelTask}/>
            )}
            {!hasTopLevelTasks && (
                <button onClick={handleGeneratePlan}>Generate Plan</button>
            )}
        </div>
    );
}

export default GoalDetailView;