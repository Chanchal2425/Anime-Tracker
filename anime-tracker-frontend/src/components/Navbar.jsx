import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserSettingsModal from "./UserSettingsModal";
import logoImg from "../assets/logo.png";
import "../App.css";

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  // Derive active user key for user-scoped storage retrieval
  const userKey = user?.id || user?.username;
  const storedAvatar = userKey ? localStorage.getItem(`user_avatar_${userKey}`) : null;
  const avatarSrc = user?.avatar || storedAvatar;

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="logo-container">
            <img src={logoImg} alt="AnimeTracker Logo" className="logo-img" />
            <h2 className="logo">AnimeTracker</h2>
          </Link>
        </div>

        <div className="nav-center">
          <Link to="/" className={location.pathname === "/" ? "active-link" : ""}>Home</Link>
          <Link to="/anime" className={location.pathname === "/anime" ? "active-link" : ""}>My List</Link>
          <Link to="/add" className={location.pathname === "/add" ? "active-link" : ""}>Add</Link>
          <Link to="/recommendations" className={location.pathname === "/recommendations" ? "active-link" : ""}>AI Picks</Link>
        </div>

        <div className="nav-right">
          {user ? (
            /* Clicking the profile pill opens the full-page settings */
            <div
              className="user-pill"
              onClick={() => setShowSettings(true)}
              style={{ cursor: "pointer" }}
              title="Click to open full Account Settings"
            >
              <div className="avatar">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>

              <span>
                Hi, <strong>{user.username}</strong>
              </span>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-btn">Login</Link>
            </>
          )}
        </div>
      </nav>

      {/* Full-Page Settings View Modal */}
      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

export default Navbar;