import './App.css';
import { useState, useEffect, useMemo } from 'react';
import NavBar from './components/NavBar';
// import AddTaskForm from './components/AddTaskForm';
// import GoalSidebar from './components/GoalSidebar';
// import AddGoalForm from './components/AddGoalForm';
// import GoalDetailView from './components/GoalDetailView';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignUpForm';
import MainAppUI from './components/MainAppUI';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";



function App() {
  // const [goals, setGoals] = useState([]);
  // const [tasks, setTasks] = useState([]);
  // const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  // const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  // const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);

  function fetchWithAuth(url, options) {
    return fetch(url, { credentials: "include", ...options }).then(res => {
      if (res.status === 401) {
        // window.location.href = "/login";
        return Promise.reject({ unauthorized: true });
      }
      return res;
    });
  }

  useEffect(() => {
    fetchWithAuth("/api/goals")
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(true);
        // setGoals(data);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  // useEffect(() => {
  //   if (selectedGoal && isLoggedIn) {
  //     fetchWithAuth(`/api/goals/${selectedGoal.id}/tasks`).then(
  //       res => res.json()
  //     ).then(
  //       setTasks
  //     ).catch(console.error);
  //   }
  // }, [selectedGoal, isLoggedIn]);

  // useEffect(() => {
  // }, [selectedGoal]);

  // const refreshTasks = () => {
  //   if (!selectedGoal) return;
  //   fetchWithAuth(`/api/goals/${selectedGoal.id}/tasks`)
  //     .then(res => res.json())
  //     .then(setTasks);
  // };


  // const handleGoalAdded = (newGoal) => {
  //   setGoals(prev => [...prev, newGoal]);
  //   setShowAddGoalForm(false);
  // }

  // const handleAddGoalButtonClick = () => {
  //   setShowAddGoalForm(true);
  // }

  // const handleDeleteGoal = (goalId) => {
  //   fetchWithAuth(`/api/goals/${goalId}`, {
  //     method: "DELETE",
  //   }).then((res) => {
  //     if (!res.ok) throw new Error("Failed to delete goal");
  //     return res.json();
  //   }).then(() => {
  //     // localStorage.removeItem(`hideGoalGeneratePlan_${goalId}`);
  //     setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
  //     if (selectedGoal?.id === goalId) setSelectedGoalId(null);
  //   }).catch((err) => {
  //     console.error("Delete goal failed:", err);
  //   });
  // };

  // const handleUpdateGoal = (goalId, updatedFields) => {
  //   fetchWithAuth(`/api/goals/${goalId}`, {
  //     method: 'PUT',
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(updatedFields),
  //   })
  //   .then(res => res.json())
  //   .then(updatedGoal => {
  //     setGoals(prev =>
  //       prev.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal))
  //     );
  //   });
  // };

  // const handleAddTask = ({ title, parentId = null, description = "" }) => {
  //   if (!selectedGoal) return;

  //   fetchWithAuth(`/api/goals/${selectedGoal.id}/tasks`, {
  //     method: 'POST',
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ title, parent_id: parentId, description }),
  //   }).then(
  //     res => res.json()
  //   ).then(newTask => {
  //     refreshTasks();
  //   });
  // };

  // const handleUpdateTask = (taskId, updatedFields) => {
  //   fetchWithAuth(`/api/tasks/${taskId}`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(updatedFields),
  //   })
  //   .then(res => res.json())
  //   .then(updatedTask => {
  //     refreshTasks();
  //   });
  // };

  // const handleDeleteTask = (taskId) => {
  //   if (!taskId) {
  //     return;
  //   }
  //   fetchWithAuth(`/api/tasks/${taskId}`, {
  //     method: "DELETE",
  //   })
  //   .then(res => {
  //     if (!res.ok) throw new Error("Failed to delete task");
  //     // localStorage.removeItem(`hideTaskGeneratePlan_${taskId}`);
  //     refreshTasks();
  //   })
  //   .catch(err => console.error("Delete task failed:", err));
  // };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // fetchWithAuth("/api/goals").then(res => res.json()).then(setGoals);
  }

  const handleLogout = () => {
    fetch("/api/logout", { method: "POST", credentials: "include" })
      .then(() => setIsLoggedIn(false))
      .catch(console.error)
  };

  // if (!isLoggedIn) {
  //   return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  // }

  return (
    <Router>
      <NavBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <SignupForm onSignupSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <MainAppUI fetchWithAuth={fetchWithAuth} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
