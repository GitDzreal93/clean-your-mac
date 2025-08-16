import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, message, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import HomePage from './components/HomePage';
import AnalysisReport from './components/AnalysisReport';
import CleanupExecution from './components/CleanupExecution';
import CleanupResult from './components/CleanupResult';
import SettingsPage from './components/SettingsPage';
import { AppState, AnalysisResult, CleanupItem, AppConfig } from './types';
import { StorageService } from './services/storageService';
import { AIService } from './services/aiService';
import { CleanupService } from './services/cleanupService';
import configService from './services/configService';
import './styles/global.css';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'home',
    isAnalyzing: false,
    isCleaning: false,
    diskInfo: null,
    analysisResult: null,
    cleanupResult: null,
    cleanupState: null,
    apiKey: '',
    whitelist: [],
    config: null
  });

  const [collectionProgress, setCollectionProgress] = useState(0);

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');


  const storageService = new StorageService();
  const cleanupService = new CleanupService();
  const [aiService] = useState(() => new AIService());

  // 初始化配置
  useEffect(() => {
    initializeConfig();
  }, []);

  const initializeConfig = async () => {
    try {
      const config = await configService.loadConfig();
      setAppState(prev => ({
        ...prev,
        config,
        apiKey: config.deepseekApiKey || '',
        whitelist: config.whitelist
      }));
      
      // 设置AI服务的API密钥
      if (config.deepseekApiKey) {
        aiService.setApiKey(config.deepseekApiKey);
      }
      
      // 设置清理服务的白名单
        cleanupService.setWhitelist(config.whitelist);

    } catch (error) {
      console.error('初始化配置失败:', error);
    }
  };

  const handleStartAnalysis = async () => {
    console.log('🚀 [App] 开始系统分析流程');
    
    // 检查API密钥
    let currentApiKey = appState.apiKey;
    console.log('🔑 [App] 检查API密钥，当前密钥长度:', currentApiKey.length);
    
    if (!currentApiKey.trim()) {
      console.log('🔍 [App] 当前无API密钥，尝试从配置中获取');
      // 尝试从配置中获取密钥
      const savedApiKey = await configService.getApiKey();
      if (savedApiKey) {
        console.log('✅ [App] 从配置中获取到API密钥，长度:', savedApiKey.length);
        currentApiKey = savedApiKey;
        setAppState(prev => ({ ...prev, apiKey: savedApiKey }));
        aiService.setApiKey(savedApiKey);
      } else {
        console.log('❌ [App] 配置中无API密钥，显示输入模态框');
        setShowApiKeyModal(true);
        return;
      }
    }

    console.log('📊 [App] 设置分析状态为进行中');
    setAppState(prev => ({ ...prev, isAnalyzing: true }));
    setCollectionProgress(0);

    try {
      // 使用Web Worker收集磁盘信息和详细数据（非阻塞主线程）
      console.log('🔍 [App] 开始异步收集系统数据');
      const systemData = await storageService.collectDetailedAnalysisAsync(
        (progress) => {
          console.log('📊 [App] 数据收集进度:', progress + '%');
          setCollectionProgress(progress);
        }
      );
      console.log('✅ [App] 系统数据收集完成:', JSON.stringify(systemData, null, 2));
      
      console.log('🔧 [App] 格式化数据用于AI分析');
      const analysisText = storageService.formatDataForAI(systemData);
      console.log('📝 [App] 格式化后的分析文本长度:', analysisText.length);
      
      // AI分析
      console.log('🤖 [App] 开始AI分析');
      aiService.setApiKey(appState.apiKey);
      const analysisResult = await aiService.analyzeStorage(analysisText);
      console.log('✅ [App] AI分析完成:', JSON.stringify(analysisResult, null, 2));
      
      const analysisResultData: AnalysisResult = {
        diskInfo: systemData.diskInfo,
        aiAnalysis: analysisResult
      };
      
      console.log('💾 [App] 保存分析结果并切换页面');
      console.log('📋 [App] 最终分析结果:', JSON.stringify(analysisResultData, null, 2));
      
      setAppState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentPage: 'analysis',
        diskInfo: systemData.diskInfo,
        analysisResult: analysisResultData
      }));
      
      console.log('🎯 [App] 分析流程完成，已切换到分析页面');
    } catch (error) {
      console.error('❌ [App] 分析失败:', error);
      console.error('❌ [App] 错误详情:', error instanceof Error ? error.message : String(error));
      message.error('分析失败，请检查网络连接和API密钥');
      setAppState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleStartCleanup = async (items: CleanupItem[]) => {
    // 设置白名单到清理服务
    cleanupService.setWhitelist(appState.whitelist);
    
    setAppState(prev => ({ 
      ...prev, 
      currentPage: 'cleanup',
      isCleaning: true,
      cleanupState: {
         selectedItems: items,
         currentItem: undefined,
         completedCount: 0,
         isCompleted: false,
         errors: []
       }
    }));

    try {
      // 使用非阻塞清理方法
      const cleanupResult = await cleanupService.executeCleanupAsync(
        items,
        // 进度回调
        (progress) => {
          setAppState(prev => ({
            ...prev,
            cleanupState: {
              ...prev.cleanupState!,
              currentItem: progress.currentItem,
              completedCount: progress.completedCount
            }
          }));
        },
        // 单项完成回调
        (item, success, error) => {
          if (!success && error) {
            console.error(`清理项目失败: ${item.description}`, error);
            message.error(`清理项目 ${item.description} 失败`);
          }
        }
      );

      // 标记清理完成
      setAppState(prev => ({
        ...prev,
        cleanupState: {
          ...prev.cleanupState!,
          isCompleted: true,
          currentItem: undefined
        }
      }));

      // 3秒后跳转到结果页面
      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          currentPage: 'result',
          isCleaning: false,
          cleanupResult
        }));
      }, 3000);
    } catch (error) {
      console.error('清理过程出错:', error);
      message.error('清理过程中出现错误');
      setAppState(prev => ({
        ...prev,
        isCleaning: false
      }));
    }
  };

  const handleBackToHome = () => {
      setAppState({
        currentPage: 'home',
        isAnalyzing: false,
        isCleaning: false,
        diskInfo: null,
        analysisResult: null,
        cleanupResult: null,
        cleanupState: null,
        apiKey: appState.apiKey,
        whitelist: appState.whitelist,
        config: appState.config
      });
    };


  
  const handleGoToSettings = () => {
    setAppState(prev => ({ ...prev, currentPage: 'settings' }));
  };
  
  const handleConfigChange = async (config: AppConfig) => {
    setAppState(prev => ({
      ...prev,
      config,
      apiKey: config.deepseekApiKey || '',
      whitelist: config.whitelist
    }));
    
    // 更新AI服务的API密钥
    if (config.deepseekApiKey) {
      aiService.setApiKey(config.deepseekApiKey);
    }
    
    // 更新清理服务的白名单
    cleanupService.setWhitelist(config.whitelist);
  };



  const handleApiKeySubmit = async () => {
    if (!apiKeyInput.trim()) {
      message.error('请输入API密钥');
      return;
    }
    
    const apiKey = apiKeyInput.trim();
    
    try {
      // 保存API密钥到配置服务
      await configService.setApiKey(apiKey);
      
      setAppState(prev => ({ ...prev, apiKey }));
      setShowApiKeyModal(false);
      setApiKeyInput('');
      
      message.success('API密钥已保存');
      
      // 延迟一小段时间让弹窗关闭动画完成，然后开始分析
      setTimeout(() => {
        handleStartAnalysisWithKey(apiKey);
      }, 200);
    } catch (error) {
      console.error('保存API密钥失败:', error);
      message.error('保存API密钥失败');
    }
  };
  
  const handleStartAnalysisWithKey = async (apiKey: string) => {
    console.log('开始分析，API密钥长度:', apiKey.length);
    setAppState(prev => ({ ...prev, isAnalyzing: true }));
    setCollectionProgress(0);
    
    try {
      console.log('开始异步收集系统数据...');
      // 使用Web Worker收集磁盘信息和详细数据（非阻塞主线程）
      const systemData = await storageService.collectDetailedAnalysisAsync(
        (progress) => {
          setCollectionProgress(progress);
          console.log('数据收集进度:', progress + '%');
        }
      );
      console.log('系统数据收集完成:', systemData);
      
      const analysisText = storageService.formatDataForAI(systemData);
      console.log('格式化数据完成，长度:', analysisText.length);
      
      // AI分析
      console.log('开始AI分析...');
      aiService.setApiKey(apiKey);
      const analysisResult = await aiService.analyzeStorage(analysisText);
      console.log('AI分析完成:', analysisResult);
      
      const analysisResultData: AnalysisResult = {
        diskInfo: systemData.diskInfo,
        aiAnalysis: analysisResult
      };
      
      console.log('设置分析结果到状态...');
      setAppState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentPage: 'analysis',
        diskInfo: systemData.diskInfo,
        analysisResult: analysisResultData
      }));
      console.log('分析流程完成');
    } catch (error) {
      console.error('分析失败:', error);
      message.error('分析失败，请检查网络连接和API密钥');
      setAppState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const renderCurrentPage = () => {
    switch (appState.currentPage) {
      case 'home':
        return (
          <HomePage 
            isAnalyzing={appState.isAnalyzing}
            onStartAnalysis={handleStartAnalysis}

            onGoToSettings={handleGoToSettings}
            collectionProgress={collectionProgress}
          />
        );
      
      case 'analysis':
         if (!appState.analysisResult) {
           return (
             <div style={{ padding: '24px', textAlign: 'center' }}>
               <p>分析结果不可用，请重新开始分析</p>
               <Button onClick={() => setAppState(prev => ({ ...prev, currentPage: 'home' }))}>
                 返回首页
               </Button>
             </div>
           );
         }
         return (
           <AnalysisReport 
             analysisResult={appState.analysisResult}
             onCleanupPlanChange={(selectedItems) => {
               // 可以在这里处理选中项变化
               console.log('Selected items changed:', selectedItems);
             }}
             onStartCleanup={(selectedItems) => {
               handleStartCleanup(selectedItems);
             }}
             onBackToHome={() => setAppState(prev => ({ ...prev, currentPage: 'home' }))}
           />
         );
      
      case 'cleanup':
         return (
           <CleanupExecution 
             selectedItems={appState.cleanupState!.selectedItems}
              currentItem={appState.cleanupState!.currentItem}
              completedCount={appState.cleanupState!.completedCount}
             isCompleted={!appState.isCleaning}
           />
         );
      
      case 'result':
        return (
          <CleanupResult 
            beforeDiskInfo={appState.cleanupResult!.beforeDiskInfo}
            afterDiskInfo={appState.cleanupResult!.afterDiskInfo}
            cleanupResult={appState.cleanupResult!}
            onReanalyze={handleBackToHome}
          />
        );
      

        
      case 'settings':
        return (
          <SettingsPage 
            onBack={() => setAppState(prev => ({ ...prev, currentPage: 'home' }))}
            onConfigChange={handleConfigChange}
          />
        );
      
      default:
        return <HomePage isAnalyzing={false} onStartAnalysis={handleStartAnalysis} />;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app">
        {renderCurrentPage()}
        
        {/* API密钥输入弹窗 */}
        <Modal
          title="设置DeepSeek API密钥"
          open={showApiKeyModal}
          onOk={handleApiKeySubmit}
          onCancel={() => setShowApiKeyModal(false)}
          okText="确认"
          cancelText="取消"
          destroyOnHidden
        >
          <div style={{ marginBottom: '16px' }}>
            <p>请输入您的DeepSeek API密钥以开始智能分析：</p>
            <Input.Password
              placeholder="请输入API密钥"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onPressEnter={handleApiKeySubmit}
              style={{ marginBottom: '8px' }}
            />
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
              API密钥将仅在本地使用，不会被上传或存储
            </p>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default App;