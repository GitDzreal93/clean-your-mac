// 磁盘信息接口
export interface DiskInfo {
  total: string;
  used: string;
  available: string;
  usagePercentage: number;
}

// 快照详细信息接口
export interface SnapshotDetail {
  name: string;
  size: string;
}

// 系统数据采集结果
export interface SystemData {
  disk_usage: {
    total: string;
    used: string;
    available: string;
  };
  user_folders: Array<{
    path: string;
    size: string;
  }>;
  user_caches: Array<{
    path: string;
    size: string;
  }>;
  system_caches: Array<{
    path: string;
    size: string;
  }>;
  large_files: Array<{
    path: string;
    size: string;
  }>;
  local_snapshots: SnapshotDetail[];
}

// AI分析结果
export interface AIAnalysisResult {
  root_cause_analysis: string;
  cleaning_plan: CleanupItem[];
}

// 风险等级类型
export type RiskLevel = 'low' | 'medium' | 'high';

// 清理项目
export interface CleanupItem {
  id: string;
  checked: boolean;
  title: string;
  description: string;
  estimated_size_gb: number;
  command: string;
  risk_level: RiskLevel;
  involves_file_deletion?: boolean; // 是否涉及删除文件
}

// 分析结果（包含磁盘信息和AI分析）
export interface AnalysisResult {
  diskInfo: DiskInfo;
  aiAnalysis: AIAnalysisResult;
}

// 清理结果
export interface CleanupResult {
  totalFreedGB: number;
  beforeDiskInfo: DiskInfo;
  afterDiskInfo: DiskInfo;
  completedItems: CleanupItem[];
}

// 清理状态
export interface CleanupState {
  selectedItems: CleanupItem[];
  currentItem?: CleanupItem;
  completedCount: number;
  isCompleted: boolean;
  errors: string[];
}

// 应用状态
export interface AppState {
  currentPage: 'home' | 'analysis' | 'cleanup' | 'result' | 'settings';
  isAnalyzing: boolean;
  isCleaning: boolean;
  diskInfo: DiskInfo | null;
  analysisResult: AnalysisResult | null;
  cleanupResult: CleanupResult | null;
  cleanupState: CleanupState | null;
  apiKey: string;
  whitelist: WhitelistItem[];
  config: AppConfig | null;
}

// 白名单项目
export interface WhitelistItem {
  id: string;
  path: string;
  description?: string;
}

// 应用配置接口
export interface AppConfig {
  deepseekApiKey?: string;
  systemPassword?: string;
  whitelist: WhitelistItem[];
  lastUpdated: number;
}

// 配置服务接口
export interface ConfigService {
  loadConfig(): Promise<AppConfig>;
  saveConfig(config: AppConfig): Promise<void>;
  getApiKey(): Promise<string | null>;
  setApiKey(apiKey: string): Promise<void>;
  getWhitelist(): Promise<WhitelistItem[]>;
  setWhitelist(whitelist: WhitelistItem[]): Promise<void>;
}