import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function usePersonas() {
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/personas')
      .then((data) => {
        if (!cancelled) setPersonas(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { personas, isLoading, error };
}
