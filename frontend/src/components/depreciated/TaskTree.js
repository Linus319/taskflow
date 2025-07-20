import { useState } from "react";

function TaskTree({ tasks, onAdd, onDelete, onUpdate }) {
  return (
    <ul>
      {tasks.map(task => (
        <TaskNode
          key={task.id}
          task={task}
          onAddSubtask={onAdd}
          onDeleteTask={onDelete}
          onUpdateTask={onUpdate}
        />
      ))}
    </ul>
  );
}

function TaskNode({ task, onAddSubtask, onDeleteTask, onUpdateTask }) {
  const [adding, setAdding] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [expanded, setExpanded] = useState(true);

  return (
    <li>
      <div>
        <button onClick={() => setExpanded(v => !v)}>
          {expanded ? "-" : "+"}
        </button>
        {editing ? (
          <>
            <input value={title} onChange={e => setTitle(e.target.value)} />
            <button onClick={() => {
              onUpdateTask(task.id, { title: title });
              setEditing(false);
            }}>Save</button>
          </>
        ) : (
          <>
            <span>{task.title}</span>
            <button onClick={() => setEditing(true)}>Edit</button>
            <button onClick={() => onDeleteTask(task.id)}>Delete</button>
          </>
        )}
        <button onClick={() => setAdding(v => !v)}>
          {adding ? "Cancel" : "Add Subtask"}
        </button>
        {adding && (
          <form
            onSubmit={e => {
              e.preventDefault();
              onAddSubtask(task.id, newSubtaskTitle);
              setNewSubtaskTitle("");
              setAdding(false);
            }}
          >
            <input
              value={newSubtaskTitle}
              onChange={e => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title"
              autoFocus
            />
            <button type="submit">Add</button>
          </form>
        )}
      </div>
      {expanded && task.subtasks && task.subtasks.length > 0 && (
        <TaskTree
          tasks={task.subtasks}
          onAdd={onAddSubtask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
        />
      )}
    </li>
  );
}

export default TaskTree;
