from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.services.traceroute import TracerouteEngine
from app.services.crawler import WebCrawlerEngine
from app.services.enrichment_extra import EnrichmentAnalyzer
from app.services.sweeper import NetworkSweeper

crawler_engine = WebCrawlerEngine()
enrichment_analyzer = EnrichmentAnalyzer()
engine = TracerouteEngine()
sweeper_engine = NetworkSweeper()

app = FastAPI(
    title="Topologia de Rede",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/topology/trace")
def stream_traceroute(domain: str = Query(..., description="Dominio a ser analisado")):
    """
    Executa o traceroute via Scapy e transmite os dados salto a salto em tempo real
    """
    return StreamingResponse(
        engine.run_trace(domain),
        media_type="text/event-stream"
    )

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/topology/crawl")
def stream_crawler(domain: str = Query(..., description="Dominio para mapeamento L7")):
    """
    Rastreia a superficie web do dominio e retorna o grafo de dependencias via SSE.
    """
    return StreamingResponse(
        crawler_engine.run_crawl(domain),
        media_type="text/event-stream"
    )
    
@app.get("/api/v1/topology/enrich")
def stream_enrichment(domain: str = Query(..., description="Dominio para testes L4 a L7")):
    """
    Roda os testes de DNS, Scanner de Portas e Inspeção TLS.
    """
    return StreamingResponse(
        enrichment_analyzer.run_analysis(domain),
        media_type="text/event-stream"
    )
    
@app.get("/api/v1/topology/sweep")
def stream_sweeper(domain: str = Query(..., description="Dominio ou IP alvo")):
    """
    Realiza um ICMP Ping Sweep no bloco /24 do IP alvo para mapear a malha da topologia local.
    """
    return StreamingResponse(
        sweeper_engine.run_sweep(domain),
        media_type="text/event-stream"
    )