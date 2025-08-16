import React from 'react';
import { Result, Card, Statistic, Row, Col, List, Button, Space } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { CleanupResult as CleanupResultType, DiskInfo } from '../types';

interface CleanupResultProps {
  beforeDiskInfo: DiskInfo;
  afterDiskInfo: DiskInfo;
  cleanupResult: CleanupResultType;
  onReanalyze: () => void;
}

const CleanupResult: React.FC<CleanupResultProps> = ({ 
  beforeDiskInfo, 
  afterDiskInfo, 
  cleanupResult, 
  onReanalyze 
}) => {
  const freedSpaceGB = cleanupResult.totalFreedGB;
  const beforeUsagePercent = beforeDiskInfo.usagePercentage;
  const afterUsagePercent = afterDiskInfo.usagePercentage;
  const usageImprovement = beforeUsagePercent - afterUsagePercent;
  
  const formatBytes = (bytes: string): string => {
    const num = parseFloat(bytes);
    if (num >= 1024 ** 3) {
      return `${(num / (1024 ** 3)).toFixed(1)} GB`;
    } else if (num >= 1024 ** 2) {
      return `${(num / (1024 ** 2)).toFixed(1)} MB`;
    } else {
      return `${(num / 1024).toFixed(1)} KB`;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5', 
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 成功结果展示 */}
        <Result
          icon={<TrophyOutlined style={{ color: '#52c41a' }} />}
          status="success"
          title="清理完成！"
          subTitle={`成功释放了 ${freedSpaceGB.toFixed(1)} GB 磁盘空间，让您的Mac运行更流畅`}
          style={{
            background: 'white',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
        />

        {/* 清理前后对比 */}
        <Card 
          title="清理前后对比"
          bordered={false}
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card 
                title="清理前"
                size="small"
                style={{ 
                  background: '#fff2e8',
                  border: '1px solid #ffbb96'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                   <Statistic
                     title="已使用空间"
                     value={formatBytes(beforeDiskInfo.used)}
                     valueStyle={{ color: '#fa8c16' }}
                   />
                   <Statistic
                     title="可用空间"
                     value={formatBytes(beforeDiskInfo.available)}
                   />
                   <Statistic
                     title="使用率"
                     value={beforeUsagePercent}
                     suffix="%"
                     valueStyle={{ color: '#fa8c16' }}
                   />
                 </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title="清理后"
                size="small"
                style={{ 
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                   <Statistic
                     title="已使用空间"
                     value={formatBytes(afterDiskInfo.used)}
                     valueStyle={{ color: '#52c41a' }}
                   />
                   <Statistic
                     title="可用空间"
                     value={formatBytes(afterDiskInfo.available)}
                     valueStyle={{ color: '#52c41a' }}
                   />
                   <Statistic
                     title="使用率"
                     value={afterUsagePercent}
                     suffix="%"
                     valueStyle={{ color: '#52c41a' }}
                   />
                 </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 清理统计 */}
        <Card 
          title="清理统计"
          bordered={false}
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Statistic
                 title="释放空间"
                 value={freedSpaceGB.toFixed(1)}
                 suffix="GB"
                 valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                 prefix={<TrophyOutlined />}
               />
            </Col>
            <Col span={8}>
              <Statistic
                 title="清理项目数"
                 value={cleanupResult.completedItems.length}
                 valueStyle={{ color: '#52c41a' }}
                 prefix={<CheckCircleOutlined />}
               />
            </Col>
            <Col span={8}>
              <Statistic
                title="使用率改善"
                value={usageImprovement.toFixed(1)}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 已清理项目列表 */}
         {cleanupResult.completedItems.length > 0 && (
           <Card 
             title={`已清理项目 (${cleanupResult.completedItems.length})`}
             bordered={false}
             style={{ 
               marginBottom: '24px',
               borderRadius: '12px',
               boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
             }}
           >
             <List
               dataSource={cleanupResult.completedItems}
               renderItem={(item) => (
                 <List.Item>
                   <List.Item.Meta
                     avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />}
                     title={item.description}
                     description={`已释放 ${(item.estimated_size_gb || 0).toFixed(1)} GB 空间`}
                   />
                 </List.Item>
               )}
             />
           </Card>
         )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={onReanalyze}
            style={{
              borderRadius: '8px',
              height: '48px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            重新分析
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CleanupResult;