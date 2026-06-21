import React, { useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, useReactFlow, ReactFlowProvider, MarkerType, Panel, useNodesState, useEdgesState } from 'reactflow';
import { Tooltip, Tag } from 'antd';
import 'reactflow/dist/style.css';
import { WebNode } from '../types/topology';

interface WebSurfaceMapProps {
    targetDomain: string;
    webNodes: WebNode[];
    onNodeClick: (node: WebNode) => void;
}

const CrawlerRender: React.FC<WebSurfaceMapProps> = ({ targetDomain, webNodes, onNodeClick }) => {
    const { fitView } = useReactFlow();

    const { rfNodes, rfEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        if (!targetDomain) return { rfNodes: nodes, rfEdges: edges };

        const rootId = `root-${targetDomain}`;
        nodes.push({
            id: rootId,
            position: { x: -20, y: -20 },
            data: { label: <strong>{targetDomain.toUpperCase()}</strong> },
            style: {
                background: '#13c2c2', color: '#fff', border: '2px solid #08979c',
                borderRadius: '5%', width: 220, height: 120, display: 'flex',
                justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 4px 12px rgba(19, 194, 194, 0.4)', zIndex: 10
            }
        });

        const uniqueDomains = Array.from(new Set(webNodes.map(n => n.domain)));

        let intCount = 0, subCount = 0, extCount = 0;

        const intTotal = webNodes.filter(n => n.category === 'internal').length;
        const subTotal = webNodes.filter(n => n.category === 'subdomain').length;
        const extTotal = webNodes.filter(n => n.category === 'external').length;

        uniqueDomains.forEach((domain, idx) => {
            const relatedNodeData = webNodes.find(n => n.domain === domain)!;
            let angle = 0, radius = 0, color = '', tagColor = '';

            if (relatedNodeData.category === 'internal') {
                angle = (intCount / (intTotal || 1)) * 2 * Math.PI;
                radius = 250; color = '#52c41a'; tagColor = 'green'; intCount++;
            } else if (relatedNodeData.category === 'subdomain') {
                angle = (subCount / (subTotal || 1)) * 2 * Math.PI;
                radius = 400; color = '#faad14'; tagColor = 'orange'; subCount++;
            } else {
                angle = (extCount / (extTotal || 1)) * 2 * Math.PI;
                radius = 600; color = '#722ed1'; tagColor = 'purple'; extCount++;
            }

            const offsetRadius = radius + (idx % 2 === 0 ? 30 : -30);

            const x = offsetRadius * Math.cos(angle);
            const y = offsetRadius * Math.sin(angle);
            const nodeId = `node-${idx}`;

            nodes.push({
                id: nodeId,
                position: { x, y },
                data: {
                    rawDomain: domain,
                    label: (
                        <Tooltip title={relatedNodeData.didatic_explanation} placement="top">
                            <div style={{ textAlign: 'center' }}>
                                <Tag color={tagColor} style={{ marginBottom: '4px' }}>{relatedNodeData.category.toUpperCase()}</Tag>
                                <div style={{ fontSize: '11px', fontWeight: 600, wordBreak: 'break-all' }}>{domain}</div>
                            </div>
                        </Tooltip>
                    )
                },
                style: { width: 160, padding: '10px', background: '#fff', border: `2px solid ${color}`, borderRadius: '8px', cursor: 'pointer' }
            });

            edges.push({
                id: `edge-${rootId}-${nodeId}`, source: rootId, target: nodeId,
                animated: relatedNodeData.category === 'external',
                style: { stroke: color, strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: color }
            });
        });

        return { rfNodes: nodes, rfEdges: edges };
    }, [webNodes, targetDomain]);

    useEffect(() => {
        if (rfNodes.length > 1) {
            setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
        }
    }, [rfNodes.length, fitView]);
    const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

    useEffect(() => { setNodes(rfNodes); }, [rfNodes]);
    useEffect(() => { setEdges(rfEdges); }, [rfEdges]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => {
                if (node.id.startsWith('node-')) {
                    const domain = node.data.rawDomain;
                    const fullNode = webNodes.find(n => n.domain === domain);
                    if (fullNode) onNodeClick(fullNode);
                }
            }}
            minZoom={0.05}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
        >
            <Background color="#f0f2f5" gap={16} />
            <Controls />
            <Panel position="top-right" style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #d9d9d9', fontSize: '12px' }}>
                <strong>Legenda de Dependências (Camada 7)</strong>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}><div style={{ width: '12px', height: '12px', background: '#52c41a' }}></div> Páginas Internas</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}><div style={{ width: '12px', height: '12px', background: '#faad14' }}></div> Subdomínios</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}><div style={{ width: '12px', height: '12px', background: '#722ed1' }}></div> CDNs/APIs Externas</div>
            </Panel>
        </ReactFlow>
    );
};

export const WebSurfaceMap: React.FC<WebSurfaceMapProps> = (props) => (
    <div style={{ height: '800px', width: '100%', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
        <ReactFlowProvider><CrawlerRender {...props} /></ReactFlowProvider>
    </div>
);