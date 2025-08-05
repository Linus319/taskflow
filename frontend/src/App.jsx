import './App.css';
import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignUpForm';
import MainAppUI from './components/MainAppUI';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function fetchWithAuth(url, options) {
    return fetch(url, { credentials: "include", ...options }).then(res => {
      if (res.status === 401) {
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
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  }

  const handleLogout = () => {
    fetch("/api/logout", { method: "POST", credentials: "include" })
      .then(() => setIsLoggedIn(false))
      .catch(console.error)
  };

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
