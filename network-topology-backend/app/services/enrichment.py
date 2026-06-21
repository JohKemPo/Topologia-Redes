import os
import geoip2.database
from typing import Tuple, Optional
from app.schemas.topology import GeoData, ASNData

class EnrichmentService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.city_db_path = os.path.join(base_dir, "data", "GeoLite2-City.mmdb")
        self.asn_db_path = os.path.join(base_dir, "data", "GeoLite2-ASN.mmdb")
        
        self.city_reader = None
        self.asn_reader = None
        
        if os.path.exists(self.city_db_path):
            self.city_reader = geoip2.database.Reader(self.city_db_path)
        if os.path.exists(self.asn_db_path):
            self.asn_reader = geoip2.database.Reader(self.asn_db_path)

    def get_geo_data(self, ip_address: str) -> GeoData:
        if not self.city_reader:
            return GeoData()
        try:
            response = self.city_reader.city(ip_address)
            return GeoData(
                country=response.country.iso_code,
                city=response.city.name,
                lat=response.location.latitude,
                lng=response.location.longitude
            )
        except Exception:
            return GeoData()

    def get_asn_data(self, ip_address: str) -> ASNData:
        if not self.asn_reader:
            return ASNData()
        try:
            response = self.asn_reader.asn(ip_address)
            return ASNData(
                number=response.autonomous_system_number,
                organization=response.autonomous_system_organization
            )
        except Exception:
            return ASNData()

    def generate_explanation(self, hop: int, ip: str, rtt: Optional[float], current_asn: ASNData, previous_asn: Optional[ASNData]) -> str:
        if not rtt:
            return f"Salto {hop}: O roteador intermediario nao respondeu dentro do tempo limite (Timeout). Isso ocorre porque muitos provedores desabilitam respostas ICMP para mitigar ataques DDoS ou poupar processamento da CPU."
            
        explanation = f"Salto {hop}: Pacote alcancou o IP {ip} com um tempo de resposta de {rtt:.2f}ms. "
        
        if current_asn.number:
            explanation += f"Este IP pertence ao Sistema Autonomo AS{current_asn.number} ({current_asn.organization}). "
            if previous_asn and previous_asn.number and previous_asn.number != current_asn.number:
                explanation += f"Uma fronteira de roteamento BGP foi cruzada aqui! Os pacotes sairam do AS{previous_asn.number} e entraram no AS{current_asn.number}, demonstrando um acordo de peering ou transito IP entre essas duas infraestruturas."
        else:
            explanation += "Este IP faz parte de um bloco de rede privada (RFC 1918) ou nao possui registro publico de ASN mapeado, comum em infraestruturas internas de provedores de acesso."
            
        return explanation

    def close(self):
        if self.city_reader:
            self.city_reader.close()
        if self.asn_reader:
            self.asn_reader.close()