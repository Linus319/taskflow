import { useState, useCallback, useMemo } from "react";
import '../css/Task.css';
import AddTaskForm from "./AddTaskForm";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function buildTaskTree(tasks) {
  if (!tasks || tasks.length === 0) return [];

  const taskMap = {};
  const roots = [];

  tasks.forEach(task => {
    taskMap[task.id] = { ...task, subtasks: [] };
  });

  tasks.forEach(task => {
    if (task.parent_id) {
      const parent = taskMap[task.parent_id];
      if (parent) {
        parent.subtasks.push(taskMap[task.id]);
      }
    } else {
      roots.push(taskMap[task.id]);
    }
  });

  const sortByOrder = (taskList) => {
    taskList.sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
    taskList.forEach(task => sortByOrder(task.subtasks));
  };

  sortByOrder(roots);
  return roots;
}

function TaskTree({ tasks, onAddTask, onUpdateTask, onDeleteTask, refreshTasks }) {
  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const handleAddTask = useCallback((taskData) => {
    onAddTask(taskData);
  }, [onAddTask]);

  const handleUpdateTask = useCallback((taskId, updates) => {
    onUpdateTask(taskId, updates);
  }, [onUpdateTask]);

  const handleDeleteTask = useCallback((taskId) => {
    onDeleteTask(taskId);
  }, [onDeleteTask]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return; 

    const activeTask = tasks.find(task => task.id === active.id);
    const overTask = tasks.find(task => task.id === over.id);

    if (!activeTask || !overTask) return;

    const activeParentId = activeTask.parent_id;
    const overParentId = overTask.parent_id;

    if (activeParentId !== overParentId) {
      console.log('Cannot reorder across different parent levels');
      return;
    }

    const siblings = tasks
      .filter(task => task.parent_id === activeParentId)
      .sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));

    const activeIndex = siblings.findIndex(task => task.id === active.id);
    const overIndex = siblings.findIndex(task => task.id === over.id);

    if (activeIndex === overIndex) return;

    const reorderedSiblings = [...siblings];
    const [movedTask] = reorderedSiblings.splice(activeIndex, 1);
    reorderedSiblings.splice(overIndex, 0, movedTask);

    const updates = reorderedSiblings.map((task, index) => ({
      id: task.id,
      order_idx: index
    }));

    updates.forEach(({ id, order_idx }) => {
      onUpdateTask(id, { order_idx });
    });
  }

  if (!taskTree.length) {
    return (
      <div className="task-tree empty">
        <p>No tasks yet. Add your first task to get started!</p>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="task-tree">
        <SortableContext items={taskTree.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {taskTree.map((task) => (
            <TaskNode
              key={task.id}
              task={task}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              refreshTasks={refreshTasks}
              // level={0} 
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

function TaskEditor({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  const handleSave = () => {
    if (!title.trim()) {
      alert('Task title is required');
      return;
    }
    onSave({ title: title.trim(), description: description.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="task-editor">
      <input 
        type="text" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title"
        autoFocus
      />
      <textarea 
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
      />
      <div className="editor-actions">
        <button onClick={handleSave} disabled={!title.trim()}>
          Save
        </button>
        <button onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function TaskActions({ 
  task, 
  onAddSubtask, 
  onEdit, 
  onDelete, 
  onGeneratePlan, 
  isGeneratingPlan 
}) {
  const canGeneratePlan = task.subtasks?.length === 0;

  return (
    <div className="task-actions">
      <button 
        className="action-btn add-subtask" 
        title="Add subtask" 
        onClick={onAddSubtask}
        aria-label="Add subtask"
      >
        ➕
      </button>
      
      {canGeneratePlan && (
        <button 
          className={`action-btn generate-plan ${isGeneratingPlan ? 'loading' : ''}`}
          title="Generate plan" 
          onClick={onGeneratePlan}
          disabled={isGeneratingPlan}
          aria-label="Generate plan"
        >
          {isGeneratingPlan ? '⏳' : '🪄'}
        </button>
      )}
      
      <button 
        className="action-btn edit" 
        title="Edit task" 
        onClick={onEdit}
        aria-label="Edit task"
      >
        ✏️
      </button>
      
      <button 
        className="action-btn delete" 
        title="Delete task" 
        onClick={onDelete}
        aria-label="Delete task"
      >
        🗑️
      </button>
    </div>
  );
}

function TaskNode({ task, onAddTask, onUpdateTask, onDeleteTask, refreshTasks, level = 0 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleToggleComplete = useCallback(async () => {
    const newStatus = task.status === "done" ? "active" : "done";
    try {
      await onUpdateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status');
    }
  }, [task.id, task.status, onUpdateTask]);

  const handleGeneratePlan = useCallback(async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await refreshTasks();
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert("Could not generate plan for this task");
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [task.id, refreshTasks]);

  const handleSaveEdit = useCallback(({ title, description }) => {
    onUpdateTask(task.id, { title, description });
    setIsEditing(false);
  }, [task.id, onUpdateTask]);

  const handleAddSubtask = useCallback(({ title, description }) => {
    onAddTask({ title, description, parentId: task.id });
    setShowAddSubtaskForm(false);
  }, [task.id, onAddTask]);

  const handleDelete = useCallback(() => {
    onDeleteTask(task.id);
  }, [task.id, onDeleteTask]);

  const taskClasses = [
    'task-node',
    task.status,
    task.parent_id ? 'nested-task' : 'root-task',
    `level-${level}`,
    `${isDragging ? 'dragging' : ''}`,
  ].filter(Boolean).join(' ');

  const checkboxClasses = [
    'custom-checkbox',
    task.status === 'done' ? 'checked' : ''
  ].filter(Boolean).join(' ');

  if (isEditing) {
    return (
      <div className={taskClasses}>
        <TaskEditor
          task={task}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={taskClasses} {...attributes}>
      <div className="task-row">
        <div className="drag-handle" {...listeners}>⋮⋮</div>
        <div
          className={checkboxClasses}
          onClick={handleToggleComplete}
          title={task.status === "done" ? "Mark as active" : "Mark complete"}
          role="checkbox"
          aria-checked={task.status === "done"}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleComplete();
            }
          }}
        >
          {task.status === "done" && <span className="checkmark">✔</span>}
        </div>

        <div className="task-content">
          <span className="task-title">{task.title}</span>
          {task.description && (
            <span className="task-description">{task.description}</span>
          )}
        </div>

        <TaskActions
          task={task}
          onAddSubtask={() => setShowAddSubtaskForm(true)}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onGeneratePlan={handleGeneratePlan}
          isGeneratingPlan={isGeneratingPlan}
        />
      </div>

      {showAddSubtaskForm && (
        <div className="add-subtask-form">
          <AddTaskForm 
            onSubmit={handleAddSubtask}
            onCancel={() => setShowAddSubtaskForm(false)}
          />
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          <SortableContext items={task.subtasks.map(subtask => subtask.id)} strategy={verticalListSortingStrategy} >
            {task.subtasks.map((subtask) => (
              <TaskNode
                key={subtask.id}
                task={subtask}
                onAddTask={onAddTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                refreshTasks={refreshTasks}
                level={level + 1}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default TaskTree;