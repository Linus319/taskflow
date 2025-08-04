import "../css/GoalItem.css"
import { useState } from 'react'

function GoalItem({ goal, isSelected, onSelect, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(goal.title);

    const handleClick = (e) => {
        if (e.target.closest(".delete-button") || e.target.closest(".edit-button")) return;
        onSelect(goal);
    };

    const handleSave = () => {
        if (editedTitle.trim() !== "") {
            onUpdate(goal.id, { title: editedTitle })
        }
        setIsEditing(false);
    };

    return (
        <li
            className={`goal-item ${isSelected ? "active" : ""}` }
            onClick={handleClick}
        >
            <span className="goal-icon">🗂️</span>
            {isEditing ? (
                <>
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="goal-edit-input"
                    />
                    <button onClick={handleSave} title="Save title">💾</button>
                    <button onClick={() => setIsEditing(false)} title="Cancel">❌</button>
                </>
            ) : (
            <>
                <span className="goal-title">{goal.title}</span>
                <button
                    className="edit-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    title="Edit goal title"
                >✏️</button>
                <button
                    className="delete-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(goal.id);
                    }}
                    title="Delete goal"
                >❌</button>
            </>
            )}
            
            
        </li>
    );
}

export default GoalItem;