import { useState } from "react";
import "../css/AddGoalForm.css";

function AddGoalForm({ onSubmit, onCancel }) {
    const [title, setTitle] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            fetch("/api/goals", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title })
            }).then(
                res => res.json()
            ).then(newGoal => {
                onSubmit(newGoal);
                setTitle("");
            });
        }
    };

    return (
        <form className="add-goal-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter goal title"
                autoFocus
            />
            <button type="submit">Add</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </form>
    );
}

export default AddGoalForm;