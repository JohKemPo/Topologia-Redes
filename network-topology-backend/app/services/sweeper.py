import ipaddress
import json
from scapy.all import IP, ICMP, sr, conf
from typing import Generator
import socket

class NetworkSweeper:
    def __init__(self):
        conf.verb = 0 

    def _resolve_dns(self, domain: str) -> str:
        try:
            return socket.gethostbyname(domain)
        except socket.gaierror:
            return domain 

    def run_sweep(self, target: str) -> Generator[str, None, None]:
        try:
            target_ip = self._resolve_dns(target)
            
            network = ipaddress.IPv4Network(f"{target_ip}/24", strict=False)
            network_str = str(network)
            
            yield f"data: {json.dumps({'type': 'info', 'message': f'Iniciando varredura lateral no bloco {network_str}...'})}\n\n"

            ans, unans = sr(IP(dst=network_str)/ICMP(), timeout=2, multi=True)

            live_hosts = []
            for snd, rcv in ans:
                live_ip = rcv.src
                live_hosts.append(live_ip)
                
                yield f"data: {json.dumps({'type': 'node', 'ip': live_ip, 'status': 'alive'})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'total_found': len(live_hosts)})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"