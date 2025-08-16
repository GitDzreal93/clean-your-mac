import React from 'react';
import { Card, Progress, Steps, List, Typography, Space, Spin } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { CleanupItem } from '../types';

const { Title, Text } = Typography;
const { Step } = Steps;

interface CleanupExecutionProps {
  selectedItems: CleanupItem[];
  currentItem?: CleanupItem;
  completedCount: number;
  isCompleted: boolean;
}

const CleanupExecution: React.FC<CleanupExecutionProps> = ({
  selectedItems,
  currentItem,
  completedCount,
  isCompleted
}) => {
  const totalItems = selectedItems.length;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const completedItems = selectedItems.slice(0, completedCount);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* 清理进度卡片 */}
        <Card 
          bordered={false}
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              {isCompleted ? '清理完成！' : '正在清理中...'}
            </Title>
            
            <Progress
              type="circle"
              percent={progress}
              size={120}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              format={(percent) => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{percent}%</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {isCompleted ? '已完成' : `${completedCount}/${totalItems}`}
                  </div>
                </div>
              )}
            />
            
            {!isCompleted && currentItem && (
              <div style={{ textAlign: 'center' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <Text style={{ 
                  display: 'block', 
                  marginTop: '12px',
                  fontSize: '16px',
                  color: '#595959'
                }}>
                  正在执行：{currentItem.description}
                </Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  预计释放 {(currentItem.estimated_size_gb || 0).toFixed(1)} GB
                </Text>
              </div>
            )}
          </Space>
        </Card>

        {/* 清理步骤 */}
        <Card 
          title="清理进度"
          bordered={false}
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Steps
            direction="vertical"
            size="small"
            current={completedCount}
            status={isCompleted ? 'finish' : 'process'}
          >
            {selectedItems.map((item, index) => {
              let status: 'wait' | 'process' | 'finish' | 'error' = 'wait';
              let icon = undefined;
              
              if (index < completedCount) {
                status = 'finish';
                icon = <CheckCircleOutlined />;
              } else if (index === completedCount && !isCompleted && currentItem?.id === item.id) {
                status = 'process';
                icon = <LoadingOutlined />;
              }
              
              return (
                <Step
                  key={item.id}
                  title={item.description}
                  description={`预计释放 ${(item.estimated_size_gb || 0).toFixed(1)} GB`}
                  status={status}
                  icon={icon}
                />
              );
            })}
          </Steps>
        </Card>

        {/* 已完成项目列表 */}
        {completedItems.length > 0 && (
          <Card 
            title={`已完成项目 (${completedItems.length}/${totalItems})`}
            bordered={false}
            style={{ 
              marginTop: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <List
              dataSource={completedItems}
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
      </div>
    </div>
  );
};

export default CleanupExecution;