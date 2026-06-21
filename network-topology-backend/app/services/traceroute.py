import time
import socket
from typing import Generator, Optional
from scapy.all import IP, ICMP, sr1
from app.schemas.topology import HopResponse, ASNData, GeoData
from app.services.enrichment import EnrichmentService
from scapy.all import TCP

class TracerouteEngine:
    def __init__(self):
        self.enrichment = EnrichmentService()

    def _resolve_dns(self, domain: str) -> str:
        try:
            return socket.gethostbyname(domain)
        except socket.gaierror as e:
            raise ValueError(f"Nao foi possivel resolver o dominio: {domain}") from e

    def run_trace(self, domain: str, max_hops: int = 30, timeout: float = 2.0) -> Generator[str, None, None]:
        try:
            target_ip = self._resolve_dns(domain)
        except ValueError as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            return

        previous_asn: Optional[ASNData] = None

        for hop in range(1, max_hops + 1):
            # packet = IP(dst=target_ip, ttl=hop) / ICMP()
            packet = IP(dst=target_ip, ttl=hop) / TCP(dport=443, flags="S")
            
            start_time = time.perf_counter()
            reply = sr1(packet, timeout=timeout, verbose=False)
            end_time = time.perf_counter()
            
            rtt_ms = (end_time - start_time) * 1000

            if reply is None:
                geo_empty = GeoData()
                asn_empty = ASNData()
                explanation = self.enrichment.generate_explanation(hop, "* * *", None, asn_empty, previous_asn)
                
                hop_data = HopResponse(
                    hop=hop,
                    ip="* * *",
                    rtt_ms=None,
                    status="timeout",
                    geo=geo_empty,
                    asn=asn_empty,
                    didatic_explanation=explanation
                )
                yield f"data: {hop_data.model_dump_json()}\n\n"
                continue

            hop_ip = reply.src
            geo_data = self.enrichment.get_geo_data(hop_ip)
            asn_data = self.enrichment.get_asn_data(hop_ip)
            explanation = self.enrichment.generate_explanation(hop, hop_ip, rtt_ms, asn_data, previous_asn)

            if asn_data.number:
                previous_asn = asn_data

            icmp_layer = reply.getlayer(ICMP)
            if icmp_layer:
                if icmp_layer.type == 11:
                    hop_data = HopResponse(
                        hop=hop,
                        ip=hop_ip,
                        rtt_ms=rtt_ms,
                        status="success",
                        geo=geo_data,
                        asn=asn_data,
                        didatic_explanation=explanation
                    )
                    yield f"data: {hop_data.model_dump_json()}\n\n"
                elif icmp_layer.type == 0:
                    hop_data = HopResponse(
                        hop=hop,
                        ip=hop_ip,
                        rtt_ms=rtt_ms,
                        status="success",
                        geo=geo_data,
                        asn=asn_data,
                        didatic_explanation=f"Salto {hop}: Destino alcancado! O pacote chegou com sucesso ao servidor final de {domain} ({hop_ip}). O RTT final foi de {rtt_ms:.2f}ms."
                    )
                    yield f"data: {hop_data.model_dump_json()}\n\n"
                    break
            else:
                hop_data = HopResponse(
                    hop=hop,
                    ip=hop_ip,
                    rtt_ms=rtt_ms,
                    status="success",
                    geo=geo_data,
                    asn=asn_data,
                    didatic_explanation=explanation
                )
                yield f"data: {hop_data.model_dump_json()}\n\n"

            if hop_ip == target_ip:
                break