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
    console.log("Selected goal updated:", selectedGoal);
  }, [selectedGoal]);


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

  // task CRUD
  const handleAddTask = (title, parentId = null) => {
    if (!selectedGoal) {
      console.log("no goal selected when adding task")
      return;
    }

    console.log("selectedGoal is:", selectedGoal);

    console.log("sending task:", { title, parentId})

    fetch(`/api/goals/${selectedGoal.id}/tasks`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parent_id: parentId }),
    }).then(
      res => res.json()
    ).then(newTask => {
      setTasks(prev => [...prev, newTask]);
    });
  };

  const handleUpdateTask = (taskId, updatedFields) => {
    console.log('sharting update task');
    console.log('updated fields:', updatedFields);

    fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    })
    .then(res => res.json())
    .then(updatedTask => {
      setTasks(prev =>
        prev.map(task => (task.id === updatedTask.id ? updatedTask : task))
      );
    });
  };

  const handleDeleteTask = (taskId) => {
    if (!taskId) {
      console.log("no task id in handleDeleteTask");
      return;
    }

    console.log("starting delete task with task id:", taskId);

    fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks(prev => prev.filter(task => task.id !== taskId));
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
        />
        {showAddTaskForm && (
          <AddTaskForm
            goalId={selectedGoal?.id}
            onSubmit={(title) => {
              console.log("calling handleAddTask from app with title:", title);
              handleAddTask(title, null);
            }}
            onCancel={() => setShowAddTaskForm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
