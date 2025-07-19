import "../css/GoalItem.css"

function GoalItem({ goal, isSelected, onSelect, onDelete }) {
    const handleClick = (e) => {
        if (e.target.closest(".delete-button")) return;
        console.log("Selecting goal:", goal);
        onSelect(goal);
    };

    return (
        <li
            className={`goal-item ${isSelected ? "active" : ""}` }
            onClick={handleClick}
        >
            <span className="goal-icon">🗂️</span>
            {goal.title}
            <button
                className="delete-button"
                onClick={() => onDelete(goal.id)}
                title="Delete goal"
            >
                ❌
            </button>
        </li>
    );
}

export default GoalItem;