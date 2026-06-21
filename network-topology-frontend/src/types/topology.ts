export interface GeoData {
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ASNData {
  number: number | null;
  organization: string | null;
}

export interface HopResponse {
  hop: number;
  ip: string;
  rtt_ms: number | null;
  status: 'success' | 'timeout' | 'error';
  geo: GeoData;
  asn: ASNData;
  didatic_explanation: string;
}

export interface WebNode {
  url: string;
  domain: string;
  category: 'internal' | 'subdomain' | 'external';
  resource_type: 'document' | 'image' | 'script' | 'stylesheet';
  didatic_explanation: string;
}

export interface DNSRecords {
  A: string[];
  NS: string[];
  MX: string[];
  TXT: string[];
}

export interface TLSData {
  issuer: string;
  subject: string;
  version: string;
  cipher: string;
  valid_until: string;
}