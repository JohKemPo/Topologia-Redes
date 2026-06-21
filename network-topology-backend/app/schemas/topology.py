from pydantic import BaseModel, Field
from typing import Optional

class GeoData(BaseModel):
    country: Optional[str] = Field(None, description="Codigo do pais (ex: BR)")
    city: Optional[str] = Field(None, description="Nome da cidade")
    lat: Optional[float] = Field(None, description="Latitude")
    lng: Optional[float] = Field(None, description="Longitude")

class ASNData(BaseModel):
    number: Optional[int] = Field(None, description="Numero do Sistema Autonomo (ASN)")
    organization: Optional[str] = Field(None, description="Nome da organizacao dona do bloco IP")

class HopResponse(BaseModel):
    hop: int = Field(..., description="Numero do salto atual")
    ip: str = Field(..., description="Endereco IP do roteador intermediario")
    rtt_ms: Optional[float] = Field(None, description="Round Trip Time em milissegundos")
    status: str = Field(..., description="Status do salto: success, timeout, ou error")
    geo: GeoData
    asn: ASNData
    didatic_explanation: str = Field(..., description="Explicacao didatica sobre o evento ocorrido neste salto")