import "./StatsCard.css";

// Simple inline SVG icons
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
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    plan: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    ),
    streak: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L4 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
    ),
    progress: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20V10M18 20V4M6 20v-4" />
        </svg>
    ),
};

function StatsCard({ title, value, subtitle, icon = "anime", variant }) {
    const numericValue = parseFloat(value);

    if (variant === "progress") {
        return (
            <div className="stats-card progress-card">
                <div className="stats-top">
                    <span className="stats-title">{title}</span>
                    <span className="stats-icon">{icons[icon] || icons.anime}</span>
                </div>
                <div className="progress-ring">
                    <svg viewBox="0 0 120 120">
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#e50914" />
                                <stop offset="100%" stopColor="#b20710" />
                            </linearGradient>
                        </defs>
                        <circle className="bg-ring" cx="60" cy="60" r="48" />
                        <circle
                            className="progress-ring-circle"
                            cx="60"
                            cy="60"
                            r="48"
                            stroke="url(#progressGradient)"
                            strokeDasharray="301.59"            /* 2 * π * 48 = 301.59 */
                            strokeDashoffset={301.59 - (numericValue / 100) * 301.59}
                        />
                    </svg>
                    <span className="ring-value">{value}</span>
                </div>
                {subtitle && <p className="stats-sub">{subtitle}</p>}
            </div>
        );
    }

    return (
        <div className="stats-card">
            <div className="stats-top">
                <span className="stats-title">{title}</span>
                <span className="stats-icon">{icons[icon] || icons.anime}</span>
            </div>
            <h2 className="stats-value">{value}</h2>
            {subtitle && <p className="stats-sub">{subtitle}</p>}
        </div>
    );
}

export default StatsCard;