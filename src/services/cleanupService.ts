import { CleanupItem, CleanupResult, DiskInfo, WhitelistItem } from '../types';
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

    // 计算释放的空间（简化处理）
    const beforeUsed = parseFloat(beforeDisk.used.replace(/[^0-9.]/g, ''));
    const afterUsed = parseFloat(afterDisk.used.replace(/[^0-9.]/g, ''));
    const totalCleaned = Math.max(0, beforeUsed - afterUsed);
    console.log(`📊 [清理服务] 空间释放计算: ${beforeUsed} - ${afterUsed} = ${totalCleaned}GB`);

    if (errors.length > 0) {
      console.warn('⚠️ [清理服务] 清理过程中出现错误:', errors);
    }

    const result = {
      beforeDiskInfo: beforeDisk,
      afterDiskInfo: afterDisk,
      completedItems: cleanedItems,
      totalFreedGB: totalCleaned
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
        const errorMsg = `${item.description}: 执行失败`;
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

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const cleanupService = new CleanupService();