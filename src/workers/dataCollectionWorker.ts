// Web Worker for data collection to avoid blocking main thread
// Note: This is a placeholder - actual implementation will use main thread with setTimeout
// to avoid blocking UI while still being able to access Tauri APIs

// Worker message types
interface WorkerMessage {
  type: 'START_COLLECTION' | 'COLLECTION_PROGRESS' | 'COLLECTION_COMPLETE' | 'COLLECTION_ERROR';
  data?: any;
  progress?: number;
  error?: string;
}

// Placeholder worker - actual implementation moved to workerService
// This file exists for future enhancement when Tauri supports Workers better

// Worker message handler
self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { type } = e.data;
  
  switch (type) {
    case 'START_COLLECTION':
      // For now, just send an error to fallback to main thread implementation
      postMessage({ 
        type: 'COLLECTION_ERROR', 
        error: 'Worker implementation not available, using main thread fallback' 
      });
      break;
    default:
      console.warn('Unknown worker message type:', type);
  }
};

// Export for TypeScript
export {};