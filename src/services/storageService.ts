import { DiskInfo, SystemData } from '../types';
import { 
  getDiskUsage, 
  getLargeFiles, 
  getCacheSize, 
  getDownloadsSize, 
  getTrashSize,
  getLocalSnapshots,
  getSnapshotDetails,
  parseDiskUsage
} from '../utils/commands';
import { workerService } from './workerService';

export class StorageService {
  // 收集系统磁盘信息
  async collectDiskInfo(): Promise<DiskInfo> {
    console.log('💾 [存储服务] 开始收集磁盘信息');
    try {
      const dfOutput = await getDiskUsage();
      console.log('📊 [存储服务] df命令原始输出:', dfOutput);
      
      const diskInfo = parseDiskUsage(dfOutput);
      console.log('✅ [存储服务] 解析后的磁盘信息:', JSON.stringify(diskInfo, null, 2));
      
      return diskInfo;
    } catch (error) {
      console.error('❌ [存储服务] 收集磁盘信息失败:', error);
      throw new Error('无法获取磁盘信息');
    }
  }

  // 收集详细的存储分析数据（原始方法，可能阻塞主线程）
  async collectDetailedAnalysis(): Promise<{
    diskInfo: DiskInfo;
    largeFiles: string;
    cacheSize: string;
    downloadsSize: string;
    trashSize: string;
  }> {
    console.log('🔍 [存储服务] 开始收集详细分析数据...');
    try {
      console.log('📊 [存储服务] 并行收集磁盘信息、大文件、缓存等数据...');
      const [diskInfo, largeFiles, cacheSize, downloadsSize, trashSize] = await Promise.all([
        this.collectDiskInfo(),
        this.getLargeFilesWithLogging(),
        this.getCacheSizeWithLogging(),
        this.getDownloadsSizeWithLogging(),
        this.getTrashSizeWithLogging()
      ]);
      
      const detailedAnalysis = {
        diskInfo,
        largeFiles,
        cacheSize,
        downloadsSize,
        trashSize
      };
      
      console.log('✅ [存储服务] 详细分析数据收集完成:', {
        diskInfo: diskInfo,
        largeFilesLength: largeFiles.length,
        cacheSize: cacheSize,
        downloadsSize: downloadsSize,
        trashSize: trashSize
      });

      return detailedAnalysis;
    } catch (error) {
      console.error('❌ [存储服务] 收集详细分析数据失败:', error);
      throw new Error('无法收集存储分析数据');
    }
  }

  // 获取大文件信息（带日志）
  private async getLargeFilesWithLogging(): Promise<string> {
    console.log('📁 [存储服务] 开始查找大文件');
    try {
      const largeFiles = await getLargeFiles();
      console.log('✅ [存储服务] 大文件查找完成，输出长度:', largeFiles.length);
      return largeFiles;
    } catch (error) {
      console.error('❌ [存储服务] 查找大文件失败:', error);
      return '';
    }
  }

  // 获取缓存大小（带日志）
  private async getCacheSizeWithLogging(): Promise<string> {
    console.log('🗂️ [存储服务] 开始计算缓存大小');
    try {
      const cacheSize = await getCacheSize();
      console.log('✅ [存储服务] 缓存大小计算完成:', cacheSize);
      return cacheSize;
    } catch (error) {
      console.error('❌ [存储服务] 计算缓存大小失败:', error);
      return '无法获取缓存大小';
    }
  }

  // 获取下载目录大小（带日志）
  private async getDownloadsSizeWithLogging(): Promise<string> {
    console.log('📥 [存储服务] 开始计算下载目录大小');
    try {
      const downloadsSize = await getDownloadsSize();
      console.log('✅ [存储服务] 下载目录大小计算完成:', downloadsSize);
      return downloadsSize;
    } catch (error) {
      console.error('❌ [存储服务] 计算下载目录大小失败:', error);
      return '无法获取下载目录大小';
    }
  }

  // 获取垃圾箱大小（带日志）
  private async getTrashSizeWithLogging(): Promise<string> {
    console.log('🗑️ [存储服务] 开始计算垃圾箱大小');
    try {
      const trashSize = await getTrashSize();
      console.log('✅ [存储服务] 垃圾箱大小计算完成:', trashSize);
      return trashSize;
    } catch (error) {
      console.error('❌ [存储服务] 计算垃圾箱大小失败:', error);
      return '无法获取垃圾箱大小';
    }
  }

