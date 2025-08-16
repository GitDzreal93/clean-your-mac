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
  
  const parseStorageSize = (sizeStr: string): number => {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)/i);
    if (!match) {
      console.warn('⚠️ 无法解析存储大小:', sizeStr);
      return 0;
    }
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 ** 2,
      'GB': 1024 ** 3,
      'TB': 1024 ** 4
    };
    
    return value * (multipliers[unit] || 1);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 ** 3) {
      return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
    } else if (bytes >= 1024 ** 2) {
      return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${bytes.toFixed(0)} B`;
    }
  };

  // 计算真实的空间变化
  const beforeUsedBytes = parseStorageSize(beforeDiskInfo.used);
  const afterUsedBytes = parseStorageSize(afterDiskInfo.used);
  const beforeAvailableBytes = parseStorageSize(beforeDiskInfo.available);
  const afterAvailableBytes = parseStorageSize(afterDiskInfo.available);
  
  const actualFreedBytes = Math.max(0, beforeUsedBytes - afterUsedBytes);
  const actualFreedGB = actualFreedBytes / (1024 ** 3);
  
  // 使用实际释放的空间，如果计算结果为0则使用预估值
  const displayFreedGB = actualFreedGB > 0.01 ? actualFreedGB : freedSpaceGB;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5', 
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 成功结果展示 */}
        <Result
          icon={<TrophyOutlined style={{ color: '#ffffff', fontSize: '48px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />}
          status="success"
          title={
            <span style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
              letterSpacing: '1px'
            }}>
              清理完成！
            </span>
          }
          subTitle={
            <span style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '500',
              textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
              lineHeight: '1.6',
              display: 'block',
              marginTop: '8px'
            }}>
              成功释放了 {displayFreedGB.toFixed(1)} GB 磁盘空间，让您的Mac运行更流畅
            </span>
          }
          style={{
            backgroundImage: 'url("/src/assets/images/backgrounds/result_bg.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(168, 230, 207, 0.3), 0 8px 40px rgba(168, 230, 207, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            padding: '40px 20px'
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
                     value={formatBytes(beforeUsedBytes)}
                     valueStyle={{ color: '#fa8c16' }}
                   />
                   <Statistic
                     title="可用空间"
                     value={formatBytes(beforeAvailableBytes)}
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
                     value={formatBytes(afterUsedBytes)}
                     valueStyle={{ color: '#52c41a' }}
                   />
                   <Statistic
                     title="可用空间"
                     value={formatBytes(afterAvailableBytes)}
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
                 value={displayFreedGB.toFixed(1)}
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