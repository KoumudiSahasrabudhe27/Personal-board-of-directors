import { useEffect, useState } from 'react';

export default function usePersonas() {
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/personas')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load advisors');
        return res.json();
      })
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
