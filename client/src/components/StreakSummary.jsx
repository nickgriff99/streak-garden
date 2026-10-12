export function StreakSummary({ habits }) {
  const totalHabits = habits.length;
  const activeStreaks = habits.filter((habit) => habit.growth.streak > 0).length;
  const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.growth.streak), 0);

  return (
    <div className="streak-summary">
      <p>{totalHabits} habits planted</p>
      <p>{activeStreaks} growing right now</p>
      <p>Longest streak: {longestStreak} days</p>
    </div>
  );
}
