import { invoke } from '@tauri-apps/api/core';
import { DiskInfo } from '../types';

// 获取磁盘使用信息
export async function getDiskUsage(): Promise<string> {
  console.log('💾 [命令工具] 开始获取磁盘使用信息');
  try {
    const command = 'df -h /';
    console.log('🔧 [命令工具] 执行命令:', command);
    
    const startTime = Date.now();
    const result = await invoke('execute_command', {
      command
    });
    const duration = Date.now() - startTime;
    
    console.log('✅ [命令工具] 磁盘信息获取成功，耗时:', duration + 'ms');
    console.log('📊 [命令工具] 磁盘信息结果:', result);
    return result as string;
  } catch (error) {
    console.error('❌ [命令工具] 获取磁盘信息失败:', error);
    throw error;
  }
}

// 获取大文件列表
export async function getLargeFiles(): Promise<string> {
  console.log('📁 [命令工具] 开始查找大文件');
  try {
    const command = 'find /Users -type f -size +100M 2>/dev/null | head -20';
    console.log('🔧 [命令工具] 执行命令:', command);
    
    const startTime = Date.now();
    const result = await invoke('execute_command', {
      command
    });
    const duration = Date.now() - startTime;
    
    console.log('✅ [命令工具] 大文件查找完成，耗时:', duration + 'ms');
    console.log('📊 [命令工具] 找到的大文件数量:', (result as string).split('\n').filter(line => line.trim()).length);
    return result as string;
  } catch (error) {
    console.error('❌ [命令工具] 获取大文件列表失败:', error);
    throw error;
  }
}

// 获取缓存目录大小
export async function getCacheSize(): Promise<string> {
  try {
    const result = await invoke('execute_command', {
      command: 'du -sh ~/Library/Caches 2>/dev/null || echo "0B"'
    });
    return result as string;
  } catch (error) {
    console.error('获取缓存大小失败:', error);
    throw error;
  }
}

// 获取下载目录大小
export async function getDownloadsSize(): Promise<string> {
  try {
    const result = await invoke('execute_command', {
      command: 'du -sh ~/Downloads 2>/dev/null || echo "0B"'
    });
    return result as string;
  } catch (error) {
    console.error('获取下载目录大小失败:', error);
    throw error;
  }
}

// 获取垃圾箱大小
export async function getTrashSize(): Promise<string> {
  try {
    const result = await invoke('execute_command', {
      command: 'du -sh ~/.Trash 2>/dev/null || echo "0B"'
    });
    return result as string;
  } catch (error) {
    console.error('获取垃圾箱大小失败:', error);
    throw error;
  }
}

// 获取本地时间机器快照列表
export async function getLocalSnapshots(): Promise<string[]> {
  try {
    const result = await invoke('execute_command', {
      command: 'tmutil listlocalsnapshots / 2>/dev/null || echo ""'
    });
    const output = result as string;
    if (!output || output.trim() === '') {
      return [];
    }
    // 解析快照列表，每行一个快照
    return output.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('Snapshots for'));
  } catch (error) {
    console.error('获取本地快照列表失败:', error);
    return [];
  }
}

// 获取快照详细信息（包含大小）
export async function getSnapshotDetails(): Promise<Array<{name: string, size: string}>> {
  try {
    const snapshots = await getLocalSnapshots();
    if (snapshots.length === 0) {
      return [];
    }

    const snapshotDetails = await Promise.all(
      snapshots.map(async (snapshot) => {
        try {
          // 检查快照类型
          if (snapshot.includes('com.apple.os.update')) {
            // 系统更新快照，尝试使用 du 命令估算大小
            const sizeResult = await invoke('execute_command', {
              command: `du -sh "/.com.apple.TimeMachine.supported/${snapshot}" 2>/dev/null | awk '{print $1}' || echo "系统快照"`
            });
            const size = (sizeResult as string).trim() || '系统快照';
            return { name: snapshot, size: size === '' ? '系统快照' : size };
          } else {
            // 普通快照，尝试使用 tmutil uniquesize
            const sizeResult = await invoke('execute_command', {
              command: `tmutil uniquesize "/.com.apple.TimeMachine.supported/${snapshot}" 2>/dev/null | tail -1 || echo "未知"`
            });
            const size = (sizeResult as string).trim() || '未知';
            return { name: snapshot, size };
          }
        } catch (error) {
          console.error(`获取快照 ${snapshot} 大小失败:`, error);
          // 根据快照类型返回不同的默认值
          const defaultSize = snapshot.includes('com.apple.os.update') ? '系统快照' : '未知';
          return { name: snapshot, size: defaultSize };
        }
      })
    );

    return snapshotDetails;
  } catch (error) {
    console.error('获取快照详细信息失败:', error);
    return [];
  }
}

