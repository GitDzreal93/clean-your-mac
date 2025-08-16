import { CleanupItem, CleanupResult, WhitelistItem } from '../types';
import { executeCleanupCommand } from '../utils/commands';
import { storageService } from './storageService';

export class CleanupService {
  private whitelist: WhitelistItem[] = [];

  // 设置白名单
  setWhitelist(whitelist: WhitelistItem[]) {
    this.whitelist = whitelist;
  }

  // 获取白名单
  getWhitelist(): WhitelistItem[] {
    return this.whitelist;
  }

  // 添加白名单项
  addToWhitelist(item: WhitelistItem) {
    this.whitelist.push(item);
  }

  // 从白名单移除项
  removeFromWhitelist(path: string) {
    this.whitelist = this.whitelist.filter(item => item.path !== path);
  }

  // 检查路径是否在白名单中
  isInWhitelist(path: string): boolean {
    return this.whitelist.some(item => {
      // 简单的路径匹配，如果路径以白名单项开头则认为匹配
      return path.startsWith(item.path);
    });
  }

  // 执行单个清理项目
  async executeCleanupItem(item: CleanupItem): Promise<void> {
    // 验证命令安全性
    const validation = this.validateCommand(item.command);
    if (!validation.isValid) {
      throw new Error(`不安全的命令: ${validation.reason}`);
    }

    try {
      console.log(`执行清理命令: ${item.command}`);
      await executeCleanupCommand(item.command);
      console.log(`清理完成: ${item.description}`);
    } catch (error) {
      console.error(`清理失败: ${item.description}`, error);
      throw new Error(`清理失败: ${item.description}`);
    }
  }

