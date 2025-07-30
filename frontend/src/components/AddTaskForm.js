import { useState } from "react";
import "../css/AddTaskForm.css"

function AddTaskForm({ goalId, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("form submitted with title:", title);
    if (title.trim()) {
      console.log("goalId in AddTaskForm:", goalId)
      onSubmit({ title, goal_id: goalId });
      setTitle("");
    }
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add new task..."
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <button type="submit">Add</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default AddTaskForm;
