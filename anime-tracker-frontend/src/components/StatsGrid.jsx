import StatsCard from "../components/StatsCard";

function StatsGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-container">
      <StatsCard
        title="Total Anime"
        value={stats.total_anime}
        subtitle="Your collection"
        icon="anime"
      />
      <StatsCard
        title="Episodes Watched"
        value={stats.total_episodes_watched}
        subtitle="Keep going 🔥"
        icon="episodes"
      />
      <StatsCard
        title="Watch Time"
        value={`${stats.total_watch_time_hours?.toFixed(1) || 0} hrs`}
        subtitle="Time invested"
        icon="time"
      />
      <StatsCard
        title="Completed"
        value={stats.completed}
        subtitle="Finished shows"
        icon="completed"
      />
      <StatsCard
        title="Plan to Watch"
        value={stats.plan_to_watch}
        subtitle="Future goals"
        icon="plan"
      />
      <StatsCard
        title="Streak"
        value={`${stats.streak_days} days`}
        subtitle="Consistency matters"
        icon="streak"
      />
      <StatsCard
        title="Completion"
        value={`${Math.round(stats.completion_percentage)}%`}
        subtitle="Overall progress"
        icon="progress"
        variant="progress"
      />
    </div>
  );
}

export default StatsGrid;