// Storage management service for handling device storage permissions and quota

interface StorageEstimate {
  usage: number;
  quota: number;
  usagePercent: number;
  usageFormatted: string;
  quotaFormatted: string;
}

class StorageService {
  private hasRequestedPersistence = false;

  // Request persistent storage permission
  async requestPersistentStorage(): Promise<boolean> {
    if (this.hasRequestedPersistence) {
      return await this.isPersisted();
    }

    try {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        this.hasRequestedPersistence = true;
        
        if (isPersisted) {
          console.log('[Storage] Persistent storage granted! ✅');
          console.log('[Storage] Your data will not be automatically cleared.');
        } else {
          console.log('[Storage] Persistent storage denied. Data may be cleared if device runs low on space.');
        }
        
        return isPersisted;
      } else {
        console.warn('[Storage] Persistent storage API not supported');
        return false;
      }
    } catch (error) {
      console.error('[Storage] Error requesting persistent storage:', error);
      return false;
    }
  }

  // Check if storage is already persistent
  async isPersisted(): Promise<boolean> {
    try {
      if (navigator.storage && navigator.storage.persisted) {
        return await navigator.storage.persisted();
      }
      return false;
    } catch (error) {
      console.error('[Storage] Error checking persistence:', error);
      return false;
    }
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

        return {
          usage,
          quota,
          usagePercent,
          usageFormatted: this.formatBytes(usage),
          quotaFormatted: this.formatBytes(quota)
        };
      }
      return null;
    } catch (error) {
      console.error('[Storage] Error getting storage estimate:', error);
      return null;
    }
  }

  // Format bytes to human-readable format
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Check if there's enough space for a file
  async hasEnoughSpace(fileSize: number): Promise<boolean> {
    const estimate = await this.getStorageEstimate();
    if (!estimate) return true; // Assume yes if we can't check

    const availableSpace = estimate.quota - estimate.usage;
    return availableSpace > fileSize;
  }

  // Show storage info to user
  async showStorageInfo(): Promise<void> {
    const estimate = await this.getStorageEstimate();
    const isPersisted = await this.isPersisted();

    if (estimate) {
      console.log('📊 Storage Information:');
      console.log(`   Used: ${estimate.usageFormatted}`);
      console.log(`   Available: ${estimate.quotaFormatted}`);
      console.log(`   Usage: ${estimate.usagePercent.toFixed(2)}%`);
      console.log(`   Persistent: ${isPersisted ? '✅ Yes' : '❌ No'}`);
    }
  }

  // Request permission with user-friendly dialog
  async requestStoragePermissionWithDialog(): Promise<boolean> {
    const estimate = await this.getStorageEstimate();
    
    if (!estimate) {
      return await this.requestPersistentStorage();
    }

    const message = `
Church of God Evening Light would like to store data on your device.

Current Usage: ${estimate.usageFormatted} / ${estimate.quotaFormatted}

This will allow:
• Offline access to sermons and Bible
• Faster loading times
• Automatic sync of new content

Your data will be protected and won't be automatically cleared.

Allow storage permission?
    `.trim();

    const userConsent = confirm(message);
    
    if (userConsent) {
      return await this.requestPersistentStorage();
    }
    
    return false;
  }

  // Monitor storage and warn if running low
  async checkStorageHealth(): Promise<void> {
    const estimate = await this.getStorageEstimate();
    
    if (!estimate) return;

    if (estimate.usagePercent > 90) {
      console.warn('⚠️ Storage is running low!');
      this.showLowStorageWarning(estimate);
    } else if (estimate.usagePercent > 75) {
      console.warn('⚠️ Storage usage is high');
    }
  }

  // Show low storage warning to user
  private showLowStorageWarning(estimate: StorageEstimate): void {
    const message = `
⚠️ Storage Warning

Your device storage is ${estimate.usagePercent.toFixed(1)}% full.

Used: ${estimate.usageFormatted} / ${estimate.quotaFormatted}

Consider:
• Deleting old cached data
• Freeing up device space
• Clearing browser data for other sites

The app may not work properly if storage is full.
    `.trim();

    alert(message);
  }

  // Clear old cached data
  async clearOldCache(): Promise<boolean> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        // Keep only the latest cache
        const latestCache = cacheNames.sort().pop();
        
        for (const cacheName of cacheNames) {
          if (cacheName !== latestCache) {
            await caches.delete(cacheName);
            console.log(`[Storage] Deleted old cache: ${cacheName}`);
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Storage] Error clearing old cache:', error);
      return false;
    }
  }

  // Get detailed storage breakdown
  async getStorageBreakdown(): Promise<any> {
    try {
      if (navigator.storage && (navigator.storage as any).getDirectory) {
        // File System Access API (if available)
        const root = await (navigator.storage as any).getDirectory();
        return { available: true, root };
      }
      
      // Fallback to estimate
      return await this.getStorageEstimate();
    } catch (error) {
      console.error('[Storage] Error getting storage breakdown:', error);
      return null;
    }
  }

  // Initialize storage on app start
  async initialize(): Promise<void> {
    console.log('[Storage] Initializing storage service...');
    
    // Check if already persisted
    const isPersisted = await this.isPersisted();
    
    if (!isPersisted) {
      console.log('[Storage] Storage is not persistent yet');
      // Will request permission when user first uploads/downloads
    } else {
      console.log('[Storage] Storage is already persistent ✅');
    }

    // Show storage info
    await this.showStorageInfo();
    
    // Check storage health
    await this.checkStorageHealth();
  }
}

// Create singleton instance
export const storageService = new StorageService();
