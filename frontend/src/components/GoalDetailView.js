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
    };

    const handleAddTask = (title, parent_id, goal_id) => {
        console.log("handleAddTask in GoalDetailView");

        if (title) {
            console.log(`calling onAddTask with title: ${title}, and parent_id: ${parent_id}`)
            onAddTask(title, parent_id);
        }
        setShowAddTask(false);
    };

    const handleCancelTask = () => {
        setShowAddTask(false);
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