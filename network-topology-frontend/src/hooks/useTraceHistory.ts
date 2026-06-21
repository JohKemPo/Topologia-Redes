import { useState, useEffect, useCallback } from 'react';
import { TraceSnapshot } from '../types/history';

const HISTORY_KEY = '@NetworkTopology:History';

export const useTraceHistory = () => {
  const [history, setHistory] = useState<TraceSnapshot[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao ler histórico", e);
      }
    }
  }, []);

  const saveSnapshot = useCallback((snapshotData: Omit<TraceSnapshot, 'id' | 'dateISO'>) => {
    const newSnapshot: TraceSnapshot = {
      ...snapshotData,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      dateISO: new Date().toISOString(),
    };

    setHistory((prev) => {
      const updatedHistory = [newSnapshot, ...prev];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });

    return newSnapshot;
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  const getSnapshotsByDomain = useCallback((domain: string) => {
    return history.filter(h => h.domain.toLowerCase() === domain.toLowerCase());
  }, [history]);

  return { history, saveSnapshot, clearHistory, getSnapshotsByDomain };
};