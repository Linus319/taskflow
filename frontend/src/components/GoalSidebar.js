import "../css/Sidebar.css";
import GoalItem from "./GoalItem";

function GoalSidebar({ goals, selectedGoalId, onSelect, onAdd, onDelete }) {
    console.log("selectedGoal", selectedGoalId);

    return (
        <aside className='sidebar'>
            <div className="sidebar-header">
                <h2>Goals</h2>
                <button onClick={onAdd} title="Add Goal">+</button>
            </div>
            <ul className="sidebar-list">
                {goals.map(goal => (
                    <GoalItem
                        key={goal.id}
                        goal={goal}
                        isSelected={goal.id === selectedGoalId}
                        onSelect={onSelect}
                        onDelete={onDelete}
                    />
                ))}
            </ul>
        </aside>
    );
}

export default GoalSidebar;
