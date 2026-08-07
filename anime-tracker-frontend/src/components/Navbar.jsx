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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userKey = user?.id || user?.username;
  const storedAvatar = userKey ? localStorage.getItem(`user_avatar_${userKey}`) : null;
  const avatarSrc = user?.avatar || storedAvatar;

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-left">
            {/* Hamburger Toggle placed before logo */}
            <button 
              className={`hamburger ${mobileMenuOpen ? "active" : ""}`} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>

            <Link to="/" className="logo-container" onClick={closeMenu}>
              <img src={logoImg} alt="AnimeTracker Logo" className="logo-img" />
              <h2 className="logo">AnimeTracker</h2>
            </Link>
          </div>

          <div className={`nav-content ${mobileMenuOpen ? "open" : ""}`}>
            <div className="nav-center">
              <Link to="/" className={location.pathname === "/" ? "active-link" : ""} onClick={closeMenu}>Home</Link>
              <Link to="/anime" className={location.pathname === "/anime" ? "active-link" : ""} onClick={closeMenu}>My List</Link>
              <Link to="/add" className={location.pathname === "/add" ? "active-link" : ""} onClick={closeMenu}>Add</Link>
              <Link to="/recommendations" className={location.pathname === "/recommendations" ? "active-link" : ""} onClick={closeMenu}>AI Picks</Link>
            </div>

            <div className="nav-right">
              {user ? (
                <div
                  className="user-pill"
                  onClick={() => {
                    setShowSettings(true);
                    closeMenu();
                  }}
                  title="Account Settings"
                >
                  <div className="avatar">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" />
                    ) : (
                      user?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span>Hi, <strong>{user.username}</strong></span>
                </div>
              ) : (
                <Link to="/login" className="login-btn" onClick={closeMenu}>Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

export default Navbar;