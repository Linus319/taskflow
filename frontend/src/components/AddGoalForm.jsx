import { useState } from "react";
import "../css/AddGoalForm.css";

function AddGoalForm({ onSubmit, onCancel }) {
    const [title, setTitle] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onSubmit(title);
            setTitle("");
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