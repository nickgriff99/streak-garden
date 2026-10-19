import { Link } from 'react-router-dom';
import { PixelPlant } from './PixelPlant';

export function HabitPlant({ habit }) {
  const { id, name, species, growth } = habit;

  return (
    <Link to={`/habits/${id}`} className={`habit-plant ${growth.isWilted ? 'wilted' : ''}`}>
      <PixelPlant species={species} stage={growth.stage} />
      <span className="habit-plant-name">{name}</span>
      <span className="habit-plant-streak">
        {growth.streak} day streak{growth.isWilted ? ' (wilted)' : ''}
      </span>
    </Link>
  );
}
