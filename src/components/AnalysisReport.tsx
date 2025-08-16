import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, List, Tag, Checkbox, Affix, Button, Space } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AnalysisResult, CleanupItem, RiskLevel } from '../types';
import { mainBackground } from '../assets';

const { Paragraph, Title } = Typography;

interface AnalysisReportProps {
  analysisResult: AnalysisResult;
  onCleanupPlanChange?: (selectedItems: CleanupItem[]) => void;
  onStartCleanup?: (selectedItems: CleanupItem[]) => void;
  onBackToHome?: () => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ 
  analysisResult, 
  onCleanupPlanChange,
  onStartCleanup,
  onBackToHome 
}) => {
  const [selectedItems, setSelectedItems] = React.useState<CleanupItem[]>(
    analysisResult.aiAnalysis?.cleaning_plan?.filter(item => item.checked) || []
  );
  
  const handleItemCheck = (item: CleanupItem, checked: boolean) => {
    const newSelectedItems = checked 
      ? [...selectedItems, item]
      : selectedItems.filter(selected => selected.id !== item.id);
    
    setSelectedItems(newSelectedItems);
    onCleanupPlanChange?.(newSelectedItems);
  };
  
  const totalEstimatedSize = selectedItems.reduce(
    (total, item) => {
      // 计算所有有预估大小的清理项
      return total + (item.estimated_size_gb || 0);
    }, 
    0
  );
  
  const handleStartCleanup = () => {
    onStartCleanup?.(selectedItems);
  };
  
  // 获取风险等级的显示配置
  const getRiskLevelConfig = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low':
        return {
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a',
          text: '低风险',
          bgColor: '#f6ffed',
          borderColor: '#b7eb8f'
        };
      case 'medium':
        return {
          icon: <WarningOutlined style={{ color: '#faad14' }} />,
          color: '#faad14',
          text: '中等风险',
          bgColor: '#fffbe6',
          borderColor: '#ffe58f'
        };
      case 'high':
        return {
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
          color: '#ff4d4f',
          text: '高风险',
          bgColor: '#fff2f0',
          borderColor: '#ffccc7'
        };
      default:
        return {
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a',
          text: '低风险',
          bgColor: '#f6ffed',
          borderColor: '#b7eb8f'
        };
    }
  };
  
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundImage: `url(${mainBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative'
    }}>
      {/* 背景遮罩层 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 20, 40, 0.85)',
        zIndex: 1
      }} />
      
      <div style={{ 
        padding: '24px', 
        maxWidth: '800px', 
        margin: '0 auto', 
        paddingBottom: '80px',
        position: 'relative',
        zIndex: 2
      }}>
      {/* 页面标题和返回按钮 */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={2} style={{ 
          margin: 0, 
          color: '#00d4ff',
          fontSize: '32px',
          fontWeight: 700,
          textShadow: '0 0 10px rgba(0, 212, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
          letterSpacing: '1px'
        }}>
          智能分析报告
        </Title>
        {onBackToHome && (
          <Button 
            type="default" 
            icon={<ArrowLeftOutlined />} 
            onClick={onBackToHome}
            style={{
              borderRadius: '8px',
              height: '40px',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              borderColor: '#00d4ff',
              color: '#00d4ff',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 212, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            返回首页
          </Button>
        )}
      </div>
      {/* 顶部面板 - 磁盘使用概览 */}
      <Card bordered={false} style={{ 
        marginBottom: '24px',
        backgroundColor: 'rgba(0, 20, 40, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)'
      }}>
        <Row gutter={24}>
          <Col span={18}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '14px' }}>总容量</span>}
                  value={analysisResult.diskInfo.total}
                  valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '14px' }}>已使用</span>}
                  value={analysisResult.diskInfo.used}
                  valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '14px' }}>可用</span>}
                  value={analysisResult.diskInfo.available}
                  valueStyle={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}
                />
              </Col>
            </Row>
          </Col>
          <Col span={6} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Progress
              type="circle"
              percent={analysisResult.diskInfo.usagePercentage}
              format={percent => <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '18px' }}>{`${percent}%`}</span>}
              strokeColor={{
                '0%': '#00d4ff',
                '50%': '#00ff88',
                '80%': '#ff6b6b',
              }}
              trailColor="rgba(255, 255, 255, 0.1)"
              size={120}
              strokeWidth={8}
            />
          </Col>
        </Row>
      </Card>

      {/* 中部面板 - 根因分析 */}
      <Card 
        title={<span style={{ color: '#00d4ff', fontSize: '18px', fontWeight: 600 }}>磁盘空间占用分析</span>}
        style={{ 
          marginBottom: '24px',
          backgroundColor: 'rgba(0, 20, 40, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)'
        }}
      >
        <Paragraph style={{ 
          fontSize: '16px', 
          lineHeight: '1.8',
          color: '#ffffff',
          fontWeight: 500,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          {analysisResult.aiAnalysis?.root_cause_analysis || '分析数据不可用'}
        </Paragraph>
      </Card>

      {/* 底部面板 - 清理方案 */}
      <Card 
        title={<span style={{ color: '#00d4ff', fontSize: '18px', fontWeight: 600 }}>推荐清理方案</span>}
        style={{
          backgroundColor: 'rgba(0, 20, 40, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)'
        }}
      >
        <List
          dataSource={analysisResult.aiAnalysis?.cleaning_plan || []}
          renderItem={(item) => {
            const isChecked = selectedItems.some(selected => selected.id === item.id);
            const riskConfig = getRiskLevelConfig(item.risk_level || 'low');
            
            return (
              <List.Item
                style={{
                  background: 'rgba(0, 20, 40, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 212, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                }}
                onClick={() => handleItemCheck(item, !isChecked)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  {/* 左侧复选框 */}
                  <div style={{ marginRight: '16px', marginTop: '2px' }}>
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleItemCheck(item, e.target.checked);
                      }}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </div>
                  
                  {/* 中间内容区域 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* 标题行 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ 
                        color: '#ffffff', 
                        fontSize: '18px', 
                        fontWeight: 700,
                        lineHeight: '1.2',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>
                        {item.title}
                      </span>
                      
                      {/* 风险等级标签 */}
                      <Tag 
                        color={riskConfig.color} 
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 600,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          border: 'none'
                        }}
                      >
                        {riskConfig.icon} {riskConfig.text}
                      </Tag>
                      
                      {/* 高风险特殊标签 */}
                      {item.risk_level === 'high' && (
                        <Tag 
                          color="red" 
                          style={{ 
                            fontSize: '12px', 
                            fontWeight: 600,
                            borderRadius: '6px',
                            padding: '2px 8px',
                            border: 'none',
                            backgroundColor: '#ff4d4f',
                            color: 'white'
                          }}
                        >
                          需手动确认
                        </Tag>
                      )}
                    </div>
                    
                    {/* 描述文本 */}
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '15px',
                      lineHeight: '1.5',
                      marginBottom: item.risk_level === 'high' ? '8px' : '0',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}>
                      {item.description}
                    </div>
                    
                    {/* 高风险警告 */}
                    {item.risk_level === 'high' && (
                      <div style={{ 
                        color: '#ff6b6b', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        marginTop: '8px',
                        backdropFilter: 'blur(4px)'
                      }}>
                        ⚠️ 此操作涉及用户文件，请仔细确认后再执行
                      </div>
                    )}
                  </div>
                  
                  {/* 右侧大小标签 */}
                  {item.estimated_size_gb && item.estimated_size_gb >= 0 && (
                    <div style={{ marginLeft: '16px', alignSelf: 'flex-start' }}>
                      <Tag 
                        style={{ 
                          fontSize: '14px', 
                          fontWeight: 700,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 212, 255, 0.5)',
                          backgroundColor: 'rgba(0, 212, 255, 0.2)',
                          color: '#00d4ff',
                          backdropFilter: 'blur(4px)',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {item.estimated_size_gb.toFixed(1)} GB
                      </Tag>
                    </div>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
      
      {/* 固定操作栏 */}
      <Affix offsetBottom={0}>
        <div style={{
          background: 'rgba(0, 20, 40, 0.95)',
          backdropFilter: 'blur(15px)',
          padding: '20px 24px',
          borderTop: '1px solid rgba(0, 212, 255, 0.3)',
          textAlign: 'center',
          boxShadow: '0 -4px 20px rgba(0, 212, 255, 0.1)'
        }}>
          <Button
            type="primary"
            size="large"
            disabled={selectedItems.length === 0}
            onClick={handleStartCleanup}
            style={{ 
              minWidth: '240px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
              backgroundColor: selectedItems.length === 0 ? 'rgba(0, 212, 255, 0.3)' : '#00d4ff',
              borderColor: '#00d4ff',
              borderRadius: '24px',
              boxShadow: selectedItems.length === 0 ? 'none' : '0 4px 15px rgba(0, 212, 255, 0.4)',
              transition: 'all 0.3s ease',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          >
            一键清理{totalEstimatedSize > 0 ? ` (预计释放 ${totalEstimatedSize.toFixed(1)} GB)` : ''}
          </Button>
        </div>
      </Affix>
      </div>
    </div>
  );
};

export default AnalysisReport;