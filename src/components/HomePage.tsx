import React from 'react';
import { Button, Typography, Space, Spin, Progress } from 'antd';
import { ScanOutlined, SettingOutlined } from '@ant-design/icons';
import { mainBackground } from '../assets';

const { Title, Text } = Typography;

interface HomePageProps {
  isAnalyzing: boolean;
  onStartAnalysis: () => void;
  onGoToSettings?: () => void;
  collectionProgress?: number;
}

const HomePage: React.FC<HomePageProps> = ({ isAnalyzing, onStartAnalysis, onGoToSettings, collectionProgress = 0 }) => {
  const handleAnalyze = async () => {
    console.log('🚀 [主页] 开始系统分析流程');
    try {
      console.log('🔍 [主页] 调用分析函数');
      await onStartAnalysis();
      console.log('✅ [主页] 分析函数调用完成');
    } catch (error) {
      console.error('❌ [主页] 分析过程中发生错误:', error);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `url(${mainBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      position: 'relative'
    }}>
      {/* 背景遮罩层，确保文字可读性 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1
      }} />
      
      <Space direction="vertical" size="large" align="center" style={{ position: 'relative', zIndex: 2 }}>
        {/* App Logo和名称 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={1} style={{ 
            color: 'white', 
            marginBottom: '8px',
            fontSize: '36px',
            fontWeight: 700,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.3)',
            letterSpacing: '1px'
          }}>
            Mac智能清理助手
          </Title>
          <Text style={{ 
            color: 'white', 
            fontSize: '18px',
            fontWeight: 600,
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.5)',
            WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.2)',
            letterSpacing: '0.5px'
          }}>
            CleanYourMac AI Lite
          </Text>
        </div>

        {/* 主要操作按钮 */}
        {!isAnalyzing && (
          <Button
            type="primary"
            size="large"
            icon={<ScanOutlined />}
            onClick={handleAnalyze}
            style={{
              height: '60px',
              fontSize: '20px',
              fontWeight: 700,
              borderRadius: '30px',
              padding: '0 40px',
              background: '#52c41a',
              borderColor: '#52c41a',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.1)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            智能分析
          </Button>
        )}

        {/* 数据收集进度提示 */}
        {isAnalyzing && (
          <div style={{ width: '400px', textAlign: 'center', marginTop: '20px' }}>
            <Text style={{ 
              color: 'white', 
              fontSize: '18px',
              fontWeight: 700,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
              letterSpacing: '1px',
              display: 'block',
              marginBottom: '8px'
            }}>
              {collectionProgress < 100 ? '🔍 正在深度扫描系统文件' : '🤖 AI智能分析中'}
            </Text>
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '14px',
              fontWeight: 400,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
              letterSpacing: '0.5px'
            }}>
              {collectionProgress < 100 
                ? `正在收集系统数据和文件信息 (${collectionProgress}%)` 
                : '正在使用AI技术分析您的系统，为您推荐最佳清理方案'}
            </Text>
          </div>
        )}

        {/* 功能按钮组 */}
        {!isAnalyzing && onGoToSettings && (
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={onGoToSettings}
            style={{
              height: '40px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '20px',
              padding: '0 24px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              color: 'white',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)',
              letterSpacing: '0.5px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            应用设置
          </Button>
        )}

        {/* 副标题 */}
        {!isAnalyzing && (
          <Text style={{ 
            color: 'white', 
            fontSize: '16px',
            fontWeight: 500,
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.7)',
            letterSpacing: '0.5px',
            marginTop: '16px'
          }}>
            一键扫描，智能优化您的Mac
          </Text>
        )}
      </Space>
    </div>
  );
};

export default HomePage;