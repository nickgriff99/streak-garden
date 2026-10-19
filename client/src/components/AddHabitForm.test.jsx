import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddHabitForm } from './AddHabitForm';
import { DEFAULT_SPECIES } from '../pixelart/plantSprites';

describe('AddHabitForm', () => {
  it('rejects an empty name submit without calling onAdd', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddHabitForm onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: /plant it/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name submit without calling onAdd', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddHabitForm onAdd={onAdd} />);

    await user.type(screen.getByPlaceholderText(/new habit/i), '   ');
    await user.click(screen.getByRole('button', { name: /plant it/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('calls onAdd with the trimmed name and the default species on a valid submit', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddHabitForm onAdd={onAdd} />);

    await user.type(screen.getByPlaceholderText(/new habit/i), '  Drink water  ');
    await user.click(screen.getByRole('button', { name: /plant it/i }));

    expect(onAdd).toHaveBeenCalledWith({ name: 'Drink water', species: DEFAULT_SPECIES });
  });

  it('calls onAdd with the chosen species when a non-default plant is picked', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddHabitForm onAdd={onAdd} />);

    await user.type(screen.getByPlaceholderText(/new habit/i), 'Water the garden');
    await user.click(screen.getByRole('radio', { name: /cactus/i }));
    await user.click(screen.getByRole('button', { name: /plant it/i }));

    expect(onAdd).toHaveBeenCalledWith({ name: 'Water the garden', species: 'cactus' });
  });
});
