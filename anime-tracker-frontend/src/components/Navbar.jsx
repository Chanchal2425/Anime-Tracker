
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="logo-glow"></div>
        <h2 className="logo">AnimeTracker</h2>
      </div>

      <div className="nav-center">
        <Link
          to="/"
          className={location.pathname === "/" ? "active-link" : ""}
        >
          Home
        </Link>

        <Link
          to="/anime"
          className={location.pathname === "/anime" ? "active-link" : ""}
        >
          My List
        </Link>

        <Link
          to="/add"
          className={location.pathname === "/add" ? "active-link" : ""}
        >
          Add
        </Link>

        <Link
          to="/recommendations"
          className={location.pathname === "/recommendations" ? "active-link" : ""}
        >
          AI Picks
        </Link>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <div className="user-pill">
              <div className="avatar">
                {user.username?.charAt(0).toUpperCase()}
              </div>

              <span>
                Hi, <strong>{user.username}</strong>
              </span>
            </div>

            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-btn">
              Login
            </Link>

            <Link to="/register" className="register-btn">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
