import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, MarkerType, useNodesState, useEdgesState, ReactFlowProvider, Panel } from 'reactflow';
import { Card, Select, Typography, Empty, Tag, Row, Col, Statistic, Divider, List } from 'antd';
import 'reactflow/dist/style.css';
import { TraceSnapshot } from '../types/history';

interface ComparativeReportProps {
  history: TraceSnapshot[];
}

const PALETTE = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];

const ReportRender: React.FC<{ snapshots: TraceSnapshot[] }> = ({ snapshots }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  React.useEffect(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    const nodeMap = new Map<string, boolean>();

    const Y_OFFSET = 120;
    const X_OFFSET = 350;

    snapshots.forEach((snap, snapIdx) => {
      const routeColor = PALETTE[snapIdx % PALETTE.length];

      snap.hops.forEach((hop, hopIdx) => {
        const isTimeout = hop.status === 'timeout';
        const nodeId = isTimeout ? `timeout-${snap.id}-${hop.hop}` : `ip-${hop.ip}`;

        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, true);
          let labelStr = isTimeout ? '* * * (Timeout)' : hop.ip;
          let asnStr = hop.asn?.organization ? `AS${hop.asn.number} - ${hop.asn.organization}` : 'Rede Interna/Desconhecida';

          generatedNodes.push({
            id: nodeId,
            position: { x: snapIdx * X_OFFSET, y: hopIdx * Y_OFFSET },
            data: {
              label: (
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '14px' }}>{labelStr}</strong>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>{asnStr}</span>
                </div>
              )
            },
            style: {
              width: 240, padding: '10px', backgroundColor: '#fff',
              border: `2px solid ${isTimeout ? '#ffa39e' : '#d9d9d9'}`,
              borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }
          });
        }

        if (hopIdx > 0) {
          const prevHop = snap.hops[hopIdx - 1];
          const prevIsTimeout = prevHop.status === 'timeout';
          const prevId = prevIsTimeout ? `timeout-${snap.id}-${prevHop.hop}` : `ip-${prevHop.ip}`;

          const edgeId = `edge-${prevId}-${nodeId}`;
          const existingEdge = generatedEdges.find(e => e.id === edgeId);

          if (existingEdge) {
            if (!existingEdge.label?.toString().includes(snap.networkContext)) {
              existingEdge.label = `${existingEdge.label} + ${snap.networkContext}`;
            }

            existingEdge.style = { stroke: '#595959', strokeWidth: 3, strokeDasharray: '5,5' };
            existingEdge.markerEnd = { type: MarkerType.ArrowClosed, color: '#595959' };
            if (existingEdge.labelStyle) existingEdge.labelStyle.fill = '#595959';

          } else {
            generatedEdges.push({
              id: edgeId,
              source: prevId,
              target: nodeId,
              animated: true,
              label: snap.networkContext,
              labelStyle: { fill: routeColor, fontWeight: 600, fontSize: 11 },
              labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
              style: { stroke: routeColor, strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: routeColor },
            });
          }
        }
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [snapshots, setNodes, setEdges]);

  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView minZoom={0.05}>
      <Background color="#f0f2f5" gap={16} />
      <Controls />
      <Panel position="top-right" style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9', width: '250px' }}>
        <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>Origens Mapeadas</Typography.Title>
        {snapshots.map((s, idx) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: PALETTE[idx % PALETTE.length] }}></div>
            <Typography.Text strong style={{ fontSize: '12px' }}>{s.networkContext}</Typography.Text>
          </div>
        ))}
      </Panel>
    </ReactFlow>
  );
};