  // 收集完整的系统数据（包含快照信息）
  async collectSystemData(): Promise<SystemData> {
    console.log('🔄 [存储服务] 开始收集完整系统数据...');
    try {
      console.log('📊 [存储服务] 并行收集磁盘信息和快照详情...');
      const [diskInfo, snapshotDetails] = await Promise.all([
        this.collectDiskInfo(),
        this.getSnapshotDetailsWithLogging()
      ]);
      
      console.log('🏗️ [存储服务] 构建SystemData格式...');
      // 构建SystemData格式
      const systemData: SystemData = {
        disk_usage: {
          total: diskInfo.total,
          used: diskInfo.used,
          available: diskInfo.available
        },
        user_folders: [], // 暂时为空，可以后续扩展
        user_caches: [], // 暂时为空，可以后续扩展
        system_caches: [], // 暂时为空，可以后续扩展
        large_files: [], // 暂时为空，可以后续扩展
        local_snapshots: snapshotDetails
      };
      
      console.log('✅ [存储服务] 完整系统数据收集完成，快照数量:', snapshotDetails.length);
      console.log('📋 [存储服务] 系统数据概览:', {
        diskUsage: diskInfo,
        snapshotCount: snapshotDetails.length
      });
      return systemData;
    } catch (error) {
      console.error('❌ [存储服务] 收集完整系统数据失败:', error);
      throw new Error('无法收集系统数据');
    }
  }

  // 获取快照详情（带日志）
  private async getSnapshotDetailsWithLogging(): Promise<import('../types').SnapshotDetail[]> {
    console.log('📸 [存储服务] 开始获取快照详情');
    try {
      const snapshotDetails = await getSnapshotDetails();
      console.log('✅ [存储服务] 快照详情获取完成，数量:', snapshotDetails.length);
      if (snapshotDetails.length > 0) {
        console.log('📋 [存储服务] 快照列表:', snapshotDetails.map(s => `${s.name}: ${s.size}`).slice(0, 3));
      }
      return snapshotDetails;
    } catch (error) {
      console.error('❌ [存储服务] 获取快照详情失败:', error);
      return [];
    }
  }

  // 使用Web Worker收集详细的存储分析数据（非阻塞主线程）
  async collectDetailedAnalysisAsync(
    onProgress?: (progress: number) => void
  ): Promise<{
    diskInfo: DiskInfo;
    largeFiles: string;
    cacheSize: string;
    downloadsSize: string;
    trashSize: string;
    snapshotDetails: import('../types').SnapshotDetail[];
  }> {
    console.log('⚡ [存储服务] 开始异步收集详细分析数据...');
    try {
      console.log('🔄 [存储服务] 使用Web Worker进行非阻塞数据收集...');
      const result = await workerService.collectDetailedAnalysis(onProgress);
      console.log('✅ [存储服务] 异步数据收集完成');
      console.log('📊 [存储服务] 异步收集结果概览:', {
        diskInfo: result.diskInfo,
        largeFilesLength: result.largeFiles.length,
        cacheSize: result.cacheSize,
        downloadsSize: result.downloadsSize,
        trashSize: result.trashSize,
        snapshotCount: result.snapshotDetails.length
      });
      return result;
    } catch (error) {
      console.error('❌ [存储服务] 异步收集详细分析数据失败:', error);
      throw new Error('无法收集存储分析数据');
    }
  }

  // 格式化存储数据为AI分析用的文本（支持快照信息）
  formatDataForAI(data: {
    diskInfo: DiskInfo;
    largeFiles: string;
    cacheSize: string;
    downloadsSize: string;
    trashSize: string;
    snapshotDetails?: import('../types').SnapshotDetail[];
  }): string {
    const { diskInfo, largeFiles, cacheSize, downloadsSize, trashSize, snapshotDetails } = data;
    
    let snapshotInfo = '';
    if (snapshotDetails && snapshotDetails.length > 0) {
      snapshotInfo = `

本地时间机器快照信息：
快照总数: ${snapshotDetails.length}
快照详情：
${snapshotDetails.map(snapshot => `- ${snapshot.name}: ${snapshot.size}`).join('\n')}`;
    } else {
      snapshotInfo = '\n\n本地时间机器快照信息：\n无本地快照';
    }
    
    return `
系统磁盘信息：
- 总容量: ${diskInfo.total}
- 已使用: ${diskInfo.used}
- 可用空间: ${diskInfo.available}
- 使用率: ${diskInfo.usagePercentage}%

大文件列表（>100MB）：
${largeFiles}

缓存目录大小：
${cacheSize}

下载目录大小：
${downloadsSize}

垃圾箱大小：
${trashSize}${snapshotInfo}
`;
  }

  // 格式化SystemData为AI分析用的JSON字符串
  formatSystemDataForAI(systemData: SystemData): string {
    return JSON.stringify(systemData, null, 2);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const storageService = new StorageService();