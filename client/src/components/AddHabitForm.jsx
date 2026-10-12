import { useState } from 'react';

export function AddHabitForm({ onAdd }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd(name.trim());
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-habit-form">
      <input
        type="text"
        placeholder="New habit, e.g. Drink water"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit" disabled={isSubmitting}>
        Plant it
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
