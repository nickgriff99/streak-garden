import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHabits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/habits');
      setHabits(data.habits);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  async function addHabit({ name, species }) {
    const data = await apiClient.post('/api/habits', { name, species });
    setHabits((current) => [...current, data.habit]);
  }

  return { habits, isLoading, error, addHabit, refetch: loadHabits };
}
