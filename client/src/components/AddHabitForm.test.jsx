import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddHabitForm } from './AddHabitForm';

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

  it('calls onAdd with the trimmed name on a valid submit', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddHabitForm onAdd={onAdd} />);

    await user.type(screen.getByPlaceholderText(/new habit/i), '  Drink water  ');
    await user.click(screen.getByRole('button', { name: /plant it/i }));

    expect(onAdd).toHaveBeenCalledWith('Drink water');
  });
});
