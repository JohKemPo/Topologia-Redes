import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from typing import Generator
import json
import time

class WebCrawlerEngine:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def run_crawl(self, domain: str) -> Generator[str, None, None]:
        url = f"https://{domain}" if not domain.startswith("http") else domain
        base_domain = urlparse(url).netloc.replace("www.", "")

        try:
            yield f"data: {json.dumps({'type': 'info', 'message': f'Iniciando handshake TLS e GET request para {url}...'})}\n\n"
            
            with httpx.Client(headers=self.headers, timeout=10.0, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()
                
            html_content = response.text
            soup = BeautifulSoup(html_content, 'html.parser')
            
            seen_urls = set()

            tags = soup.find_all(['a', 'link', 'script', 'img'])

            for tag in tags:
                link = tag.get('href') or tag.get('src')
                if not link or link.startswith(('javascript:', 'mailto:', 'tel:', '#')):
                    continue

                absolute_url = urljoin(url, link)
                parsed_url = urlparse(absolute_url)
                netloc = parsed_url.netloc

                if absolute_url in seen_urls:
                    continue
                seen_urls.add(absolute_url)

                category = "external"
                explanation = f"O navegador precisou abrir uma nova conexao TCP/DNS para o servidor externo {netloc}."
                
                if base_domain in netloc:
                    if netloc.replace("www.", "") == base_domain:
                        category = "internal"
                        explanation = "Navegacao interna no mesmo dominio raiz. A conexao TCP (Keep-Alive) provavelmente sera reaproveitada."
                    else:
                        category = "subdomain"
                        explanation = f"Resolucao de subdominio ({netloc}). Pode exigir nova consulta DNS, mas geralmente pertence a mesma infraestrutura."

                resource_type = "document"
                if tag.name == 'img': resource_type = "image"
                elif tag.name == 'script': resource_type = "script"
                elif tag.name == 'link': resource_type = "stylesheet"

                data_packet = {
                    "type": "node",
                    "url": absolute_url,
                    "domain": netloc,
                    "category": category,
                    "resource_type": resource_type,
                    "didatic_explanation": explanation
                }
                
                time.sleep(0.05) 
                yield f"data: {json.dumps(data_packet)}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'message': 'Varredura de Superficie Concluida.'})}\n\n"

        except httpx.HTTPError as e:
            yield f"data: {json.dumps({'error': f'Falha na requisicao HTTP (Camada 7): {str(e)}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Erro de processamento DOM: {str(e)}'})}\n\n"