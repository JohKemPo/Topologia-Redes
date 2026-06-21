import React, { useState } from 'react';
import { Row, Col, Card, Typography, Tag, Descriptions, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

const LAYER_DATA = [
  {
    id: 7,
    osi: '7. Aplicação',
    tcp: 'Aplicação',
    color: '#eb2f96', 
    pdu: 'Dados (Data)',
    protocols: ['HTTP', 'DNS', 'SMTP', 'FTP', 'SSH'],
    responsibility: 'Ponto de acesso para o usuário e os aplicativos de rede.',
    details: 'Fornece a interface direta para os softwares (como o navegador web que estamos analisando na Aba 2). Não é o aplicativo em si, mas os protocolos de alto nível que ele utiliza para formatar a solicitação.'
  },
  {
    id: 6,
    osi: '6. Apresentação',
    tcp: 'Aplicação',
    color: '#eb2f96',
    pdu: 'Dados (Data)',
    protocols: ['TLS', 'SSL', 'JPEG', 'ASCII'],
    responsibility: 'Tradução, Criptografia e Compressão de dados.',
    details: 'Garante que os dados enviados pela camada de aplicação de um sistema possam ser lidos pela camada de aplicação de outro. É aqui que ocorre o Handshake TLS que mapeamos na ferramenta.'
  },
  {
    id: 5,
    osi: '5. Sessão',
    tcp: 'Aplicação',
    color: '#eb2f96',
    pdu: 'Dados (Data)',
    protocols: ['NetBIOS', 'PPTP', 'RPC'],
    responsibility: 'Gerenciamento de diálogos (sessões) entre conexões.',
    details: 'Estabelece, gerencia e termina as conexões entre os aplicativos locais e remotos. No TCP/IP prático, as funções das camadas 5, 6 e 7 são frequentemente combinadas no próprio aplicativo.'
  },
  {
    id: 4,
    osi: '4. Transporte',
    tcp: 'Transporte',
    color: '#1890ff', 
    pdu: 'Segmento (TCP) / Datagrama (UDP)',
    protocols: ['TCP', 'UDP'],
    responsibility: 'Comunicação fim a fim, controle de fluxo e portas.',
    details: 'Quebra os dados da aplicação em Segmentos. Utiliza o conceito de "Portas" para entregar os dados ao processo correto. O TCP garante a entrega (confiabilidade), o UDP prioriza a velocidade. É a camada do nosso Scanner de Portas.'
  },
  {
    id: 3,
    osi: '3. Rede',
    tcp: 'Internet',
    color: '#52c41a',
    pdu: 'Pacote (Packet)',
    protocols: ['IP (IPv4/IPv6)', 'ICMP', 'IPsec', 'BGP'],
    responsibility: 'Roteamento IP e determinação do melhor caminho.',
    details: 'Adiciona os endereços IP lógicos (Origem e Destino). É o coração da Internet e da nossa ferramenta de Traceroute. Aqui, os roteadores tomam decisões de trânsito baseadas no BGP para cruzar Sistemas Autônomos.'
  },
  {
    id: 2,
    osi: '2. Enlace de Dados',
    tcp: 'Acesso à Rede',
    color: '#fa8c16',
    pdu: 'Quadro (Frame)',
    protocols: ['Ethernet', 'Wi-Fi (802.11)', 'ARP', 'PPP'],
    responsibility: 'Entrega nó-a-nó na mesma rede local e controle de erro físico.',
    details: 'Encapsula os Pacotes IP em Quadros, adicionando endereços físicos (MAC Address). Cuida da transferência confiável de dados através do link físico adjacente, detectando colisões.'
  },
  {
    id: 1,
    osi: '1. Física',
    tcp: 'Acesso à Rede',
    color: '#fa8c16',
    pdu: 'Bits',
    protocols: ['1000BASE-T', 'Fibra Óptica', 'Sinais de Rádio'],
    responsibility: 'Transmissão dos bits brutos pelo meio de comunicação.',
    details: 'Não entende de IPs ou MACs, apenas de tensão elétrica, luz ou ondas eletromagnéticas.'
  }
];

export const OSIModel: React.FC = () => {
  const [selectedLayerId, setSelectedLayerId] = useState<number>(3);

  const selectedData = LAYER_DATA.find(layer => layer.id === selectedLayerId) || LAYER_DATA[4];

  const renderTCPBlock = (name: string, height: string, color: string, isActive: boolean) => (
    <div style={{
      height,
      backgroundColor: isActive ? color : `${color}20`,
      color: isActive ? '#fff' : color,
      border: `2px solid ${color}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      transition: 'all 0.3s',
      marginBottom: '8px',
      boxShadow: isActive ? `0 4px 12px ${color}50` : 'none'
    }}>
      {name}
    </div>
  );

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={10} lg={8}>
        <Row gutter={8}>
          <Col span={12}>
            <Title level={5} style={{ textAlign: 'center' }}>Modelo OSI</Title>
            {LAYER_DATA.map(layer => {
              const isActive = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{
                    height: '50px',
                    backgroundColor: isActive ? layer.color : '#fff',
                    color: isActive ? '#fff' : '#595959',
                    border: `2px solid ${layer.color}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: isActive ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    marginBottom: '8px',
                    boxShadow: isActive ? `0 4px 12px ${layer.color}50` : 'none'
                  }}
                >
                  {layer.osi}
                </div>
              );
            })}
          </Col>
          
          <Col span={12}>
            <Title level={5} style={{ textAlign: 'center' }}>TCP/IP (Prático)</Title>
            {renderTCPBlock('Aplicação', '166px', '#eb2f96', [7, 6, 5].includes(selectedLayerId))}
            {renderTCPBlock('Transporte', '50px', '#1890ff', selectedLayerId === 4)}
            {renderTCPBlock('Internet', '50px', '#52c41a', selectedLayerId === 3)}
            {renderTCPBlock('Acesso à Rede', '108px', '#fa8c16', [2, 1].includes(selectedLayerId))}
          </Col>
        </Row>
      </Col>

      <Col xs={24} md={14} lg={16}>
        <Card 
          title={`Análise de Camada: ${selectedData.osi}`} 
          style={{ height: '100%', borderColor: selectedData.color }}
          headStyle={{ backgroundColor: `${selectedData.color}10`, borderBottom: `1px solid ${selectedData.color}50`, color: selectedData.color }}
        >
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Correspondência TCP/IP">
              <strong>{selectedData.tcp}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Responsabilidade Principal">
              {selectedData.responsibility}
            </Descriptions.Item>
            <Descriptions.Item label="Unidade de Dados (PDU)">
              <Tag color={selectedData.color}>{selectedData.pdu}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Protocolos Comuns">
              {selectedData.protocols.map(p => <Tag key={p}>{p}</Tag>)}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" style={{ borderColor: `${selectedData.color}50` }}>
            <Text style={{ color: selectedData.color }}>Modelo Mental</Text>
          </Divider>
          
          <Paragraph style={{ fontSize: '15px', lineHeight: '1.6' }}>
            {selectedData.details}
          </Paragraph>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px dashed #d9d9d9' }}>
            <Title level={5} style={{ fontSize: '14px', marginBottom: '8px' }}>O Conceito de Encapsulamento</Title>
            <Paragraph style={{ fontSize: '13px', margin: 0, color: '#595959' }}>
              Quando seu computador envia uma mensagem, o dado inicia na Camada 7 e desce pela pilha. Ao cruzar cada camada (Transporte, Rede, Enlace), um novo <strong>Cabeçalho (Header)</strong> é anexado com metadados cruciais para a viagem (Portas, IPs, MACs). O payload original é engolido e encapsulado, mudando o seu nome de <i>Dado</i> para <i>Segmento</i>, depois <i>Pacote</i>, <i>Quadro</i> e, finalmente, <i>Bits</i> antes de atingir o cabo. No receptor, o processo inverso ocorre.
            </Paragraph>
          </div>
        </Card>
      </Col>
    </Row>
  );
};