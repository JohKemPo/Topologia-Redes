import React, { useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType, useReactFlow, ReactFlowProvider, Panel, useNodesState, useEdgesState } from 'reactflow';
import { Tooltip, Tag } from 'antd';
import 'reactflow/dist/style.css';
import { HopResponse } from '../types/topology';

interface LogicalTopologyProps {
  hops: HopResponse[];
  onNodeClick?: (hop: HopResponse) => void;
}

const GraphRender: React.FC<LogicalTopologyProps> = ({ hops, onNodeClick }) => {
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    const blocks: { id: string; asnStr: string; hops: HopResponse[] }[] = [];
    let currentBlock: typeof blocks[0] | null = null;

    hops.forEach((hop) => {
      let asnStr = 'Rede Privada / Desconhecida';
      if (hop.status === 'timeout') asnStr = 'Tráfego Bloqueado (Timeout)';
      else if (hop.asn.number) asnStr = `AS${hop.asn.number} - ${hop.asn.organization}`;

      if (!currentBlock || currentBlock.asnStr !== asnStr) {
        currentBlock = { id: `block-${hop.hop}`, asnStr, hops: [] };
        blocks.push(currentBlock);
      }
      currentBlock.hops.push(hop);
    });

    let currentX = 0;
    const Y_PADDING = 70;
    const NODE_WIDTH = 220;
    const NODE_GAP = 80;

    blocks.forEach((block) => {
      const blockWidth = Math.max(300, (block.hops.length * NODE_WIDTH) + ((block.hops.length + 1) * NODE_GAP));
      const isTimeoutBlock = block.asnStr.includes('Timeout');
      const isPrivateBlock = block.asnStr.includes('Privada');

      generatedNodes.push({
        id: block.id,
        type: 'group',
        position: { x: currentX, y: 0 },
        data: { label: '' },
        style: {
          width: blockWidth,
          height: 280,
          backgroundColor: isTimeoutBlock ? 'rgba(255, 77, 79, 0.05)' : isPrivateBlock ? 'rgba(250, 173, 20, 0.05)' : 'rgba(24, 144, 255, 0.05)',
          border: `2px dashed ${isTimeoutBlock ? '#ff4d4f' : isPrivateBlock ? '#faad14' : '#1890ff'}`,
          borderRadius: '12px',
        }
      });

      generatedNodes.push({
        id: `${block.id}-label`,
        parentNode: block.id,
        extent: 'parent',
        // draggable: false,
        position: { x: 20, y: -30 },
        data: { label: <strong>{block.asnStr}</strong> },
        style: { border: 'none', background: 'transparent', width: 'auto', fontSize: '16px', color: '#595959' }
      });

      block.hops.forEach((hop, idx) => {
        const isTimeout = hop.status === 'timeout';

        generatedNodes.push({
          id: `hop-${hop.hop}`,
          parentNode: block.id,
          extent: 'parent',
          position: { x: NODE_GAP + (idx * (NODE_WIDTH + NODE_GAP)), y: Y_PADDING },
          data: {
            label: (
              <Tooltip title={isTimeout ? "Roteador não respondeu (ICMP Drop/Rate Limiting)" : `Coordenada: ${hop.geo.city || 'N/A'}`}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Tag color={isTimeout ? 'red' : 'blue'}>Salto {hop.hop}</Tag>
                  <strong style={{ fontSize: '14px' }}>{isTimeout ? '* * *' : hop.ip}</strong>
                  {!isTimeout && hop.rtt_ms && (
                    <span style={{ fontSize: '13px', color: '#595959' }}>RTT: {hop.rtt_ms.toFixed(1)} ms</span>
                  )}
                  <span style={{ fontSize: '10px', color: '#1890ff', cursor: 'pointer' }}>Clique para Análise</span>
                </div>
              </Tooltip>
            )
          },
          style: {
            width: NODE_WIDTH,
            padding: '16px 8px',
            backgroundColor: '#ffffff',
            borderColor: isTimeout ? '#ffa39e' : '#d9d9d9',
            borderWidth: '2px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }
        });
      });

      currentX += blockWidth + 150; 
    });

    hops.forEach((hop, index) => {
      if (index > 0) {
        const prevHop = hops[index - 1];
        const isBgpCross = (prevHop.asn.number !== hop.asn.number) || (prevHop.status !== hop.status);

        generatedEdges.push({
          id: `edge-${prevHop.hop}-${hop.hop}`,
          source: `hop-${prevHop.hop}`,
          target: `hop-${hop.hop}`,
          animated: true,
          label: isBgpCross ? 'Fronteira BGP (Trânsito/Peering)' : '',
          labelStyle: { fill: isBgpCross ? '#fff' : '#595959', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: isBgpCross ? '#1890ff' : '#ffffff', fillOpacity: 1 },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          style: { stroke: isBgpCross ? '#1890ff' : '#d9d9d9', strokeWidth: isBgpCross ? 3 : 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: isBgpCross ? '#1890ff' : '#d9d9d9' },
        });
      }
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [hops]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => { setNodes(nodes); }, [nodes]);
  useEffect(() => { setEdges(edges); }, [edges]);

  useEffect(() => {
    if (nodesState.length > 0) {
      setTimeout(() => fitView({ padding: 0.1, duration: 800 }), 50);
    }
  }, [nodesState.length, fitView]);

  return (
    <ReactFlow
      nodes={nodesState}
      edges={edgesState}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => {
        if (onNodeClick && node.id.startsWith('hop-')) {
          const hopId = parseInt(node.id.replace('hop-', ''), 10);
          const selectedHop = hops.find(h => h.hop === hopId);
          if (selectedHop) onNodeClick(selectedHop);
        }
      }}
      minZoom={0.05}
    >
      <Background color="#f0f2f5" gap={16} />
      <Controls />
      <MiniMap nodeColor={(n) => n.type === 'group' ? 'transparent' : (n.style?.borderColor as string || '#d9d9d9')} nodeStrokeWidth={3} zoomable pannable />
      <Panel position="top-right" style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #d9d9d9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '12px' }}>
        <strong>Legenda Lógica</strong>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(24, 144, 255, 0.1)', border: '2px dashed #1890ff' }}></div> Sistema Autônomo (ASN) Público
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'rgba(255, 77, 79, 0.1)', border: '2px dashed #ff4d4f' }}></div> Roteador Silencioso (Timeout)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
          <div style={{ width: '16px', height: '3px', background: '#1890ff' }}></div> Fronteira de Peering / Trânsito BGP
        </div>
      </Panel>
    </ReactFlow>
  );
};

export const LogicalTopology: React.FC<LogicalTopologyProps> = (props) => (
  <div style={{ height: '550px', width: '100%', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
    <ReactFlowProvider><GraphRender {...props} /></ReactFlowProvider>
  </div>
);
