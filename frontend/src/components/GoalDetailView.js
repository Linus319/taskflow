import { useState } from 'react';
import AddTaskForm from "./AddTaskForm";
import TaskTree from "./TaskTree";
import "../css/GoalDetailView.css";

function GoalDetailView({ goal, tasks, onAddTask, onUpdateTask, onDeleteTask, refreshTasks }) {
    const [showAddTask, setShowAddTask] = useState(false);
    const containerClass = `goal-detail-view ${!goal ? "empty" : ""}`;

    const handleAddTaskClick = (e) => {
        e.preventDefault();
        setShowAddTask(true);
    };

    const handleAddTask = ({ title, parentId = null, description }) => {
        console.log("handleAddTask in GoalDetailView, parent_id:", parentId);

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

            const plan = await res.json();
            for (const task of plan) {
                const newTask = {
                    title: task.title,
                    description: task.description || "",
                    parent_id: task.parent_id,
                };

                const taskRes = await fetch(`/api/goals/${goal.id}/tasks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newTask),
                });

                if (!taskRes.ok) {
                    console.error("Failed to save task:", newTask);
                    continue;
                }

                // const savedTask = await taskRes.json();
                // onAddTask(savedTask.title, savedTask.parent_id);

            }
            
            refreshTasks();
            
        } catch (err) {
            console.error(err);
            alert("Could not generate plan");
        }
    }

    return (
        <div className={containerClass}>
            {!goal ? (
                <div>Please select a goal from the sidebar.</div>
            ) : (
                <>
                    <h2>{goal.title}</h2>
                    <TaskTree
                        tasks={tasks.filter(t => t.goal_id === goal.id)}
                        onAddTask={handleAddTask}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        refreshTasks={refreshTasks}
                    />
                    <button onClick={handleAddTaskClick}>Add Task</button>
                    {showAddTask && (
                        <AddTaskForm goalId={goal.id} onSubmit={handleAddTask} onCancel={handleCancelTask}/>
                    )}
                    <button onClick={handleGeneratePlan}>Generate Plan</button>
                </>
            )}
        </div>
    );
}

export default GoalDetailView;