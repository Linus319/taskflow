import { useState, useEffect } from "react";
import '../css/Task.css';
import AddTaskForm from "./AddTaskForm";
import {DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd"

function buildTaskTree(tasks) {
  const taskMap = {};
  const roots = [];

  // Index tasks by id
  tasks.forEach(task => {
    taskMap[task.id] = {...task, subtasks: []};
  });

  // Build tree
  tasks.forEach(task => {
    if (task.parent_id) {
      const parent = taskMap[task.parent_id];
      if (parent) parent.subtasks.push(taskMap[task.id]);
    } else {
      roots.push(taskMap[task.id]);
    }
  });

  const sortByOrder = (taskList) => {
    taskList.sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
    taskList.forEach(t => sortByOrder(t.subtasks));
  };

  sortByOrder(roots);

  console.log("ROOTS:\n", roots);

  return roots;
}

function findTaskById(tasks, id) {
  for (let task of tasks) {
    if (task.id === id) return task;
    const found = findTaskById(task.subtasks, id);
    if (found) return found;
  }
  return null;
}

function updateSubtaskList(tasks, parentId, newSubtasks) {
  return tasks.map(task => {
    if (task.id === parentId) {
      return { ...task, subtasks: newSubtasks };
    }
    return { ...task, subtasks: updateSubtaskList(task.subtasks, parentId, newSubtasks) };
  });
}



function TaskTree({ tasks, onAddTask, onUpdateTask, onDeleteTask, refreshTasks, goalId }) {
  // console.log("tasks received as props in tasktree:", tasks);
  const [taskTree, setTaskTree] = useState(buildTaskTree(tasks));
  // console.log("TASKTREE TASKS:\n", taskTree);

  useEffect(() => {
    setTaskTree(buildTaskTree(tasks));
  }, [tasks])

  const handleDragEnd = async (result) => {
    
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceId = source.droppableId;
    const isRoot = sourceId === "root";

    let updatedList;
    if (isRoot) {
      updatedList = Array.from(taskTree);
    } else {
      const parentId = parseInt(sourceId.replace("sub-", ""), 10);
      const parentTask = findTaskById(taskTree, parentId);
      updatedList = Array.from(parentTask.subtasks);
    }

    const [moved] = updatedList.splice(source.index, 1);
    updatedList.splice(destination.index, 0, moved);

    if (isRoot) {
      setTaskTree(updatedList);
    } else {
      const parentId = parseInt(sourceId.replace("sub-", ""), 10);
      setTaskTree(prev => updateSubtaskList(prev, parentId, updatedList));
    }

    let url;
    if (isRoot) {
      url = `/api/goals/${goalId}/tasks/reorder`;
    } else {
      const parentId = parseInt(sourceId.replace("sub-", ""), 10);
      url = `/api/tasks/${parentId}/reorder`;
    }

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ordered_ids: updatedList.map((t, idx) => ({
          id: t.id,
          order_idx: idx
        }))
      })
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="root" type="TASK">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="task-tree">
            <div className="task-tree">
              {taskTree.map((task, index) => (
                <TaskNode
                  key={task.id}
                  task={task}
                  onAddTask={onAddTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  refreshTasks={refreshTasks}
                  index={index}
                />
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}




function TaskNode({ task, onAddTask, onUpdateTask, onDeleteTask, refreshTasks, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [newDescription, setNewDescription] = useState(task.description);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const toggleComplete = async () => {
    const newStatus = task.status === "done" ? "active" : "done";
    await onUpdateTask(task.id, { status: newStatus });
  }

  async function handleGeneratePlan(taskId) {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to generate plan");
      refreshTasks();

    } catch (err) {
      console.error(err);
      alert("Could not generate plan for this task");
    } finally {
      setIsGeneratingPlan(false);
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
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided) => (
        <div 
          {...provided.draggableProps} 
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          className={task.status}
        >
          <div className={`task-node ${task.status} ${task.parent_id ? "nested-task" : ""}`}>
            <div className="task-row">
              <div
                className={`custom-checkbox ${task.status === "done" ? "checked" : ""}`}
                onClick={toggleComplete}
                title={task.status === "done" ? "Mark as active" : "Mark complete"}
              >
                {task.status === "done" && <span className="checkmark">✔</span>}
              </div>
              <div className="task-content">
                <span>{task.title}</span>
                {task.description && (
                  <span className="task-description">{task.description}</span>
                )}
              </div>
              <button title="Add subtask" onClick={() => setShowAddSubtaskForm(true)}>➕</button>
              {task.subtasks?.length === 0 && (
                <button 
                  title="Generate plan" 
                  onClick={() => handleGeneratePlan(task.id)}
                  disabled={isGeneratingPlan}
                  className={`generate-plan-btn ${isGeneratingPlan ? 'loading' : ''}`}
                >
                  {isGeneratingPlan ? '⏳' : '🪄'}
                </button>
              )}
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
              <Droppable droppableId={`sub-${task.id}`} type="TASK">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="subtasks">
                    {task.subtasks.map((sub, i) => (
                      <TaskNode
                        key={sub.id}
                        task={sub}
                        index={i}
                        onAddTask={onAddTask}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        refreshTasks={refreshTasks}
                      />
                    ))}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default TaskTree;
