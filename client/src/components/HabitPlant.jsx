import { Link } from 'react-router-dom';

const STAGE_EMOJI = {
  seed: '🌱',
  sprout: '🌿',
  sapling: '🪴',
  bloom: '🌷',
  flourishing: '🌳',
};

export function HabitPlant({ habit }) {
  const { id, name, growth } = habit;
  const emoji = STAGE_EMOJI[growth.stage] || STAGE_EMOJI.seed;

  return (
    <Link to={`/habits/${id}`} className={`habit-plant ${growth.isWilted ? 'wilted' : ''}`}>
      <span className="habit-plant-emoji">{emoji}</span>
      <span className="habit-plant-name">{name}</span>
      <span className="habit-plant-streak">
        {growth.streak} day streak{growth.isWilted ? ' (wilted)' : ''}
      </span>
    </Link>
  );
}
