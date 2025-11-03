// Sync Manager - Hybrid online/offline data synchronization

interface SyncConfig {
  serverUrl: string;
  syncInterval: number; // milliseconds
  enabled: boolean;
}

class SyncManager {
  private config: SyncConfig = {
    serverUrl: 'http://localhost:3001/api',
    syncInterval: 30000, // 30 seconds
    enabled: false // Disabled by default (offline-first)
  };
  
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[Sync] Device is online');
      this.isOnline = true;
      if (this.config.enabled) {
        this.startSync();
      }
    });

    window.addEventListener('offline', () => {
      console.log('[Sync] Device is offline');
      this.isOnline = false;
      this.stopSync();
    });
  }

  // Enable sync with server
  enableSync(serverUrl?: string) {
    if (serverUrl) {
      this.config.serverUrl = serverUrl;
    }
    this.config.enabled = true;
    console.log('[Sync] Sync enabled:', this.config.serverUrl);
    
    if (this.isOnline) {
      this.startSync();
    }
  }

  // Disable sync (offline-only mode)
  disableSync() {
    this.config.enabled = false;
    this.stopSync();
    console.log('[Sync] Sync disabled - offline-only mode');
  }

  // Start periodic sync
  private startSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Initial sync
    this.syncNow();

    // Periodic sync
    this.syncTimer = setInterval(() => {
      this.syncNow();
    }, this.config.syncInterval);

    console.log('[Sync] Auto-sync started (every 30 seconds)');
  }

  // Stop periodic sync
  private stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    console.log('[Sync] Auto-sync stopped');
  }

  // Sync now
  async syncNow(): Promise<boolean> {
    if (!this.config.enabled || !this.isOnline) {
      console.log('[Sync] Sync skipped - offline or disabled');
      return false;
    }

    try {
      console.log('[Sync] Syncing data...');
      
      // Get data from server
      const response = await fetch(`${this.config.serverUrl}/sync/data`);
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const serverData = await response.json();
      
      // Update localStorage with server data
      if (serverData.sermons) {
        localStorage.setItem('sermons', JSON.stringify(serverData.sermons));
      }
      if (serverData.announcements) {
        localStorage.setItem('announcements', JSON.stringify(serverData.announcements));
      }
      if (serverData.events) {
        localStorage.setItem('events', JSON.stringify(serverData.events));
      }
      if (serverData.siteContent) {
        localStorage.setItem('siteContent', JSON.stringify(serverData.siteContent));
      }

      console.log('[Sync] Data synced successfully');
      
      // Trigger page reload to show new data
      window.dispatchEvent(new Event('storage'));
      
      return true;
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      return false;
    }
  }

  // Push local changes to server (for admin)
  async pushToServer(dataType: string, data: any): Promise<boolean> {
    if (!this.config.enabled || !this.isOnline) {
      console.log('[Sync] Push skipped - offline or disabled');
      return false;
    }

    try {
      const token = localStorage.getItem('authToken') || 'admin-token';
      
      const response = await fetch(`${this.config.serverUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: dataType,
          data: data
        })
      });

      if (!response.ok) {
        throw new Error('Push failed');
      }

      console.log(`[Sync] ${dataType} pushed to server`);
      return true;
    } catch (error) {
      console.error('[Sync] Push failed:', error);
      return false;
    }
  }

  // Check if sync is enabled
  isSyncEnabled(): boolean {
    return this.config.enabled;
  }

  // Check if device is online
  isDeviceOnline(): boolean {
    return this.isOnline;
  }
}

// Create singleton instance
export const syncManager = new SyncManager();

// To enable sync, call:
// syncManager.enableSync('http://your-server-url:3001/api');

// To disable sync (offline-only):
// syncManager.disableSync();
