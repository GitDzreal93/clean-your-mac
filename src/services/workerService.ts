import { getDiskUsage, getLargeFiles, getCacheSize, getDownloadsSize, getTrashSize, collectDiskInfo, getSnapshotDetails } from '../utils/commands';
import { DiskInfo, SnapshotDetail } from '../types';

// Progress callback type
type ProgressCallback = (progress: number) => void;

// Worker service class to manage data collection in background
// Uses setTimeout to avoid blocking UI while still accessing Tauri APIs
class WorkerService {
  private isCollecting = false;

  // Collect detailed analysis data using setTimeout for non-blocking execution
  async collectDetailedAnalysis(onProgress?: ProgressCallback): Promise<{
    diskInfo: DiskInfo;
    largeFiles: string;
    cacheSize: string;
    downloadsSize: string;
    trashSize: string;
    snapshotDetails: SnapshotDetail[];
  }> {
    if (this.isCollecting) {
      throw new Error('数据收集正在进行中，请稍候');
    }

    this.isCollecting = true;
    
    try {
      // Helper function to run async operations with progress updates
      const runWithProgress = async <T>(fn: () => Promise<T>, progress: number): Promise<T> => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              const result = await fn();
              if (onProgress) {
                onProgress(progress);
              }
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, 10); // Small delay to allow UI updates
        });
      };

      // Collect data step by step with progress updates
      if (onProgress) onProgress(5);
      const diskInfo = await runWithProgress(() => collectDiskInfo(), 20);
      
      const largeFiles = await runWithProgress(() => getLargeFiles(), 35);
      
      const cacheSize = await runWithProgress(() => getCacheSize(), 50);
      
      const downloadsSize = await runWithProgress(() => getDownloadsSize(), 65);
      
      const trashSize = await runWithProgress(() => getTrashSize(), 80);
      
      const snapshotDetails = await runWithProgress(() => getSnapshotDetails(), 100);

      return {
        diskInfo,
        largeFiles,
        cacheSize,
        downloadsSize,
        trashSize,
        snapshotDetails
      };
    } finally {
      this.isCollecting = false;
    }
  }

  // Check if collection is in progress
  isCollectionInProgress(): boolean {
    return this.isCollecting;
  }

  // Cancel collection (for future enhancement)
  cancel(): void {
    this.isCollecting = false;
  }
}

// Export singleton instance
export const workerService = new WorkerService();