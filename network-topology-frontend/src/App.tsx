import React, { useState, useMemo } from 'react';
import { Layout, Row, Col, Input, Button, Card, Typography, Alert, Statistic, Modal, Descriptions, Tag, Tabs } from 'antd';
import { GlobalOutlined, DeploymentUnitOutlined, ApiOutlined, BookOutlined } from '@ant-design/icons';
import { useTraceroute } from './hooks/useTraceroute';
import { LogicalTopology } from './components/LogicalTopology';
import { PhysicalMap } from './components/PhysicalMap';
import { DidacticPanel } from './components/DidacticPanel';
import { useCrawler } from './hooks/useCrawler';
import { WebSurfaceMap } from './components/WebSurfaceMap';
import { HopResponse, WebNode } from './types/topology';
import { useEnrichment } from './hooks/useEnrichment';
import { EnrichmentPanel } from './components/EnrichmentPanel';
import { OSIModel } from './components/OSIModel';

import { SaveOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTraceHistory } from './hooks/useTraceHistory';
import { TraceSnapshot } from './types/history';
import { ComparativeReport } from './components/ComparativeReport';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const [domain, setDomain] = useState<string>('');

  const { hops, isTracing, error, startTrace } = useTraceroute();
  const { nodes: l7Nodes, isCrawling, error: crawlError, startCrawl } = useCrawler();
  const { dnsData, openPorts, tlsData, isAnalyzing: isEnriching, startEnrichment } = useEnrichment();

  const [selectedHop, setSelectedHop] = useState<HopResponse | null>(null);
  const [selectedL7Node, setSelectedL7Node] = useState<WebNode | null>(null);

  const { history, saveSnapshot } = useTraceHistory();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [networkContextName, setNetworkContextName] = useState('');

  const [activeTab, setActiveTab] = useState<string>('1');

  const handleStart = () => {
    if (domain) {
      startTrace(domain);
      startCrawl(domain);
      startEnrichment(domain);
    }
  };

  const handleSaveSnapshot = () => {
    if (!domain || hops.length === 0) return;

    saveSnapshot({
      domain,
      networkContext: networkContextName || 'Rede Desconhecida',
      hops,
      l7Nodes,
      dnsData,
      tlsData,
      openPorts
    });

    setIsSaveModalOpen(false);
    setNetworkContextName('');
    Modal.success({
      title: 'Snapshot Salvo com Sucesso!',
      content: `O mapeamento para ${domain} na rede "${networkContextName}" foi armazenado e estará disponível para a futura tela de relatórios.`,
    });
  };

  const stats = useMemo(() => {
    const validRtts = hops.map(h => h.rtt_ms).filter((rtt): rtt is number => rtt !== null);
    const maxRtt = validRtts.length > 0 ? Math.max(...validRtts) : 0;
    const uniqueASNs = new Set(hops.map(h => h.asn.number).filter(Boolean));
    const uniqueCountries = new Set(hops.map(h => h.geo.country).filter(Boolean));

    return {
      totalHops: hops.length,
      maxRtt: maxRtt.toFixed(1),
      asnCount: uniqueASNs.size,
      countryCount: uniqueCountries.size
    };
  }, [hops]);

  const targetInfo = useMemo(() => {
    if (hops.length === 0) return null;
    const lastValidHop = [...hops].reverse().find(h => h.status === 'success' && h.ip !== '* * *');
    return lastValidHop ? lastValidHop : null;
  }, [hops]);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#F9FEFF' }}>

      <Content style={{ padding: '24px', maxWidth: '2000px', margin: '0 auto', width: '100%' }}>

        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card bodyStyle={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Input
                size="large"
                placeholder="Insira o domínio (Ex: uff.br, youtube.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onPressEnter={handleStart}
                disabled={isTracing || isCrawling || isEnriching}
                style={{ maxWidth: '400px' }}
              />
              <Button type="primary" size="large" onClick={handleStart} loading={isTracing || isCrawling || isEnriching}>
                {(isTracing || isCrawling) ? 'Mapeando Topologia...' : 'Analisar Domínio'}
              </Button>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <Button
                  icon={<SaveOutlined />}
                  size="large"
                  disabled={hops.length === 0 || isTracing}
                  onClick={() => setIsSaveModalOpen(true)}
                >
                  Salvar Snapshot
                </Button>
                <Button
                  icon={<HistoryOutlined />}
                  size="large"
                  type="dashed"
                  onClick={() => setActiveTab('4')}
                >
                  Ver Relatórios ({history.length})
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {error && <Alert style={{ marginBottom: '24px' }} message="Falha no Rastreamento (Camada de Rede)" description={error} type="error" showIcon />}
        {crawlError && <Alert style={{ marginBottom: '24px' }} message="Falha no Rastreamento (Camada de Aplicação)" description={crawlError} type="error" showIcon />}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          type="card"
          items={[
            {
              key: '0',
              label: <span>Fundamentos: Arquitetura em Camadas</span>,
              children: (
                <Card title="Abstração de Redes: Modelo OSI vs. TCP/IP" bordered={false}>
                  <OSIModel />
                </Card>
              )
            },
            {
              key: '1',
              label: 'Camada de Rede',
              children: (
                <>
                  {targetInfo && (
                    <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                      <Col span={24}>
                        <Card style={{ borderLeft: '5px solid #722ed1', backgroundColor: '#f9f0ff' }}>
                          <Row align="middle" gutter={16}>
                            <Col><GlobalOutlined style={{ fontSize: '32px', color: '#722ed1' }} /></Col>
                            <Col flex="auto">
                              <Title level={5} style={{ margin: 0, color: '#722ed1' }}>Resolução DNS & WHOIS (Alvo: {domain})</Title>
                              <Text>O DNS resolveu o domínio para o IP <strong>{targetInfo.ip}</strong>. O provedor final responsável pela infraestrutura é <strong>AS{targetInfo.asn.number} - {targetInfo.asn.organization || 'Desconhecido'}</strong>, localizado em <strong>{targetInfo.geo.country || 'Localização Desconhecida'}</strong>.</Text>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  {hops.length > 0 && (
                    <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                      <Col xs={12} sm={6}><Card><Statistic title="Total de Saltos (Hops)" value={stats.totalHops} /></Card></Col>
                      <Col xs={12} sm={6}><Card><Statistic title="Maior Latência (RTT)" value={stats.maxRtt} suffix="ms" valueStyle={{ color: stats.maxRtt > '100' ? '#cf1322' : '#3f8600' }} /></Card></Col>
                      <Col xs={12} sm={6}><Card><Statistic title="ASNs Diferentes" value={stats.asnCount} /></Card></Col>
                      <Col xs={12} sm={6}><Card><Statistic title="Países Atravessados" value={stats.countryCount} /></Card></Col>
                    </Row>
                  )}

                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                      <Row gutter={[24, 24]}>
                        <Col span={24}>
                          <Card title="Topologia Lógica " bordered={false} extra={<Tag color="blue">Fronteiras BGP mapeadas</Tag>}>
                            <LogicalTopology hops={hops} onNodeClick={(hop) => setSelectedHop(hop)} />
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Card title="Topologia Física (Rotas e Datacenters)" bordered={false} extra={<Tag color="geekblue">GeoIP Tracking</Tag>}>
                            <PhysicalMap hops={hops} />
                          </Card>
                        </Col>
                      </Row>
                    </Col>
                    <Col xs={24} lg={8}>
                      <DidacticPanel hops={hops} />
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: '2',
              label: 'Camada de Aplicação Web',
              children: (
                <Card title={`Grafo de Dependências de Recursos (HTTP/HTTPS)`} bordered={false}>
                  <WebSurfaceMap targetDomain={domain} webNodes={l7Nodes} onNodeClick={(n) => setSelectedL7Node(n)} />
                </Card>
              )
            },
            {
              key: '3',
              label: 'Inspeção de Protocolos',
              children: (
                <EnrichmentPanel
                  domain={domain}
                  dnsData={dnsData}
                  openPorts={openPorts}
                  tlsData={tlsData}
                  isAnalyzing={isEnriching}
                />
              )
            },
            {
              key: '4',
              label: 'Histórico Convergente',
              children: (
                <ComparativeReport history={history} />
              )
            }
          ]}
        />
      </Content>

      <Modal
        title="Salvar Snapshot de Topologia"
        open={isSaveModalOpen}
        onOk={handleSaveSnapshot}
        onCancel={() => setIsSaveModalOpen(false)}
        okText="Salvar no Histórico"
        cancelText="Cancelar"
      >
        <Typography.Paragraph>
          Para permitir comparações futuras e gerar o Grafo Incremental, precisamos identificar a origem deste teste.
        </Typography.Paragraph>
        <Typography.Paragraph strong>
          De qual rede você está executando este mapeamento agora?
        </Typography.Paragraph>
        <Input
          placeholder="Ex: Wi-Fi Casa, 4G TIM, Rede da UFF..."
          size="large"
          value={networkContextName}
          onChange={(e) => setNetworkContextName(e.target.value)}
          onPressEnter={handleSaveSnapshot}
        />
      </Modal>

      <Modal
        title={<div><DeploymentUnitOutlined /> Análise Técnica do Salto {selectedHop?.hop}</div>}
        open={!!selectedHop}
        onCancel={() => setSelectedHop(null)}
        footer={[<Button key="close" onClick={() => setSelectedHop(null)}>Fechar</Button>]}
        width={700}
      >
        {selectedHop && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Endereço IP">{selectedHop.ip === '* * *' ? <Tag color="red">Pacote Descartado (Timeout)</Tag> : <Tag color="blue">{selectedHop.ip}</Tag>}</Descriptions.Item>
              <Descriptions.Item label="Sistema Autônomo (ASN)">{selectedHop.asn.number ? `AS${selectedHop.asn.number} - ${selectedHop.asn.organization}` : 'Não Identificado / Rede Privada'}</Descriptions.Item>
              <Descriptions.Item label="Geolocalização">{selectedHop.geo.city ? `${selectedHop.geo.city}, ${selectedHop.geo.country}` : 'Desconhecida / Uso Interno'}</Descriptions.Item>
              <Descriptions.Item label="Latência (RTT)">{selectedHop.rtt_ms ? `${selectedHop.rtt_ms.toFixed(2)} ms` : 'N/A'}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
              <Typography.Title level={5}>Modelo Mental (Camada de Rede): O que aconteceu aqui?</Typography.Title>
              <Typography.Paragraph style={{ fontSize: '15px' }}>{selectedHop.didatic_explanation}</Typography.Paragraph>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title={<div><ApiOutlined /> Análise de Recurso Web (Camada 7)</div>}
        open={!!selectedL7Node}
        onCancel={() => setSelectedL7Node(null)}
        footer={[<Button key="close" onClick={() => setSelectedL7Node(null)}>Fechar</Button>]}
        width={700}
      >
        {selectedL7Node && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Domínio Requisitado">{selectedL7Node.domain}</Descriptions.Item>
              <Descriptions.Item label="URL Completa">
                <Text copyable={{ text: selectedL7Node.url }} style={{ wordBreak: 'break-all' }}>
                  {selectedL7Node.url}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo de Relacionamento">
                <Tag color={selectedL7Node.category === 'internal' ? 'green' : selectedL7Node.category === 'subdomain' ? 'orange' : 'purple'}>
                  {selectedL7Node.category.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tipo de Recurso Detectado">{selectedL7Node.resource_type}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#e6f7ff', borderLeft: '4px solid #1890ff' }}>
              <Typography.Title level={5}>Modelo Mental (Camada de Aplicação): O que aconteceu aqui?</Typography.Title>
              <Typography.Paragraph style={{ fontSize: '15px' }}>{selectedL7Node.didatic_explanation}</Typography.Paragraph>
            </div>
          </>
        )}
      </Modal>

    </Layout>
  );
};

export default App;