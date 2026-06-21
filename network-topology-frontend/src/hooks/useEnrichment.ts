import { useState, useCallback } from 'react';
import { DNSRecords, TLSData } from '../types/topology';

export const useEnrichment = () => {
  const [dnsData, setDnsData] = useState<DNSRecords | null>(null);
  const [openPorts, setOpenPorts] = useState<number[]>([]);
  const [tlsData, setTlsData] = useState<TLSData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const startEnrichment = useCallback((domain: string) => {
    setDnsData(null);
    setOpenPorts([]);
    setTlsData(null);
    setIsAnalyzing(true);

    const eventSource = new EventSource(`http://127.0.0.1:8000/api/v1/topology/enrich?domain=${encodeURIComponent(domain)}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        switch (payload.type) {
          case 'dns_result':
            setDnsData(payload.data);
            break;
          case 'port_open':
            setOpenPorts((prev) => [...prev, payload.data]);
            break;
          case 'tls_result':
            setTlsData(payload.data);
            break;
          case 'done':
            eventSource.close();
            setIsAnalyzing(false);
            break;
        }
      } catch (err) {
        console.error("Erro no parse SSE Enrichment:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsAnalyzing(false);
    };

    return () => {
      eventSource.close();
      setIsAnalyzing(false);
    };
  }, []);

  return { dnsData, openPorts, tlsData, isAnalyzing, startEnrichment };
};