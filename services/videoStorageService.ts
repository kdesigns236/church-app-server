// Video Storage Service - Persistent offline video storage using IndexedDB

interface VideoMetadata {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
}

class VideoStorageService {
  private dbName = 'ChurchVideoDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[VideoStorage] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[VideoStorage] Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for videos
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
          videoStore.createIndex('filename', 'filename', { unique: false });
          console.log('[VideoStorage] Object store created');
        }

        // Create object store for video blobs
        if (!db.objectStoreNames.contains('videoBlobs')) {
          db.createObjectStore('videoBlobs', { keyPath: 'id' });
          console.log('[VideoStorage] Blob store created');
        }
      };
    });
  }

  // Save video file to IndexedDB
  async saveVideo(sermonId: string, videoFile: File): Promise<string> {
    try {
      if (!this.db) await this.initialize();

      // Read file as blob
      const blob = new Blob([videoFile], { type: videoFile.type });
      
      // Save metadata
      const metadata: VideoMetadata = {
        id: sermonId,
        filename: videoFile.name,
        size: videoFile.size,
        mimetype: videoFile.type,
        uploadDate: new Date().toISOString()
      };

      await this.saveToStore('videos', metadata);
      
      // Save blob
      await this.saveToStore('videoBlobs', { id: sermonId, blob });

      console.log(`[VideoStorage] Video saved: ${sermonId} (${this.formatBytes(videoFile.size)})`);
      
      // Return a custom URL identifier
      return `indexed-db://${sermonId}`;
    } catch (error) {
      console.error('[VideoStorage] Error saving video:', error);
      throw error;
    }
  }

  // Get video blob from IndexedDB
  async getVideo(sermonId: string): Promise<Blob | null> {
    try {
      if (!this.db) await this.initialize();

      const data = await this.getFromStore('videoBlobs', sermonId);
      if (data && data.blob) {
        console.log(`[VideoStorage] Video retrieved: ${sermonId}`);
        return data.blob;
      }
      return null;
    } catch (error) {
      console.error('[VideoStorage] Error getting video:', error);
      return null;
    }
  }

  // Get video URL (creates blob URL from stored blob)
  async getVideoUrl(sermonId: string): Promise<string | null> {
    try {
      const blob = await this.getVideo(sermonId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        console.log(`[VideoStorage] Created blob URL for: ${sermonId}`);
        return url;
      }
      return null;
    } catch (error) {
      console.error('[VideoStorage] Error creating video URL:', error);
      return null;
    }
  }

  // Check if video exists
  async hasVideo(sermonId: string): Promise<boolean> {
    try {
      if (!this.db) await this.initialize();
      const data = await this.getFromStore('videoBlobs', sermonId);
      return !!data;
    } catch (error) {
      return false;
    }
  }

  // Delete video
  async deleteVideo(sermonId: string): Promise<void> {
    try {
      if (!this.db) await this.initialize();
      await this.deleteFromStore('videos', sermonId);
      await this.deleteFromStore('videoBlobs', sermonId);
      console.log(`[VideoStorage] Video deleted: ${sermonId}`);
    } catch (error) {
      console.error('[VideoStorage] Error deleting video:', error);
      throw error;
    }
  }

  // Get all stored videos metadata
  async getAllVideos(): Promise<VideoMetadata[]> {
    try {
      if (!this.db) await this.initialize();
      return await this.getAllFromStore('videos');
    } catch (error) {
      console.error('[VideoStorage] Error getting all videos:', error);
      return [];
    }
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; videos: number }> {
    try {
      const videos = await this.getAllVideos();
      const used = videos.reduce((total, video) => total + video.size, 0);
      return { used, videos: videos.length };
    } catch (error) {
      return { used: 0, videos: 0 };
    }
  }

  // Helper: Save to object store
  private saveToStore(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Helper: Get from object store
  private getFromStore(storeName: string, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Helper: Get all from object store
  private getAllFromStore(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Helper: Delete from object store
  private deleteFromStore(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Format bytes to human-readable
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Create singleton instance
export const videoStorageService = new VideoStorageService();
