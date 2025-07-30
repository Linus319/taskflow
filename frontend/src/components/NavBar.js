import React from "react";
import "./../css/NavBar.css";

export function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">Task Flow</div>
      <div className="navbar-links">
        <a href="/" className="navbar-link">Home</a>
      </div>
      <div className="navbar-actions">
        <button className="navbar-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
          Login
        </button>
      </div>
    </nav>
  );
}

export default NavBar;