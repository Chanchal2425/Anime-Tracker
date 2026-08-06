import React from "react";
import "./StatsCard.css";

// Enhanced SVG Icons with fill support
const icons = {
  anime: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  episodes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  time: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  completed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  streak: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
};

function StatsCard({ title, value, subtitle, icon = "anime", variant, color = "red" }) {
  // Extract numeric portion cleanly even if value is "75%" or "7 Days"
  const parsedValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  const numericValue = isNaN(parsedValue) ? 0 : Math.min(Math.max(parsedValue, 0), 100);

  // Progress Circle Geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const strokeDashoffset = circumference - (numericValue / 100) * circumference;

  if (variant === "progress") {
    return (
      <div className={`stats-card progress-card theme-${color}`}>
        <div className="stats-header">
          <span className="stats-title">{title}</span>
          <div className="stats-icon-badge">{icons[icon] || icons.anime}</div>
        </div>

        <div className="progress-ring-container">
          <svg viewBox="0 0 100 100" className="progress-svg">
            <defs>
              <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-start)" />
                <stop offset="100%" stopColor="var(--accent-end)" />
              </linearGradient>
            </defs>
            <circle className="bg-ring" cx="50" cy="50" r={radius} />
            <circle
              className="progress-ring-circle"
              cx="50"
              cy="50"
              r={radius}
              stroke={`url(#grad-${color})`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="ring-content">
            <span className="ring-value">{value}</span>
          </div>
        </div>

        {subtitle && <p className="stats-sub">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className={`stats-card theme-${color}`}>
      <div className="stats-header">
        <span className="stats-title">{title}</span>
        <div className="stats-icon-badge">{icons[icon] || icons.anime}</div>
      </div>
      
      <div className="stats-body">
        <h2 className="stats-value">{value}</h2>
        {subtitle && <p className="stats-sub">{subtitle}</p>}
      </div>
    </div>
  );
}

export default StatsCard;