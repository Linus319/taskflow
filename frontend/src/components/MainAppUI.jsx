import { useState, useEffect, useMemo } from "react";
import AddTaskForm from "./AddTaskForm";
import GoalSidebar from "./GoalSidebar";
import AddGoalForm from "./AddGoalForm";
import GoalDetailView from "./GoalDetailView";

export default function MainAppUI({ fetchWithAuth }) {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId),
    [goals, selectedGoalId]
  );

  useEffect(() => {
    fetchWithAuth("/api/goals")
      .then((res) => res.json())
      .then(setGoals)
      .catch(console.error);
  }, [fetchWithAuth]);

  useEffect(() => {
    if (selectedGoal) {
      fetchWithAuth(`/api/goals/${selectedGoal.id}/tasks`)
        .then((res) => res.json())
        .then(setTasks)
        .catch(console.error);
    }
  }, [selectedGoal, fetchWithAuth]);

  const refreshTasks = () => {
    if (!selectedGoal) return;
    fetchWithAuth(`/api/goals/${selectedGoal.id}/tasks`)
      .then((res) => res.json())
      .then(setTasks);
  };

  const handleGoalAdded = (title) => {
    const tempId = `temp-${Date.now()}`;
    const tempGoal = { id: tempId, title };

    setGoals((prev) => [...prev, tempGoal]);
    setShowAddGoalForm(false);
    setSelectedGoalId(tempId);

    fetchWithAuth("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    })
      .then((res) => res.json())
      .then((serverGoal) => {
        setGoals((prev) =>
          prev.map((g) => (g.id === tempId ? serverGoal : g))
        );
        setSelectedGoalId(serverGoal.id);
      })
      .catch((err) => {
        setGoals((prev) => prev.filter((g) => g.id !== tempId));
        console.error("Failed to add goal:", err);
      });
  };

  const handleDeleteGoal = (goalId) => {
    const prevGoals = goals;
    setGoals((prevGoals) => prevGoals.filter((g) => g.id !== goalId));
    if (selectedGoal?.id === goalId) setSelectedGoalId(null);

    fetchWithAuth(`/api/goals/${goalId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete goal");
        return res.json();
      })
      .catch((err) => {
        setGoals(prevGoals);
        console.error("Delete goal failed:", err)
      });
  };

  const handleUpdateGoal = (goalId, updatedFields) => {
    const oldGoals = goals;

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, ...updatedFields } : goal
      )
    );

    fetchWithAuth(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update goal");
        return res.json()
      })
      .then((updatedGoal) => {
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === updatedGoal.id ? { ...updatedGoal } : goal
          )
        );
      })
      .catch((err) => {
        console.error("Update goal failed:", err);
        setGoals(oldGoals);
      });
  };

  const handleAddTask = ({ title, parentId = null, description = "" }) => {
    if (!selectedGoal || String(selectedGoal.id).startsWith("temp-")) {
      alert("You can’t add tasks until the goal is saved to the server.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempTask = {
      id: tempId,
      goal_id: selectedGoal.id,
      parent_id: parentId,
      title,
      description,
    };

    setTasks(prev => [...prev, tempTask]);

    fetchWithAuth(`/api/goals/${selectedGoal.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parent_id: parentId, description }),
    })
      .then((res) => res.json())
      .then((serverTask) => {
        setTasks(prev =>
          prev.map(t => (t.id === tempId ? serverTask : t))
        );
      })
      .catch((err) => {
        setTasks(prev => prev.filter(t => t.id !== tempId));
        console.error("Failed to add task:", err);
        alert("Failed to add task.");
      })
  };

  const handleUpdateTask = (taskId, updatedFields) => {
    const prevTasks = tasks;

    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...updatedFields } : t))
    );

    fetchWithAuth(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update task");
        return res.json();
      })
      .then((serverTask) => {
        setTasks(prev =>
          prev.map(t => (t.id === serverTask.id ? serverTask : t))
        );
      })
      .catch((err) => {
        console.error("Update task failed:", err);
        setTasks(prevTasks);
        alert("Failed to update task. Please try again.");
      });
  };

  const handleBatchUpdateTasks = (updates) => {
    const prevTasks = tasks;

    setTasks(prev =>
      prev.map(task => {
        const update = updates.find(u => u.id === task.id);
        return update ? { ...task, order_idx: update.order_idx } : task;
      })
    );

    fetchWithAuth('/api/tasks/batch-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to batch update tasks');
        return res.json();
      })
      .then(() => refreshTasks())
      .catch((err) => {
        console.error('Batch update failed:', err);
        setTasks(prevTasks);
        alert('Failed to reorder tasks. Please try again.');
      });
  };

  const handleDeleteTask = (taskId) => {
    const prevTasks = tasks;

    setTasks(prev => prev.filter(t => t.id !== taskId));

    fetchWithAuth(`/api/tasks/${taskId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete task");
      })
      .catch((err) => {
        console.error("Delete task failed:", err);
        setTasks(prevTasks);
        alert("Failed to delete task. Please try again.");
      });

  };

  return (
    <div className="app-container">
      <GoalSidebar
        goals={goals}
        selectedGoalId={selectedGoal?.id}
        onSelect={(goal) => setSelectedGoalId(goal.id)}
        onAdd={() => { setShowAddGoalForm(true) }}
      />
      {showAddGoalForm && (
        <AddGoalForm
          onSubmit={handleGoalAdded}
          onCancel={() => setShowAddGoalForm(false)}
        />
      )}
      <div className="main">
        <GoalDetailView
          goal={selectedGoal}
          tasks={tasks}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          refreshTasks={refreshTasks}
          onDeleteGoal={handleDeleteGoal}
          onUpdateGoal={handleUpdateGoal}
          onBatchUpdateTasks={handleBatchUpdateTasks}
        />
        {showAddTaskForm && (
          <AddTaskForm
            goalId={selectedGoal?.id}
            onSubmit={(title, description) =>
              handleAddTask({ title, parentId: null, description })
            }
            onCancel={() => setShowAddTaskForm(false)}
          />
        )}
      </div>
    </div>
  );
}
