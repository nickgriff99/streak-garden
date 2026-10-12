import { GardenGrid } from '../components/GardenGrid';
import { AddHabitForm } from '../components/AddHabitForm';
import { StreakSummary } from '../components/StreakSummary';
import { useHabits } from '../hooks/useHabits';

export function GardenPage() {
  const { habits, isLoading, error, addHabit } = useHabits();

  if (isLoading) return <p>Loading your garden...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="page garden-page">
      <h1>Your garden</h1>
      <StreakSummary habits={habits} />
      <GardenGrid habits={habits} />
      <AddHabitForm onAdd={addHabit} />
    </div>
  );
}
