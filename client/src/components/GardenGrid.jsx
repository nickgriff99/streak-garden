import { HabitPlant } from './HabitPlant';

export function GardenGrid({ habits }) {
  if (habits.length === 0) {
    return <p>No habits yet. Plant your first one below.</p>;
  }

  return (
    <div className="garden-grid">
      {habits.map((habit) => (
        <HabitPlant key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
