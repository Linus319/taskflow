import './App.css';
import { useState, useEffect, useMemo } from 'react';
import NavBar from './components/NavBar';
import TaskTree from './components/TaskTree';
import GoalList from "./components/GoalList";
import AddTaskForm from './components/AddTaskForm';
import GoalSidebar from './components/GoalSidebar';
import AddGoalForm from './components/AddGoalForm';
import GoalDetailView from './components/GoalDetailView';

function App() {
  const [goals, setGoals] = useState([]);
  // const [selectedGoal, setSelectedGoal] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);

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

  function nestTasks(flatTasks) {
    const taskMap = {};
    flatTasks.forEach(task => taskMap[task.id] = { ...task, subtasks: [] });

    const rootTasks = [];

    flatTasks.forEach(task => {
      if (task.parent_id) {
        taskMap[task.parent_id]?.subtasks.push(taskMap[task.id]);
      } else {
        rootTasks.push(taskMap[task.id]);
      }
    });

    return rootTasks;
  }

  // const addTask = task => setTasks(prev => [...prev, task]);

  // const handleAddGoal = (title) => {
  //   fetch('/api/goals', {
  //     method: 'POST',
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ title })
  //   }).then(
  //     res => res.json()
  //   ).then(newGoal => {
  //     setGoals(prevGoals => [...prevGoals, newGoal]);
  //     setShowAddGoalForm(false);
  //   });
  // };

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
  const handleAddTask = (parentId = null, title) => {
    if (!selectedGoal) return;

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
      {/* <NavBar /> */}
      <GoalSidebar
        goals={goals}
        selectedGoalId={selectedGoal?.id}
        onSelect={(goal) => setSelectedGoalId(goal.id)}  // ✅ this updates selected goal        
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
      </div>
    </div>
  );
}

export default App;
