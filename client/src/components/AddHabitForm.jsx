import { useState } from 'react';
import { PixelPlant } from './PixelPlant';
import { DEFAULT_SPECIES, PLANT_SPECIES, SPECIES_LABELS } from '../pixelart/plantSprites';

export function AddHabitForm({ onAdd }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(DEFAULT_SPECIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd({ name: name.trim(), species });
      setName('');
      setSpecies(DEFAULT_SPECIES);
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
      <fieldset className="species-picker">
        <legend>Pick a plant</legend>
        {PLANT_SPECIES.map((speciesOption) => (
          <label key={speciesOption} className="species-option">
            <input
              type="radio"
              name="species"
              value={speciesOption}
              checked={species === speciesOption}
              onChange={() => setSpecies(speciesOption)}
            />
            <PixelPlant species={speciesOption} stage="seed" size={28} />
            {SPECIES_LABELS[speciesOption]}
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={isSubmitting}>
        Plant it
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