  // 验证清理命令的安全性
  validateCommand(command: string): { isValid: boolean; reason?: string } {
    // 安全命令白名单 - 这些命令被认为是安全的
    const safePatterns = [
      /^tmutil\s+thinlocalsnapshots\s+\/\s+\d+\s+\d+$/,  // tmutil 时间机器快照清理
      /^rm\s+-rf\s+\/Users\/[^/]+\/Library\/Caches\//,  // 用户缓存清理
      /^rm\s+-rf\s+\/private\/var\/folders\//,  // 临时文件清理
      /^rm\s+-rf\s+\/Users\/[^/]+\/Downloads\//,  // 下载文件清理
      /^rm\s+-rf\s+\/Users\/[^/]+\/.Trash\//,  // 废纸篓清理
    ];

    // 首先检查是否是安全命令
    for (const pattern of safePatterns) {
      if (pattern.test(command)) {
        return { isValid: true };
      }
    }

    // 危险命令黑名单
    const dangerousPatterns = [
      /rm\s+-rf\s+\/$/,  // 删除根目录
      /rm\s+-rf\s+\/System/,  // 删除系统目录
      /rm\s+-rf\s+\/usr/,    // 删除usr目录
      /rm\s+-rf\s+\/bin/,    // 删除bin目录
      /rm\s+-rf\s+\/sbin/,   // 删除sbin目录
      /rm\s+-rf\s+\/etc/,    // 删除etc目录
      /rm\s+-rf\s+\/var/,    // 删除var目录
      /sudo/,                // 包含sudo的命令
      /chmod\s+777/,         // 危险的权限修改
      /chown\s+root/,        // 危险的所有者修改
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          isValid: false,
          reason: '命令包含危险操作，已被安全机制阻止'
        };
      }
    }

    // 检查是否涉及白名单路径
    for (const item of this.whitelist) {
      if (command.includes(item.path)) {
        return {
          isValid: false,
          reason: `路径 ${item.path} 在白名单中，跳过清理`
        };
      }
    }

    return { isValid: true };
  }

  // 检查文件/目录权限
  private async checkFilePermissions(path: string): Promise<{ hasAccess: boolean; error?: string }> {
    try {
      // 使用 test 命令检查文件是否存在和可访问
      try {
        await executeCleanupCommand(`test -e "${path}"`);
      } catch {
        return { hasAccess: false, error: '文件或目录不存在' };
      }

      // 检查读权限
      try {
        await executeCleanupCommand(`test -r "${path}"`);
      } catch {
        return { hasAccess: false, error: '没有读权限' };
      }

      // 检查写权限（对于删除操作很重要）
      try {
        await executeCleanupCommand(`test -w "${path}"`);
      } catch {
        return { hasAccess: false, error: '没有写权限' };
      }

      return { hasAccess: true };
    } catch (error) {
      return { hasAccess: false, error: `权限检查失败: ${error}` };
    }
  }

  // 根据命令内容推断清理类型
  private inferCleanupType(command: string): string {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('cache')) return 'cache';
    if (lowerCommand.includes('download')) return 'downloads';
    if (lowerCommand.includes('trash')) return 'trash';
    if (lowerCommand.includes('log')) return 'logs';
    if (lowerCommand.includes('tmp') || lowerCommand.includes('temp')) return 'temp';
    return 'unknown';
  }

  // 检查清理项目的权限
  private async checkCleanupItemPermissions(item: CleanupItem): Promise<{ canProceed: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    let canProceed = true;

    try {
      // 根据清理项目命令推断类型并提取目标路径
      const cleanupType = this.inferCleanupType(item.command);
      let targetPaths: string[] = [];
      
      if (cleanupType === 'cache') {
        targetPaths = ['~/Library/Caches', '~/Library/Application Support'];
      } else if (cleanupType === 'downloads') {
        targetPaths = ['~/Downloads'];
      } else if (cleanupType === 'trash') {
        targetPaths = ['~/.Trash'];
      } else if (cleanupType === 'logs') {
        targetPaths = ['~/Library/Logs', '/var/log'];
      } else if (cleanupType === 'temp') {
        targetPaths = ['/tmp', '~/Library/Caches/TemporaryItems'];
      }

      // 检查每个路径的权限
      for (const path of targetPaths) {
        const homeDir = typeof window !== 'undefined' ? '' : ((globalThis as any).process?.env?.HOME || '/Users/' + ((globalThis as any).process?.env?.USER || 'user'));
        const expandedPath = path.replace('~', homeDir);
        const permissionResult = await this.checkFilePermissions(expandedPath);
        
        if (!permissionResult.hasAccess) {
          warnings.push(`${path}: ${permissionResult.error}`);
          // 对于关键路径，如果没有权限则不能继续
          if (path.includes('System') || path.includes('/var/') || path.includes('/usr/')) {
            canProceed = false;
          }
        }
      }

      // 特殊检查：系统保护的目录
      const protectedPaths = [
        '/System',
        '/usr/bin',
        '/usr/sbin',
        '/Library/Apple',
        '/Library/System'
      ];

      for (const protectedPath of protectedPaths) {
        if (item.command && item.command.includes(protectedPath)) {
          warnings.push(`警告: 命令涉及系统保护目录 ${protectedPath}，可能需要管理员权限`);
          canProceed = false;
        }
      }

    } catch (error) {
      warnings.push(`权限检查过程中发生错误: ${error}`);
      canProceed = false;
    }

    return { canProceed, warnings };
  }

  // 非阻塞执行清理操作
  async executeCleanupAsync(
    selectedItems: CleanupItem[],
    onProgress?: (progress: { currentItem: CleanupItem; completedCount: number; totalCount: number }) => void,
    onItemComplete?: (item: CleanupItem, success: boolean, error?: string) => void
  ): Promise<CleanupResult> {
    // 获取清理前的磁盘信息
    const beforeDisk = await storageService.collectDiskInfo();
    
    const cleanedItems: CleanupItem[] = [];
    const errors: string[] = [];
    const checkedItems = selectedItems.filter(item => item.checked);
    const totalCount = checkedItems.length;

    for (let i = 0; i < checkedItems.length; i++) {
      const item = checkedItems[i];
      
      // 报告进度
      onProgress?.({
        currentItem: item,
        completedCount: i,
        totalCount
      });

      // 验证命令安全性
      const validation = this.validateCommand(item.command);
      if (!validation.isValid) {
        console.warn(`跳过不安全的命令: ${item.command}, 原因: ${validation.reason}`);
        const errorMsg = `${item.description}: ${validation.reason}`;
        errors.push(errorMsg);
        onItemComplete?.(item, false, errorMsg);
        continue;
      }

      // 检查文件权限
      const permissionCheck = await this.checkCleanupItemPermissions(item);
      if (!permissionCheck.canProceed) {
        console.warn(`跳过权限不足的清理项: ${item.command}`);
        const errorMsg = `${item.description}: 权限不足 - ${permissionCheck.warnings.join(', ')}`;
        errors.push(errorMsg);
        onItemComplete?.(item, false, errorMsg);
        continue;
      }
      
      // 如果有权限警告，记录但继续执行
      if (permissionCheck.warnings.length > 0) {
        console.warn(`权限警告: ${item.description}`, permissionCheck.warnings);
      }

      try {
        console.log(`执行清理命令: ${item.command}`);
        await executeCleanupCommand(item.command);
        cleanedItems.push(item);
        console.log(`清理完成: ${item.description}`);
        onItemComplete?.(item, true);
        
        // 添加小延迟以避免阻塞UI
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`清理失败: ${item.description}`, error);
        const errorMsg = `${item.description}: 执行失败`;
        errors.push(errorMsg);
        onItemComplete?.(item, false, errorMsg);
      }
    }

    // 报告最终进度
    onProgress?.({
      currentItem: checkedItems[checkedItems.length - 1],
      completedCount: checkedItems.length,
      totalCount
    });

    // 等待一秒后获取清理后的磁盘信息
    console.log('💾 [清理服务] 等待1秒后获取清理后磁盘信息...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterDisk = await storageService.collectDiskInfo();
    console.log('💾 [清理服务] 清理后磁盘信息:', JSON.stringify(afterDisk, null, 2));

    // 计算释放的空间（正确处理单位转换）
    console.log('📊 [清理服务] 清理后磁盘信息:', JSON.stringify(afterDisk, null, 2));
    
    const beforeUsedBytes = this.parseStorageSize(beforeDisk.used);
    const afterUsedBytes = this.parseStorageSize(afterDisk.used);
    const totalCleanedBytes = Math.max(0, beforeUsedBytes - afterUsedBytes);
    const totalCleanedGB = totalCleanedBytes / (1024 ** 3);
    
    console.log('🧮 [清理服务] 空间计算详情:', {
      beforeUsed: beforeDisk.used,
      afterUsed: afterDisk.used,
      beforeUsedBytes,
      afterUsedBytes,
      totalCleanedBytes,
      totalCleanedGB: totalCleanedGB.toFixed(3)
    });
    console.log(`📊 [清理服务] 空间释放计算: ${beforeDisk.used} - ${afterDisk.used} = ${totalCleanedGB.toFixed(3)}GB`);

    if (errors.length > 0) {
      console.warn('⚠️ [清理服务] 清理过程中出现错误:', errors);
    }

    const result = {
      beforeDiskInfo: beforeDisk,
      afterDiskInfo: afterDisk,
      completedItems: cleanedItems,
      totalFreedGB: totalCleanedGB
    };
    
    console.log('🏁 [清理服务] executeCleanupAsync任务完成，最终结果:', JSON.stringify(result, null, 2));
    return result;
  }

  // 执行清理操作（保持向后兼容）
  async executeCleanup(selectedItems: CleanupItem[]): Promise<CleanupResult> {
    console.log('🧹 [清理服务] 开始执行清理任务');
    console.log('📋 [清理服务] 清理项目列表:', JSON.stringify(selectedItems.map(item => ({
      id: item.id,
      description: item.description,
      checked: item.checked,
      command: item.command,
      estimated_size_gb: item.estimated_size_gb
    })), null, 2));
    
    // 获取清理前的磁盘信息
    const beforeDisk = await storageService.collectDiskInfo();
    console.log('💾 [清理服务] 清理前磁盘信息:', JSON.stringify(beforeDisk, null, 2));
    
    const cleanedItems: CleanupItem[] = [];
    const errors: string[] = [];
    const checkedItems = selectedItems.filter(item => item.checked);
    
    console.log(`🎯 [清理服务] 需要执行的清理项目数量: ${checkedItems.length}/${selectedItems.length}`);

    for (const [index, item] of checkedItems.entries()) {
      console.log(`🔄 [清理服务] 执行第 ${index + 1}/${checkedItems.length} 个清理项目: ${item.description}`);

      // 验证命令安全性
      const validation = this.validateCommand(item.command);
      if (!validation.isValid) {
        console.warn(`⚠️ [清理服务] 跳过不安全的命令: ${item.command}, 原因: ${validation.reason}`);
        const errorMsg = `${item.description}: ${validation.reason}`;
        errors.push(errorMsg);
        console.log(`❌ [清理服务] 安全检查失败:`, errorMsg);
        continue;
      }

      try {
        console.log(`⚡ [清理服务] 执行清理命令: ${item.command}`);
        await executeCleanupCommand(item.command);
        cleanedItems.push(item);
        console.log(`✅ [清理服务] 清理成功: ${item.description}`);
      } catch (error) {
        console.error(`❌ [清理服务] 清理失败: ${item.description}`, error);
        
        // 为快照相关错误提供更详细的提示
        let errorMsg = `${item.description}: 执行失败`;
        if (item.command.includes('tmutil') && item.command.includes('snapshot')) {
          const errorStr = error instanceof Error ? error.message : String(error);
          if (errorStr.includes('com.apple.os.update') || errorStr.includes('Failed to delete')) {
            errorMsg = `${item.description}: 系统更新快照无法删除，这些快照由macOS自动管理，建议重启系统后再次检查`;
          } else if (errorStr.includes('permission') || errorStr.includes('not permitted')) {
            errorMsg = `${item.description}: 权限不足，请确保应用有完全磁盘访问权限`;
          } else {
            errorMsg = `${item.description}: 快照清理失败，可能是系统保护的快照或权限问题`;
          }
        }
        
        errors.push(errorMsg);
        console.log(`❌ [清理服务] 失败详情:`, errorMsg);
      }
    }

    // 等待一秒后获取清理后的磁盘信息
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterDisk = await storageService.collectDiskInfo();

    // 计算释放的空间（简化处理）
    const beforeUsed = parseFloat(beforeDisk.used.replace(/[^0-9.]/g, ''));
    const afterUsed = parseFloat(afterDisk.used.replace(/[^0-9.]/g, ''));
    const totalCleaned = Math.max(0, beforeUsed - afterUsed);

    if (errors.length > 0) {
      console.warn('清理过程中出现错误:', errors);
    }

    return {
      beforeDiskInfo: beforeDisk,
      afterDiskInfo: afterDisk,
      completedItems: cleanedItems,
      totalFreedGB: totalCleaned
    };
  }

  // 预估清理效果
  estimateCleanupSize(selectedItems: CleanupItem[]): string {
    let totalEstimate = 0;
    const sizeRegex = /(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)/i;

    for (const item of selectedItems) {
      if (!item.checked) continue;

      const estimatedSizeStr = `${item.estimated_size_gb || 0} GB`;
      const match = estimatedSizeStr.match(sizeRegex);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        let bytes = value;
        switch (unit) {
          case 'KB': bytes *= 1024; break;
          case 'MB': bytes *= 1024 * 1024; break;
          case 'GB': bytes *= 1024 * 1024 * 1024; break;
          case 'TB': bytes *= 1024 * 1024 * 1024 * 1024; break;
        }
        
        totalEstimate += bytes;
      }
    }

    return this.formatBytes(totalEstimate);
  }

  private parseStorageSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)/i);
    if (!match) {
      console.warn('⚠️ [清理服务] 无法解析存储大小:', sizeStr);
      return 0;
    }
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 ** 2,
      'GB': 1024 ** 3,
      'TB': 1024 ** 4
    };
    
    return value * (multipliers[unit] || 1);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const cleanupService = new CleanupService();