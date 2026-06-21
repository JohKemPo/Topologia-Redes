import React from 'react';
import { Card, Row, Col, Typography, Tag, Descriptions, Badge, Spin } from 'antd';
import { DNSRecords, TLSData } from '../types/topology';

const { Title, Paragraph } = Typography;

interface EnrichmentPanelProps {
  domain: string;
  dnsData: DNSRecords | null;
  openPorts: number[];
  tlsData: TLSData | null;
  isAnalyzing: boolean;
}

const COMMON_PORTS: Record<number, string> = {
  21: 'FTP', 22: 'SSH', 53: 'DNS', 80: 'HTTP', 443: 'HTTPS', 3306: 'MySQL', 3389: 'RDP'
};

export const EnrichmentPanel: React.FC<EnrichmentPanelProps> = ({ domain, dnsData, openPorts, tlsData, isAnalyzing }) => {
  if (!domain && !isAnalyzing) return <div style={{ textAlign: 'center', padding: '40px' }}>Inicie uma análise para visualizar o enriquecimento de dados.</div>;

  return (
    <Spin spinning={isAnalyzing} tip="Executando varredura L4 a L7...">
      <Row gutter={[24, 24]}>
        
        <Col xs={24} lg={8}>
          <Card title="Scanner TCP (Camada de Transporte)" bordered={false} style={{ height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              {Object.keys(COMMON_PORTS).map((p) => {
                const portNum = parseInt(p, 10);
                const isOpen = openPorts.includes(portNum);
                return (
                  <Badge key={portNum} status={isOpen ? 'success' : 'default'} text={`Porta ${portNum} (${COMMON_PORTS[portNum]})`} style={{ display: 'block', marginBottom: '8px', color: isOpen ? '#000' : '#888' }} />
                );
              })}
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f9f0ff', borderLeft: '4px solid #722ed1' }}>
              <Title level={5} style={{ color: '#722ed1', fontSize: '14px' }}>Modelo Mental (Camada 4)</Title>
              <Paragraph style={{ fontSize: '13px', margin: 0 }}>O pacote IP encontra a máquina correta na rede. No entanto, é a Porta (Camada 4) que garante a entrega ao processo/serviço correto em execução no servidor de destino. Portas abertas indicam processos em escuta via <i>sockets</i>.</Paragraph>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Handshake TLS/SSL" bordered={false} style={{ height: '100%' }}>
            {tlsData ? (
              <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
                <Descriptions.Item label="Protocolo Negociado">{tlsData.version}</Descriptions.Item>
                <Descriptions.Item label="Suite Criptográfica (Cipher)">{tlsData.cipher}</Descriptions.Item>
                <Descriptions.Item label="Emissor do Certificado (CA)" span={2}>{tlsData.issuer}</Descriptions.Item>
                <Descriptions.Item label="Assunto (Subject)">{tlsData.subject}</Descriptions.Item>
                <Descriptions.Item label="Validade">{tlsData.valid_until}</Descriptions.Item>
              </Descriptions>
            ) : (
               <div style={{ padding: '20px', color: '#888' }}>{isAnalyzing ? 'Negociando chaves TLS...' : 'Nenhum dado TLS capturado. A porta 443 pode estar fechada.'}</div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#e6f7ff', borderLeft: '4px solid #1890ff' }}>
              <Title level={5} style={{ color: '#1890ff', fontSize: '14px' }}>Modelo Mental (Segurança)</Title>
              <Paragraph style={{ fontSize: '13px', margin: 0 }}>O Handshake demonstra a troca de chaves assíncrona. O cliente e o servidor utilizam o certificado fornecido pela Autoridade Certificadora (CA) para gerar uma chave simétrica de sessão. A partir desse ponto, o tráfego da Camada 7 fica ilegível para roteadores intermediários.</Paragraph>
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Árvore de Registros DNS Autorizada" bordered={false}>
            {dnsData ? (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <strong>A Records (IPv4):</strong>
                  {dnsData.A.length > 0 ? dnsData.A.map(ip => <div key={ip}><Tag color="blue">{ip}</Tag></div>) : <div style={{color: '#888'}}>Nenhum encontrado</div>}
                </Col>
                <Col span={8}>
                  <strong>NS Records (Authoritative):</strong>
                  {dnsData.NS.length > 0 ? dnsData.NS.map(ns => <div key={ns}><Tag color="orange">{ns}</Tag></div>) : <div style={{color: '#888'}}>Nenhum encontrado</div>}
                </Col>
                <Col span={8}>
                  <strong>MX Records (Mail):</strong>
                  {dnsData.MX.length > 0 ? dnsData.MX.map(mx => <div key={mx}><Tag color="purple">{mx}</Tag></div>) : <div style={{color: '#888'}}>Nenhum encontrado</div>}
                </Col>
              </Row>
            ) : (
               <div style={{ color: '#888' }}>{isAnalyzing ? 'Consultando servidores DNS...' : ''}</div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderLeft: '4px solid #52c41a', marginTop: '16px' }}>
              <Title level={5} style={{ color: '#52c41a', fontSize: '14px' }}>Modelo Mental (Sistemas Distribuídos)</Title>
              <Paragraph style={{ fontSize: '13px', margin: 0 }}>O DNS é uma base de dados hierárquica. Os registros <strong>NS</strong> indicam quais são os servidores oficiais que detêm autoridade sobre o domínio, geralmente fornecidos pelo serviço de hospedagem. Os registros <strong>A</strong> apontam para as máquinas onde a aplicação roda, e os registros <strong>MX</strong> delegam especificamente para servidores de e-mail.</Paragraph>
            </div>
          </Card>
        </Col>

      </Row>
    </Spin>
  );
};