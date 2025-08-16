import { AppConfig, WhitelistItem, ConfigService } from '../types';

class ConfigServiceImpl implements ConfigService {
  private readonly CONFIG_KEY = 'clean-your-mac-config';
  private config: AppConfig | null = null;

  // 获取默认配置
  private getDefaultConfig(): AppConfig {
    return {
      deepseekApiKey: undefined,
      systemPassword: undefined,
      whitelist: [],
      lastUpdated: Date.now()
    };
  }

  // 加载配置
  async loadConfig(): Promise<AppConfig> {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppConfig;
        this.config = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn('加载配置失败，使用默认配置:', error);
    }
    
    const defaultConfig = this.getDefaultConfig();
    this.config = defaultConfig;
    return defaultConfig;
  }

  // 保存配置
  async saveConfig(config: AppConfig): Promise<void> {
    try {
      config.lastUpdated = Date.now();
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      this.config = config;
    } catch (error) {
      console.error('保存配置失败:', error);
      throw new Error('配置保存失败');
    }
  }

  // 获取API密钥
  async getApiKey(): Promise<string | null> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config?.deepseekApiKey || null;
  }

  // 设置API密钥
  async setApiKey(apiKey: string): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }
    
    const updatedConfig = {
      ...this.config!,
      deepseekApiKey: apiKey
    };
    
    await this.saveConfig(updatedConfig);
  }

  // 获取白名单
  async getWhitelist(): Promise<WhitelistItem[]> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config?.whitelist || [];
  }

  // 设置白名单
  async setWhitelist(whitelist: WhitelistItem[]): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }
    
    const updatedConfig = {
      ...this.config!,
      whitelist
    };
    
    await this.saveConfig(updatedConfig);
  }

  // 清除API密钥
  async clearApiKey(): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }
    
    const updatedConfig = {
      ...this.config!,
      deepseekApiKey: undefined
    };
    
    await this.saveConfig(updatedConfig);
  }

  // 重置配置
  async resetConfig(): Promise<void> {
    const defaultConfig = this.getDefaultConfig();
    await this.saveConfig(defaultConfig);
  }

  // 检查是否有有效的API密钥
  async hasValidApiKey(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!(apiKey && apiKey.trim().length > 0);
  }

  // 获取系统密码
  async getSystemPassword(): Promise<string | null> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config?.systemPassword || null;
  }

  // 设置系统密码
  async setSystemPassword(password: string): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }
    const updatedConfig = {
      ...this.config!,
      systemPassword: password
    };
    await this.saveConfig(updatedConfig);
  }

  // 清除系统密码
  async clearSystemPassword(): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }
    const updatedConfig = {
      ...this.config!,
      systemPassword: undefined
    };
    await this.saveConfig(updatedConfig);
  }

  // 获取当前配置的副本
  async getCurrentConfig(): Promise<AppConfig> {
    if (!this.config) {
      await this.loadConfig();
    }
    return { ...this.config! };
  }
}

// 导出单例实例
export const configService = new ConfigServiceImpl();
export default configService;