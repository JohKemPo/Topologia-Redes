import { useState, useCallback } from 'react';
import { WebNode } from '../types/topology';

export const useCrawler = () => {
  const [nodes, setNodes] = useState<WebNode[]>([]);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startCrawl = useCallback((domain: string) => {
    setNodes([]);
    setError(null);
    setIsCrawling(true);

    const eventSource = new EventSource(`http://127.0.0.1:8000/api/v1/topology/crawl?domain=${encodeURIComponent(domain)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          eventSource.close();
          setIsCrawling(false);
          return;
        }
        if (data.type === 'done') {
          eventSource.close();
          setIsCrawling(false);
          return;
        }
        if (data.type === 'node') {
          setNodes((prev) => [...prev, data as WebNode]);
        }
      } catch (err) {
        console.error("Erro no parse SSE:", err);
      }
    };

    eventSource.onerror = () => {
      setError("Conexão perdida ou bloqueada por WAF/CORS (Erro Camada 7).");
      eventSource.close();
      setIsCrawling(false);
    };

    return () => {
      eventSource.close();
      setIsCrawling(false);
    };
  }, []);

  return { nodes, isCrawling, error, startCrawl };
};