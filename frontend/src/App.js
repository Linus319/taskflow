import './App.css';
import { useState, useEffect, useMemo } from 'react';
import NavBar from './components/NavBar';
import AddTaskForm from './components/AddTaskForm';
import GoalSidebar from './components/GoalSidebar';
import AddGoalForm from './components/AddGoalForm';
import GoalDetailView from './components/GoalDetailView';

function App() {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);

  useEffect(() => {
    fetch("/api/goals").then(
      res => res.json()
    ).then(
      setGoals
    );
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      fetch(`/api/goals/${selectedGoal.id}/tasks`).then(
        res => res.json()
      ).then(
        setTasks
      );
    }
  }, [selectedGoal]);

  useEffect(() => {
  }, [selectedGoal]);

  const refreshTasks = () => {
    if (!selectedGoal) return;
    fetch(`/api/goals/${selectedGoal.id}/tasks`)
      .then(res => res.json())
      .then(setTasks);
  };


  const handleGoalAdded = (newGoal) => {
    setGoals(prev => [...prev, newGoal]);
    setShowAddGoalForm(false);
  }

  const handleAddGoalButtonClick = () => {
    setShowAddGoalForm(true);
  }

  const handleDeleteGoal = (goalId) => {
    fetch(`/api/goals/${goalId}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    }).then(() => {
      // localStorage.removeItem(`hideGoalGeneratePlan_${goalId}`);
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      if (selectedGoal?.id === goalId) setSelectedGoalId(null);
    }).catch((err) => {
      console.error("Delete goal failed:", err);
    });
  };

  const handleUpdateGoal = (goalId, updatedFields) => {
    fetch(`/api/goals/${goalId}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    })
    .then(res => res.json())
    .then(updatedGoal => {
      setGoals(prev =>
        prev.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal))
      );
    });
  };

  const handleAddTask = ({ title, parentId = null, description = "" }) => {
    if (!selectedGoal) return;

    fetch(`/api/goals/${selectedGoal.id}/tasks`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parent_id: parentId, description }),
    }).then(
      res => res.json()
    ).then(newTask => {
      refreshTasks();
    });
  };

  const handleUpdateTask = (taskId, updatedFields) => {
    fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    })
    .then(res => res.json())
    .then(updatedTask => {
      refreshTasks();
    });
  };

  const handleDeleteTask = (taskId) => {
    if (!taskId) {
      return;
    }
    fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to delete task");
      // localStorage.removeItem(`hideTaskGeneratePlan_${taskId}`);
      refreshTasks();
    })
    .catch(err => console.error("Delete task failed:", err));
  };



  
  return (
    <div className="app-container">
      <NavBar />
      <GoalSidebar
        goals={goals}
        selectedGoalId={selectedGoal?.id}
        onSelect={(goal) => setSelectedGoalId(goal.id)}        
        onAdd={handleAddGoalButtonClick}
        onDelete={handleDeleteGoal}
        onUpdate={handleUpdateGoal}
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
        />
        {showAddTaskForm && (
          <AddTaskForm
            goalId={selectedGoal?.id}
            onSubmit={(title, description) => {
              handleAddTask({ title, parentId: null, description });
            }}
            onCancel={() => setShowAddTaskForm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
