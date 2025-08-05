import { useState } from "react";
import '../css/Task.css';
import AddTaskForm from "./AddTaskForm";

function buildTaskTree(tasks) {
  const taskMap = {};
  const roots = [];

  // Index tasks by id
  tasks.forEach(task => {
    // task.subtasks = [];
    taskMap[task.id] = {
      ...task,
      subtasks: task.subtasks ?? []
    };
  });

  // Build tree
  tasks.forEach(task => {
    if (task.parent_id) {
      const parent = taskMap[task.parent_id];
      if (parent) parent.subtasks.push(taskMap[task.id]);
    } else {
      roots.push(task);
    }
  });

  const sortByOrder = (taskList) => {
    taskList.sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
    taskList.forEach(t => sortByOrder(t.subtasks));
  };

  sortByOrder(roots);

  return roots;
}





function TaskTree({ tasks, onAddTask, onUpdateTask, onDeleteTask, refreshTasks }) {

  const taskTree = buildTaskTree(tasks);

  return (
    <div className="task-tree">
      {taskTree.map(task => (
        <TaskNode
          key={task.id}
          task={task}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          refreshTasks={refreshTasks}
        />
      ))}
    </div>
  );
}

function TaskNode({ task, onAddTask, onUpdateTask, onDeleteTask, refreshTasks }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [newDescription, setNewDescription] = useState(task.description);

  async function handleGeneratePlan(taskId) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to generate plan");

      await res.json();
      refreshTasks();
    } catch (err) {
      console.error(err);
      alert("Could not generate plan for this task");
    }
  }

  if (isEditing) {
    return (
      <div className={`task-node ${task.parent_id ? "nexted-task" : ""}`}>
        <input 
          type="text" 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
        />
        <textarea 
          placeholder="Description (optional)"
          value = {newDescription}
          onChange={e => setNewDescription(e.target.value)}
        />
        <button
          onClick={() => {
            onUpdateTask(task.id, { title: newTitle, description: newDescription });
            setIsEditing(false);
          }}
        >
          Save
        </button>
        <button onClick={() => setIsEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="task-node" style={{ marginLeft: task.parent_id ? 20 : 0 }}>
      <div className="task-row">
        <div className="task-content">
          <span>{task.title}</span>
          {task.description && (
            <span className="task-description">{task.description}</span>
          )}
        </div>
        <button title="Add task" onClick={() => setShowAddSubtaskForm(true)}>➕</button>
        <button title="Generate plan" onClick={() => handleGeneratePlan(task.id)}>🪄</button>
        <button title="Edit task" onClick={() => setIsEditing(true)}>✏️</button>
        <button title="Delete task" onClick={() => onDeleteTask(task.id)}>🗑️</button>
      </div>

      {showAddSubtaskForm && (
        <AddTaskForm 
          onSubmit={({ title, description }) => {
            onAddTask({ title, description, parentId: task.id });
            setShowAddSubtaskForm(false);
          }}
          onCancel={() => setShowAddSubtaskForm(false)}
        />
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          {task.subtasks.map(sub => (
            <TaskNode
              key={sub.id}
              task={sub}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskTree;
