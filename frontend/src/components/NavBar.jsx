import { Link } from "react-router-dom";
import "./../css/NavBar.css";

export function NavBar({ isLoggedIn, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Task Flow</Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className="navbar-link">Home</Link>
      </div>

      <div className="navbar-actions">
        {!isLoggedIn && (
          <>
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/signup" className="navbar-link">Sign Up</Link>
          </>
        )}
        {isLoggedIn && (
          <button
            className="navbar-link navbar-logout"
            onClick={onLogout}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default NavBar;