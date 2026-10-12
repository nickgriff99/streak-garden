import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HabitPlant } from './HabitPlant';

function renderPlant(growth) {
  const habit = { id: 'habit-1', name: 'Drink water', growth };
  render(
    <MemoryRouter>
      <HabitPlant habit={habit} />
    </MemoryRouter>
  );
}

describe('HabitPlant', () => {
  it('shows the sapling stage and streak count for a healthy growing habit', () => {
    renderPlant({ streak: 5, stage: 'sapling', isWilted: false });

    expect(screen.getByText('🪴')).toBeInTheDocument();
    expect(screen.getByText('5 day streak')).toBeInTheDocument();
    expect(screen.queryByText(/wilted/)).not.toBeInTheDocument();
  });

  it('shows the seed stage for a brand new habit with no streak yet', () => {
    renderPlant({ streak: 0, stage: 'seed', isWilted: false });

    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('0 day streak')).toBeInTheDocument();
  });

  it('marks a wilted habit visually and in its streak label', () => {
    renderPlant({ streak: 0, stage: 'seed', isWilted: true });

    expect(screen.getByText('0 day streak (wilted)')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link.className).toContain('wilted');
  });
});