// 执行清理命令
export async function executeCleanupCommand(command: string): Promise<string> {
  console.log('🧹 [命令工具] 开始执行清理命令');
  console.log('🔧 [命令工具] 清理命令:', command);
  
  try {
    const startTime = Date.now();
    const result = await invoke('execute_command', {
      command
    });
    const duration = Date.now() - startTime;
    
    console.log('✅ [命令工具] 清理命令执行成功，耗时:', duration + 'ms');
    console.log('📊 [命令工具] 清理命令输出:', result);
    return result as string;
  } catch (error) {
    console.error('❌ [命令工具] 执行清理命令失败:', error);
    console.error('❌ [命令工具] 失败的命令:', command);
    throw error;
  }
}

// 格式化字节大小
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 收集磁盘信息
export async function collectDiskInfo(): Promise<DiskInfo> {
  try {
    const dfOutput = await getDiskUsage();
    return parseDiskUsage(dfOutput);
  } catch (error) {
    console.error('收集磁盘信息失败:', error);
    throw new Error('无法获取磁盘信息');
  }
}

// 解析df命令输出获取磁盘信息
export function parseDiskUsage(dfOutput: string): DiskInfo {
  if (!dfOutput || typeof dfOutput !== 'string') {
    throw new Error('df输出为空或格式错误');
  }
  
  const lines = dfOutput.trim().split('\n');
  if (lines.length < 2) throw new Error('无效的df输出');
  
  // 解析df输出的第二行（第一行是标题）
  const dataLine = lines[1];
  if (!dataLine) {
    throw new Error('df输出数据行为空');
  }
  
  const parts = dataLine.split(/\s+/);
  
  if (parts.length < 6) {
    throw new Error('磁盘使用情况数据格式错误');
  }
  
  // df -h 输出格式: Filesystem Size Used Avail Use% Mounted
  const total = parts[1] || '0B';
  const used = parts[2] || '0B';
  const available = parts[3] || '0B';
  const usagePercentStr = parts[4] || '0%';
  
  // 解析使用百分比
  const usagePercentage = parseInt(usagePercentStr.replace('%', '')) || 0;
  
  return {
    total,
    used,
    available,
    usagePercentage
  };
}

// 获取应用程序大小
export async function getApplicationsSize(): Promise<string> {
  try {
    const result = await invoke('execute_command', {
      command: 'du -sh /Applications 2>/dev/null | head -10'
    });
    return result as string;
  } catch (error) {
    console.error('获取应用程序大小失败:', error);
    throw error;
  }
}

// 获取日志文件大小
export async function getLogSize(): Promise<string> {
  try {
    const commands = [
      'du -sh ~/Library/Logs 2>/dev/null || echo "0B"',
      'du -sh /var/log 2>/dev/null || echo "0B"'
    ];
    
    const results = await Promise.all(
      commands.map(async cmd => {
        try {
          return await invoke('execute_command', { command: cmd }) as string;
        } catch {
          return '0B';
        }
      })
    );
    
    return results.join('\n');
  } catch (error) {
    console.error('获取日志大小失败:', error);
    throw error;
  }
}

// 获取临时文件大小
export async function getTempSize(): Promise<string> {
  try {
    const commands = [
      'du -sh /tmp 2>/dev/null || echo "0B"',
      'du -sh /var/tmp 2>/dev/null || echo "0B"'
    ];
    
    const results = await Promise.all(
      commands.map(async cmd => {
        try {
          return await invoke('execute_command', { command: cmd }) as string;
        } catch {
          return '0B';
        }
      })
    );
    
    return results.join('\n');
  } catch (error) {
    console.error('获取临时文件大小失败:', error);
    throw error;
  }
}

// 解析大小字符串为字节数
export function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/([0-9.]+)\s*([KMGT]?B?)/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const multipliers: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };
  
  return value * (multipliers[unit] || 1);
}

// 获取系统信息
export async function getSystemInfo(): Promise<string> {
  try {
    const commands = [
      'system_profiler SPSoftwareDataType | grep "System Version"',
      'sysctl -n hw.memsize',
      'sysctl -n machdep.cpu.brand_string'
    ];
    
    const results = await Promise.all(
      commands.map(async cmd => {
        try {
          return await invoke('execute_command', { command: cmd }) as string;
        } catch {
          return 'Unknown';
        }
      })
    );
    
    return `系统版本: ${results[0]}\n内存: ${formatBytes(parseInt(results[1]) || 0)}\nCPU: ${results[2]}`;
  } catch (error) {
    console.error('获取系统信息失败:', error);
    throw error;
  }
}