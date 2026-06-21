# Topologia-Redes


cd network-topology-backend
sudo $(which python) -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

cd network-topology-frontend
npm run dev

Exemplos:


## Grandes Portais (Ideal para testar rotas nacionais e rápidas)

* uol.com.br (Servidores no Brasil, excelente para testar latência local)
* ://globo.com (Infraestrutura robusta nacional)
* google.com.br (Geralmente resolve para servidores da Google no Brasil)

## Infraestrutura de Nuvem e Redes de Distribuição (CDN)

* cloudflare.com (Usa rede Anycast; o teste deve ir para o servidor mais próximo de você)
* ://amazon.com (Infraestrutura global da Amazon)
* fastly.com (Grande provedor de CDN internacional)

## Servidores Globais (Para testar rotas internacionais longas)

* bbc.co.uk (Reino Unido - Europa)
* tokyo-sports.co.jp (Japão - Ásia)
* sydney.edu.au (Austrália - Oceania)
* gov.za (África do Sul - África)

## Servidores de Jogos (Ótimos para analisar oscilação de ping e perda de pacotes)

* riotgames.com (Servidores da Riot Games)
* valve.com (Servidores da Valve/Steam)

uchicago.edu
baidu.com