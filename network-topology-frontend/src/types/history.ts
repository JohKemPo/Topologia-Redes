import { HopResponse, WebNode, DNSRecords, TLSData } from './topology';

export interface TraceSnapshot {
  id: string;             
  dateISO: string;        
  domain: string;         
  networkContext: string; 
  
  hops: HopResponse[];
  l7Nodes: WebNode[];
  dnsData: DNSRecords | null;
  tlsData: TLSData | null;
  openPorts: number[];
}