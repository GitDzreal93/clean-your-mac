import React, { useState, useEffect } from 'react';
import { Card, List, Button, Input, Modal, message, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, FolderOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { WhitelistItem } from '../types';

const { Title, Text } = Typography;

interface WhitelistManagerProps {
  whitelist: WhitelistItem[];
  onWhitelistChange: (whitelist: WhitelistItem[]) => void;
  onBack?: () => void;
}

export const WhitelistManager: React.FC<WhitelistManagerProps> = ({
  whitelist,
  onWhitelistChange,
  onBack
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAddPath = () => {
    if (!newPath.trim()) {
      message.error('请输入路径');
      return;
    }

    const newItem: WhitelistItem = {
      id: Date.now().toString(),
      path: newPath.trim(),
      description: newDescription.trim() || '用户添加的保护路径'
    };

    const updatedWhitelist = [...whitelist, newItem];
    onWhitelistChange(updatedWhitelist);
    
    setNewPath('');
    setNewDescription('');
    setIsModalVisible(false);
    message.success('路径已添加到白名单');
  };

  const handleRemovePath = (id: string) => {
    const updatedWhitelist = whitelist.filter(item => item.id !== id);
    onWhitelistChange(updatedWhitelist);
    message.success('路径已从白名单移除');
  };

  const defaultWhitelistItems = [
    { id: 'default-1', path: '/System', description: '系统核心文件' },
    { id: 'default-2', path: '/usr/bin', description: '系统可执行文件' },
    { id: 'default-3', path: '/usr/sbin', description: '系统管理工具' },
    { id: 'default-4', path: '/Applications', description: '应用程序目录' },
    { id: 'default-5', path: '/Library', description: '系统库文件' },
    { id: 'default-6', path: '/Users/*/Documents', description: '用户文档目录' },
    { id: 'default-7', path: '/Users/*/Desktop', description: '用户桌面目录' },
    { id: 'default-8', path: '/Users/*/Pictures', description: '用户图片目录' },
  ];

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      {onBack && (
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: 16 }}
        >
          返回主页
        </Button>
      )}
      
      <Card 
        title={
          <Space>
            <FolderOutlined />
            <span>安全白名单管理</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            添加路径
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          白名单中的路径将受到保护，不会被清理操作影响。系统默认保护重要目录。
        </Text>
      </div>

      <Title level={5}>默认保护路径</Title>
      <List
        size="small"
        dataSource={defaultWhitelistItems}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<FolderOutlined style={{ color: '#52c41a' }} />}
              title={<Text code>{item.path}</Text>}
              description={item.description}
            />
          </List.Item>
        )}
        style={{ marginBottom: 24 }}
      />

      <Title level={5}>用户自定义保护路径</Title>
      {whitelist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
          暂无自定义保护路径
        </div>
      ) : (
        <List
          size="small"
          dataSource={whitelist}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="确定要移除这个路径吗？"
                  onConfirm={() => handleRemovePath(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    移除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={<FolderOutlined style={{ color: '#1890ff' }} />}
                title={<Text code>{item.path}</Text>}
                description={item.description}
              />
            </List.Item>
          )}
        />
      )}

      </Card>
      
      <Modal
        title="添加保护路径"
        open={isModalVisible}
        onOk={handleAddPath}
        onCancel={() => {
          setIsModalVisible(false);
          setNewPath('');
          setNewDescription('');
        }}
        okText="添加"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>路径 *</label>
            <Input
              placeholder="请输入要保护的路径，如：/Users/username/important"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label>描述</label>
            <Input
              placeholder="请输入路径描述（可选）"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default WhitelistManager;