export const ComparativeReport: React.FC<ComparativeReportProps> = ({ history }) => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const uniqueDomains = useMemo(() => Array.from(new Set(history.map(h => h.domain.toLowerCase()))), [history]);

  const activeSnapshots = useMemo(() => {
    if (!selectedDomain) return [];
    return history.filter(h => h.domain.toLowerCase() === selectedDomain);
  }, [history, selectedDomain]);

  const insights = useMemo(() => {
    if (activeSnapshots.length < 2) return null;

    // 1. Estatísticas individuais
    const statsMap = activeSnapshots.map(snap => {
      const maxRtt = Math.max(...snap.hops.map(h => h.rtt_ms || 0));
      const asnsCount = new Set(snap.hops.map(h => h.asn.number).filter(Boolean)).size;
      return { snap, maxRtt, asnsCount };
    });

    const fastest = statsMap.reduce((prev, curr) => prev.maxRtt < curr.maxRtt ? prev : curr);
    const slowest = statsMap.reduce((prev, curr) => prev.maxRtt > curr.maxRtt ? prev : curr);
    const deltaRtt = Math.abs(slowest.maxRtt - fastest.maxRtt);

    // 2. Mapeamento de Frequência de IPs
    const ipUsageMap = new Map<string, { asnOrg: string; networks: Set<string> }>();

    activeSnapshots.forEach(snap => {
      snap.hops.forEach(hop => {
        if (hop.status === 'success' && !hop.ip.startsWith('192.168.') && !hop.ip.startsWith('10.') && !hop.ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          if (!ipUsageMap.has(hop.ip)) {
            ipUsageMap.set(hop.ip, {
              asnOrg: hop.asn.organization || 'ASN Desconhecido',
              networks: new Set([snap.networkContext])
            });
          } else {
            ipUsageMap.get(hop.ip)!.networks.add(snap.networkContext);
          }
        }
      });
    });

    const convergences: { ip: string; asnOrg: string; networks: string[]; isGlobal: boolean }[] = [];

    ipUsageMap.forEach((data, ip) => {
      if (data.networks.size >= 2) {
        convergences.push({
          ip,
          asnOrg: data.asnOrg,
          networks: Array.from(data.networks),
          isGlobal: data.networks.size === activeSnapshots.length
        });
      }
    });

    convergences.sort((a, b) => (a.isGlobal === b.isGlobal ? 0 : a.isGlobal ? -1 : 1));

    return { statsMap, fastest, slowest, deltaRtt, convergences };
  }, [activeSnapshots]);

  if (history.length === 0) {
    return (
      <Card bordered={false}>
        <Empty description="Nenhum histórico salvo. Realize mapeamentos na aba de Roteamento L3 e clique em 'Salvar Snapshot'." />
      </Card>
    );
  }

  return (
    <Card bordered={false} title="Análise de Roteamento Multi-Origem">
      <div style={{ marginBottom: '24px' }}>
        <Typography.Text strong style={{ marginRight: '16px' }}>Selecione o Alvo de Análise:</Typography.Text>
        <Select
          style={{ width: 300 }}
          placeholder="Escolha um Domínio"
          onChange={setSelectedDomain}
          options={uniqueDomains.map(d => ({ label: d, value: d }))}
        />
      </div>

      {insights && (
        <Card style={{ marginBottom: '24px' }} title="Insights de Assimetria de Roteamento">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              {insights.statsMap.map((stat, idx) => (
                <Statistic
                  key={stat.snap.id}
                  title={
                    <>
                      <b>Latência:</b> {stat.snap.networkContext} ({stat.asnsCount} ASNs)
                    </>
                  }
                  value={stat.maxRtt.toFixed(1)}
                  suffix="ms"
                  valueStyle={{ color: PALETTE[idx % PALETTE.length], fontSize: '16px' }}
                  style={{ marginBottom: '8px' }}
                />
              ))}
            </Col>

            <Col xs={24} md={8}>
              <Statistic title="Máxima Variância de Latência (Delta)" value={insights.deltaRtt.toFixed(1)} suffix="ms" />
              <Divider style={{ margin: '12px 0' }} />
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                A rede mais rápida detectada foi <strong>{insights.fastest.snap.networkContext}</strong>. A rede mais lenta foi <strong>{insights.slowest.snap.networkContext}</strong>. O delta demonstra o impacto do trânsito na latência total.
              </Typography.Text>
            </Col>

            <Col xs={24} md={8}>
              <Typography.Text strong>Pontos de convergência detectados:</Typography.Text>

              <div style={{ marginTop: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {insights.convergences.length > 0 ? (
                  <List
                    size="small"
                    dataSource={insights.convergences}
                    renderItem={item => (
                      <List.Item style={{ padding: '8px', backgroundColor: item.isGlobal ? '#f6ffed' : '#e6f7ff', borderLeft: `4px solid ${item.isGlobal ? '#52c41a' : '#1890ff'}`, marginBottom: '8px', borderRadius: '4px', display: 'block' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography.Text>{item.ip}</Typography.Text>
                          {item.isGlobal ? <Tag color="success">Convergência Global</Tag> : <Tag color="processing">Convergência Parcial</Tag>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#595959', marginTop: '4px' }}>{item.asnOrg}</div>
                        <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '2px' }}>
                          <strong>Redes:</strong> {item.networks.join(' + ')}
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#fffbe6', borderLeft: '4px solid #faad14' }}>
                    <Typography.Text>Nenhum ponto de convergência. As rotas são totalmente disjuntas.</Typography.Text>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {activeSnapshots.length > 0 && (
        <div style={{ height: '500px', width: '100%', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
          <ReactFlowProvider>
            <ReportRender snapshots={activeSnapshots} />
          </ReactFlowProvider>
        </div>
      )}
    </Card>
  );
};