import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  List, 
  Modal, 
  message,
  Popconfirm,
  Alert
} from 'antd';
import { 
  KeyOutlined, 
  SafetyOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  LockOutlined
} from '@ant-design/icons';
import { WhitelistItem, AppConfig } from '../types';
import configService from '../services/configService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SettingsPageProps {
  onBack: () => void;
  onConfigChange?: (config: AppConfig) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onConfigChange }) => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [whitelistModalVisible, setWhitelistModalVisible] = useState(false);
  const [editingWhitelistItem, setEditingWhitelistItem] = useState<WhitelistItem | null>(null);
  const [whitelistForm] = Form.useForm();



  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);



  const loadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await configService.loadConfig();
      setConfig(loadedConfig);
      form.setFieldsValue({
        apiKey: loadedConfig.deepseekApiKey || ''
      });
      passwordForm.setFieldsValue({
        systemPassword: loadedConfig.systemPassword || ''
      });
    } catch (error) {
      console.error('加载配置失败:', error);
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存API密钥
  const handleSaveApiKey = async (values: { apiKey: string }) => {
    try {
      setLoading(true);
      await configService.setApiKey(values.apiKey.trim());
      const updatedConfig = await configService.getCurrentConfig();
      setConfig(updatedConfig);
      onConfigChange?.(updatedConfig);
      message.success('API密钥保存成功');
    } catch (error) {
      console.error('保存API密钥失败:', error);
      message.error('保存API密钥失败');
    } finally {
      setLoading(false);
    }
  };

  // 清除API密钥
  const handleClearApiKey = async () => {
    try {
      setLoading(true);
      await configService.clearApiKey();
      const updatedConfig = await configService.getCurrentConfig();
      setConfig(updatedConfig);
      form.setFieldsValue({ apiKey: '' });
      onConfigChange?.(updatedConfig);
      message.success('API密钥已清除');
    } catch (error) {
      console.error('清除API密钥失败:', error);
      message.error('清除API密钥失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存系统密码
  const handleSaveSystemPassword = async (values: { systemPassword: string }) => {
    try {
      setPasswordLoading(true);
      await configService.setSystemPassword(values.systemPassword.trim());
      const updatedConfig = await configService.getCurrentConfig();
      setConfig(updatedConfig);
      onConfigChange?.(updatedConfig);
      message.success('系统密码保存成功');
    } catch (error) {
      console.error('保存系统密码失败:', error);
      message.error('保存系统密码失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 清除系统密码
  const handleClearSystemPassword = async () => {
    try {
      setPasswordLoading(true);
      await configService.clearSystemPassword();
      const updatedConfig = await configService.getCurrentConfig();
      setConfig(updatedConfig);
      passwordForm.setFieldsValue({ systemPassword: '' });
      onConfigChange?.(updatedConfig);
      message.success('系统密码已清除');
    } catch (error) {
      console.error('清除系统密码失败:', error);
      message.error('清除系统密码失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 添加/编辑白名单项
  const handleWhitelistSubmit = async (values: { path: string; description?: string }) => {
    try {
      const currentWhitelist = config?.whitelist || [];
      let updatedWhitelist: WhitelistItem[];

      if (editingWhitelistItem) {
        // 编辑现有项
        updatedWhitelist = currentWhitelist.map(item => 
          item.id === editingWhitelistItem.id 
            ? { ...item, path: values.path.trim(), description: values.description?.trim() }
            : item
        );
      } else {
        // 添加新项
        const newItem: WhitelistItem = {
          id: Date.now().toString(),
          path: values.path.trim(),
          description: values.description?.trim()
        };
        updatedWhitelist = [...currentWhitelist, newItem];
      }

      await configService.setWhitelist(updatedWhitelist);
      const updatedConfig = await configService.getCurrentConfig();
      setConfig(updatedConfig);
      onConfigChange?.(updatedConfig);
      
      setWhitelistModalVisible(false);
      setEditingWhitelistItem(null);
      whitelistForm.resetFields();
      
      message.success(editingWhitelistItem ? '白名单项更新成功' : '白名单项添加成功');
    } catch (error) {
      console.error('保存白名单项失败:', error);
      message.error('保存白名单项失败');
    }
  };

  // 删除白名单项
  const handleDeleteWhitelistItem = async (itemId: string) => {
    try {
      const currentWhitelist = config?.whitelist || [];
      const updatedWhitelist = currentWhitelist.filter(item => item.id !== itemId);
      
      await configService.setWhitelist(updatedWhitelist);
      const updatedConfig = await configService.getCurrentConfig();
      setConfig(updatedConfig);
      onConfigChange?.(updatedConfig);
      
      message.success('白名单项删除成功');
    } catch (error) {
      console.error('删除白名单项失败:', error);
      message.error('删除白名单项失败');
    }
  };

  // 打开白名单编辑模态框
  const openWhitelistModal = (item?: WhitelistItem) => {
    setEditingWhitelistItem(item || null);
    if (item) {
      whitelistForm.setFieldsValue({
        path: item.path,
        description: item.description
      });
    } else {
      whitelistForm.resetFields();
    }
    setWhitelistModalVisible(true);
  };



  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5', 
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <Card 
          bordered={false}
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={onBack}
              type="text"
            >
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              应用设置
            </Title>
          </Space>
        </Card>

        {/* API密钥设置 */}
        <Card 
          title={
            <Space>
              <KeyOutlined style={{ color: '#1890ff' }} />
              <span>DeepSeek API 密钥</span>
            </Space>
          }
          bordered={false}
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Alert
            message="API密钥将安全地存储在本地，用于智能分析功能"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveApiKey}
          >
            <Form.Item
              name="apiKey"
              label="API密钥"
              rules={[
                { required: true, message: '请输入API密钥' },
                { min: 10, message: 'API密钥长度至少10位' }
              ]}
            >
              <Input.Password
                placeholder="请输入您的DeepSeek API密钥"
                size="large"
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                >
                  保存密钥
                </Button>
                <Popconfirm
                  title="确定要清除API密钥吗？"
                  description="清除后需要重新输入密钥才能使用智能分析功能"
                  onConfirm={handleClearApiKey}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    danger 
                    loading={loading}
                    size="large"
                  >
                    清除密钥
                  </Button>
                </Popconfirm>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 系统密码设置 */}
        <Card 
          title={
            <Space>
              <LockOutlined style={{ color: '#fa8c16' }} />
              <span>系统密码</span>
            </Space>
          }
          bordered={false}
          style={{ 
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Alert
            message="系统密码用于执行需要管理员权限的清理操作，密码将安全地存储在本地"
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleSaveSystemPassword}
          >
            <Form.Item
              name="systemPassword"
              label="系统密码"
              rules={[
                { required: true, message: '请输入系统密码' },
                { min: 1, message: '密码不能为空' }
              ]}
            >
              <Input.Password
                placeholder="请输入您的Mac系统密码"
                size="large"
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={passwordLoading}
                  size="large"
                >
                  保存密码
                </Button>
                <Popconfirm
                  title="确定要清除系统密码吗？"
                  description="清除后执行某些清理操作时可能需要重新输入密码"
                  onConfirm={handleClearSystemPassword}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    danger 
                    loading={passwordLoading}
                    size="large"
                  >
                    清除密码
                  </Button>
                </Popconfirm>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 安全白名单设置 */}
        <Card 
          title={
            <Space>
              <SafetyOutlined style={{ color: '#52c41a' }} />
              <span>安全白名单</span>
            </Space>
          }
          bordered={false}
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => openWhitelistModal()}
            >
              添加路径
            </Button>
          }
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Alert
            message="白名单中的路径将不会被清理，确保重要文件的安全。"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <List
            dataSource={config?.whitelist || []}
            locale={{ emptyText: '暂无白名单项，点击上方按钮添加' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="edit"
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={() => openWhitelistModal(item)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个白名单项吗？"
                    onConfirm={() => handleDeleteWhitelistItem(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={<Text code>{item.path}</Text>}
                  description={item.description || '无描述'}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 白名单编辑模态框 */}
      <Modal
        title={editingWhitelistItem ? '编辑白名单项' : '添加白名单项'}
        open={whitelistModalVisible}
        onCancel={() => {
          setWhitelistModalVisible(false);
          setEditingWhitelistItem(null);
          whitelistForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={whitelistForm}
          layout="vertical"
          onFinish={handleWhitelistSubmit}
        >
          <Form.Item
            name="path"
            label="文件/目录路径"
            rules={[
              { required: true, message: '请输入路径' },
              { min: 1, message: '路径不能为空' }
            ]}
          >
            <Input
              placeholder="例如: /Users/username/Documents/重要文件"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述（可选）"
          >
            <TextArea
              placeholder="简单描述这个路径的用途"
              rows={3}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setWhitelistModalVisible(false);
                  setEditingWhitelistItem(null);
                  whitelistForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingWhitelistItem ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;