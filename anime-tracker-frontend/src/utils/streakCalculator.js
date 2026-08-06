/**
 * Calculates consecutive daily activity streak.
 * @param {Array<string|Date>} activityDates - Array of activity timestamps or ISO date strings.
 * @returns {number} Current streak count in days.
 */
export function calculateStreak(activityDates = []) {
  if (!activityDates || activityDates.length === 0) return 0;

  // 1. Normalize dates to 'YYYY-MM-DD' strings in local time to ignore hours/minutes
  const uniqueDays = Array.from(
    new Set(
      activityDates.map((d) => {
        const dateObj = new Date(d);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      })
    )
  ).sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)

  if (uniqueDays.length === 0) return 0;

  // 2. Format Today & Yesterday
  const today = new Date();
  const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatLocalDate(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  // 3. Check if the streak is active (activity must exist today or yesterday)
  const newestActivity = uniqueDays[0];
  if (newestActivity !== todayStr && newestActivity !== yesterdayStr) {
    return 0; // Streak broken if no log today or yesterday
  }

  // 4. Count consecutive days backwards
  let streak = 0;
  let checkDate = new Date(newestActivity);

  for (const dayStr of uniqueDays) {
    const current = formatLocalDate(checkDate);
    if (dayStr === current) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1); // Move to previous expected day
    } else {
      break; // Gap detected
    }
  }

  return streak;
}