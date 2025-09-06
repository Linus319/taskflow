import { useState } from "react";
import "../css/AddTaskForm.css"

function AddTaskForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({ title, description });
      setTitle("");
      setDescription("");
    }
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <button type="submit">Add</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default AddTaskForm;
