import React from 'react';


function buildTaskTree(tasks) {
  const taskMap = {};
  const roots = [];

  // Index tasks by id
  tasks.forEach(task => {
    task.subtasks = [];
    taskMap[task.id] = task;
  });

  // Build tree
  tasks.forEach(task => {
    if (task.parent_id) {
      const parent = taskMap[task.parent_id];
      if (parent) parent.subtasks.push(task);
    } else {
      roots.push(task);
    }
  });

  return roots;
}


function TaskTree({ tasks, onAddTask, onUpdateTask, onDeleteTask }) {
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
        />
      ))}
    </div>
  );
}

function TaskNode({ task, onAddTask, onUpdateTask, onDeleteTask }) {
  return (
    <div className="task-node" style={{ marginLeft: task.parent_id ? 20 : 0 }}>
      <div className="task-row">
        <span>{task.title}</span>
        <button onClick={() => onAddTask(task.id, prompt("New subtask title:"))}>➕</button>
        <button onClick={() => onUpdateTask(task.id)}>✏️</button>
        <button onClick={() => onDeleteTask(task.id)}>🗑️</button>
      </div>
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
