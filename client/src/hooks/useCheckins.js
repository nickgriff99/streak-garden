import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export function useCheckins(habitId) {
  const [checkins, setCheckins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCheckins = useCallback(async () => {
    if (!habitId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/api/habits/${habitId}/checkins`);
      setCheckins(data.checkins);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  async function addCheckin() {
    const data = await apiClient.post(`/api/habits/${habitId}/checkins`, {});
    setCheckins((current) => [...current, data.checkin]);
  }

  return { checkins, isLoading, error, addCheckin, refetch: loadCheckins };
}
