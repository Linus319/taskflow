import { useState } from "react";
import "../css/AddTaskForm.css"

function AddTaskForm({ goalId, onAdd }) {
  const [title, setTitle] = useState("");

  const handleSubmit = e => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(null, title);
    setTitle("");
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add new task..."
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

export default AddTaskForm;
