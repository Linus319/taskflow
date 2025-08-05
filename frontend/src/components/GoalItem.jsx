import "../css/GoalItem.css"

function GoalItem({ goal, isSelected, onSelect }) {
    const handleClick = (e) => {
        if (e.target.closest(".delete-button") || e.target.closest(".edit-button")) return;
        onSelect(goal);
    };

    return (
        <li
            className={`goal-item ${isSelected ? "active" : ""}` }
            onClick={handleClick}
        >
            <span className="goal-icon">🗂️</span>
            <span className="goal-title">{goal.title}</span>
        </li>
    );
}

export default GoalItem;