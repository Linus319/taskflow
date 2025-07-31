import { useState } from 'react';
import AddTaskForm from "./AddTaskForm";
import TaskTree from "./TaskTree";
import "../css/GoalDetailView.css";

function GoalDetailView({ goal, tasks, onAddTask, onUpdateTask, onDeleteTask }) {
    
    console.log("GoalDetailView props:", { onDeleteTask });


    const [showAddTask, setShowAddTask] = useState(false);

    const containerClass = `goal-detail-view ${!goal ? "empty" : ""}`;

    const handleAddTaskClick = (e) => {
        e.preventDefault();
        setShowAddTask(true);
    }

    const handleAddTask = (newTask) => {
        if (newTask?.title) {
            onAddTask(newTask.title, null);
        }
        setShowAddTask(false);
    }
    
    // const handleDeleteTask = (taskId) => {
    //     console.log("handle delete task in goalDetailView");
    //     onDeleteTask(taskId);
    // };

    // const handleUpdateTask = (taskId) => {
        
    // }

    const handleCancelTask = (taskId) => {
        // should this really delete from db? i don't think the task would have been created yet
        fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
        })
        .then((res) => {
            if (!res.ok) throw new Error("Failed to delete task");
            onDeleteTask(taskId);
        })
        .catch((err) => {
            console.error("Delete error:", err);
            alert("Could not delete task.");
        }); 
    };

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
                    />
                    <button onClick={handleAddTaskClick}>Add Task</button>
                    {showAddTask && (
                        <AddTaskForm goalId={goal.id} onSubmit={handleAddTask} onCancel={handleCancelTask}/>
                    )}
                </>
            )}
        </div>
    );
}

export default GoalDetailView;