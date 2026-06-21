import React, { useEffect, useRef } from 'react';
import { Timeline, Typography, Tag } from 'antd';
import { CheckCircleOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { HopResponse } from '../types/topology';

const { Text } = Typography;

interface DidacticPanelProps {
  hops: HopResponse[];
}

export const DidacticPanel: React.FC<DidacticPanelProps> = ({ hops }) => {
  const endOfTimelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfTimelineRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hops]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />;
      case 'timeout': return <SyncOutlined spin style={{ fontSize: '16px', color: '#faad14' }} />;
      default: return <CloseCircleOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />;
    }
  };

  return (
    <div style={{ height: '100%', maxHeight: 1200, overflowY: 'auto', padding: '16px', backgroundColor: '#fafafa', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
      <Typography.Title level={4}>Camada de Rede</Typography.Title>
      
      {hops.length === 0 && <Text type="secondary">Inicie o rastreamento para visualizar os eventos...</Text>}
      
      <Timeline style={{ marginTop: '20px' }}>
        {hops.map((hop) => (
          <Timeline.Item key={hop.hop} dot={getStatusIcon(hop.status)}>
            <div style={{ marginBottom: '8px' }}>
              <strong>IP: {hop.ip}</strong> 
              {hop.rtt_ms && <Tag color="blue" style={{ marginLeft: '8px' }}>{hop.rtt_ms.toFixed(1)} ms</Tag>}
            </div>
            <div style={{ fontSize: '13px', color: '#595959' }}>
              {hop.didatic_explanation}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
      <div ref={endOfTimelineRef} />
    </div>
  );
};