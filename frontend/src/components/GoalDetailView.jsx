import { useState, useEffect } from 'react';
import AddTaskForm from "./AddTaskForm";
import TaskTree from "./TaskTree";
import "../css/GoalDetailView.css";

function GoalDetailView({ goal, tasks, onAddTask, onUpdateTask, onDeleteTask, refreshTasks, onDeleteGoal, onUpdateGoal }) {
    const [showAddTask, setShowAddTask] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(goal?.title || "");
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    useEffect(() => {
        if (goal) {
            setEditTitle(goal.title);
        }
    }, [goal]);
    
    if (!goal) {
        return <div className="goal-detail-view empty">Please select a goal from the sidebar.</div>;
    }

    const goalTasks = tasks.filter(t => t.goal_id === goal.id);
    // console.log("tasks from goaldetailview:", goalTasks);
    const hasTopLevelTasks = goalTasks.some(t => !t.parent_id);

    const handleAddTaskClick = (e) => {
        e.preventDefault();
        setShowAddTask(true);
    };

    const handleAddTask = ({ title, parentId = null, description }) => {
        if (title) {
            onAddTask({ title, parentId: parentId, description });
        }
        setShowAddTask(false);
    };

    const handleCancelTask = () => {
        setShowAddTask(false);
    };

    async function handleGeneratePlan() {
        setIsGeneratingPlan(true);
        try {
            const res = await fetch(`/api/goals/${goal.id}/generate-plan`, {
                method: "POST",
                headers: {"Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to generate plan");
                        
            refreshTasks();
            
        } catch (err) {
            console.error(err);
            alert("Could not generate plan");
        } finally {
            setIsGeneratingPlan(false);
        }
    }

    const handleEditSave = () => {
        if (editTitle.trim()) {
            onUpdateGoal(goal.id, { title: editTitle });
            setIsEditing(false);
        }
    }

    return (
        <div className={"goal-detail-view"}>
            {isEditing ? (
                <div className="goal-edit-form">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <button onClick={handleEditSave}>Save</button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            ) : (
                <h2>{goal.title}</h2>
            )}
            <div className="goal-actions">
                <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
                <button onClick={() => onDeleteGoal(goal.id)}>🗑️ Delete</button>
                <button onClick={handleAddTaskClick}>Add Task</button>
                {!hasTopLevelTasks && (
                    <button 
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan}
                        className={`generate-plan-btn ${isGeneratingPlan ? 'loading' : ''}`}
                    >
                        {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
                    </button>
                )}
            </div>
            
            {showAddTask && (
                <AddTaskForm goalId={goal.id} onSubmit={handleAddTask} onCancel={handleCancelTask}/>
            )}
            
            <TaskTree
                goalId={goal.id}
                tasks={goalTasks}
                onAddTask={handleAddTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                refreshTasks={refreshTasks}
            />
            
        </div>
    );
}

export default GoalDetailView;