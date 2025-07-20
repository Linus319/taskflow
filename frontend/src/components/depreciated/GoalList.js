import { useState } from 'react';

function GoalList({ goals, selectedGoalId, onSelect, onAdd, onDelete, onUpdate }) {
    const [newGoal, setNewGoal] = useState("");
    const [editingGoalId, setEditingGoalId] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");

    return (
        <div className="goal-list">
            <h2>Goals</h2>
            <ul>
                {goals.map(goal => (
                    <li key={goal.id}>
                        {editingGoalId === goal.id ? (
                        <>
                            <input
                                value={editedTitle}
                                onChange={e => setEditedTitle(e.target.value)}
                            />
                            <button onClick={() => {
                                onUpdate(goal.id, { title: editedTitle });
                                setEditingGoalId(null);
                            }}>
                            Save
                            </button>
                            <button onClick={() => setEditingGoalId(null)}>Cancel</button>
                        </>
                        ) : (
                        <>
                            <button
                            className={goal.id === selectedGoalId ? "selected" : ""}
                            onClick={() => onSelect(goal)}
                            >
                            {goal.title}
                            </button>
                            <button onClick={() => {
                                setEditingGoalId(goal.id);
                                setEditedTitle(goal.title);
                            }}>
                            Edit
                            </button>
                            <button onClick={() => onDelete(goal.id)}>Delete</button>
                        </>
                        )}
                    </li>
                ))} 
            </ul>
            <form
                onSubmit={e => {
                e.preventDefault();
                if (newGoal.trim()) {
                    onAdd(newGoal);
                    setNewGoal("");
                }
                }}
            >
                <input
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                placeholder="Add new goal"
                />
                <button type="submit">Add</button>
            </form>
        </div>
    );
}

export default GoalList;