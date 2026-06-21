import socket
import ssl
import json
import dns
from typing import Generator

class EnrichmentAnalyzer:
    def run_analysis(self, domain: str) -> Generator[str, None, None]:
        # 1.Camada 7
        yield self._format_sse("dns_start", "Iniciando resolucao de registros DNS...")
        try:
            records = {}
            for qtype in ['A', 'NS', 'MX', 'TXT']:
                try:
                    answers = dns.resolver.resolve(domain, qtype)
                    records[qtype] = [str(r) for r in answers]
                except Exception:
                    records[qtype] = []
            yield self._format_sse("dns_result", records)
        except Exception as e:
            yield self._format_sse("dns_error", str(e))

        # 2. Scanner de Portas TCP (Camada 4)
        yield self._format_sse("port_start", "Iniciando varredura de portas TCP (SYN/ACK)...")
        ports_to_check = [21, 22, 53, 80, 443, 3306, 3389]
        open_ports = []
        for port in ports_to_check:
            try:
                with socket.create_connection((domain, port), timeout=1.0):
                    open_ports.append(port)
                    yield self._format_sse("port_open", port)
            except Exception:
                pass
        yield self._format_sse("port_result", open_ports)

        # 3. Camadas 5 e 6
        yield self._format_sse("tls_start", "Iniciando negociacao TLS e extracao de certificado...")
        try:
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=3.0) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    
                    issuer_dict = dict(x[0] for x in cert.get('issuer', []))
                    subject_dict = dict(x[0] for x in cert.get('subject', []))
                    
                    tls_data = {
                        "issuer": issuer_dict.get('organizationName', issuer_dict.get('commonName', 'Desconhecido')),
                        "subject": subject_dict.get('commonName', domain),
                        "version": cipher[1],
                        "cipher": cipher[0],
                        "valid_until": cert.get('notAfter', 'N/A')
                    }
                    yield self._format_sse("tls_result", tls_data)
        except Exception as e:
            yield self._format_sse("tls_error", f"Falha no handshake (porta 443 bloqueada ou sem suporte TLS): {str(e)}")

        yield self._format_sse("done", "Analise concluida.")

    def _format_sse(self, event_type: str, data) -> str:
        return f"data: {json.dumps({'type': event_type, 'data': data})}\n\n"