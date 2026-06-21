import { useState, useCallback } from 'react';
import { HopResponse } from '../types/topology';

export const useTraceroute = () => {
  const [hops, setHops] = useState<HopResponse[]>([]);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startTrace = useCallback((domain: string) => {
    setHops([]);
    setError(null);
    setIsTracing(true);

    const encodedDomain = encodeURIComponent(domain);
    const eventSource = new EventSource(`http://127.0.0.1:8000/api/v1/topology/trace?domain=${encodedDomain}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          eventSource.close();
          setIsTracing(false);
          return;
        }

        const newHop = data as HopResponse;
        setHops((prevHops) => [...prevHops, newHop]);

      } catch (err) {
        console.error("Erro ao fazer parse dos dados SSE", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource falhou.", err);
      eventSource.close();
      setIsTracing(false);
    };

    return () => {
      eventSource.close();
      setIsTracing(false);
    };
  }, []);

  return { hops, isTracing, error, startTrace };
};