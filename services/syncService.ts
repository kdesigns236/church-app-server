// Sync Service for real-time data synchronization
// This service handles syncing data between admin and all users

interface SyncConfig {
  apiUrl: string;
  enableRealtime: boolean;
}

interface SyncData {
  type: 'sermons' | 'announcements' | 'events' | 'siteContent' | 'prayerRequests' | 'chatMessages' | 'users';
  action: 'add' | 'update' | 'delete' | 'clear';
  data: any;
  timestamp: number;
  adminId?: string;
}

class SyncService {
  private config: SyncConfig;
  private eventSource: EventSource | null = null;
  private syncQueue: SyncData[] = [];
  private isOnline: boolean = navigator.onLine;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: SyncConfig) {
    this.config = config;
    this.setupOnlineListener();
    if (this.config.enableRealtime) {
      this.connectToRealtimeUpdates();
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Connect to Server-Sent Events for real-time updates
  private connectToRealtimeUpdates() {
    if (!this.isOnline) return;

    try {
      this.eventSource = new EventSource(`${this.config.apiUrl}/sync/stream`);

      this.eventSource.onmessage = (event) => {
        try {
          const syncData: SyncData = JSON.parse(event.data);
          this.handleIncomingSync(syncData);
        } catch (error) {
          console.error('[Sync] Error parsing sync data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[Sync] EventSource error:', error);
        this.eventSource?.close();
        // Retry connection after 5 seconds
        setTimeout(() => this.connectToRealtimeUpdates(), 5000);
      };

      console.log('[Sync] Connected to real-time updates');
    } catch (error) {
      console.error('[Sync] Failed to connect to real-time updates:', error);
    }
  }

  // Handle incoming sync data from server
  private handleIncomingSync(syncData: SyncData) {
    console.log('[Sync] Received update:', syncData.type, syncData.action);

    // Store in localStorage
    this.applyLocalUpdate(syncData);

    // Notify listeners
    this.notifyListeners(syncData.type, syncData);

    // Update service worker cache
    this.updateServiceWorkerCache(syncData);
  }

  // Apply update to localStorage
  private applyLocalUpdate(syncData: SyncData) {
    const storageKey = syncData.type; // Use the type directly as the key
    
    try {
      if (syncData.action === 'clear') {
        localStorage.removeItem(storageKey);
        return;
      }

      const existingDataStr = localStorage.getItem(storageKey);
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      // Ensure existingData is an array
      const dataArray = Array.isArray(existingData) ? existingData : [];
      let updatedData = dataArray;

      switch (syncData.action) {
        case 'add':
          updatedData = [...dataArray, syncData.data];
          break;
        case 'update':
          updatedData = dataArray.map((item: any) => 
            item.id === syncData.data.id ? syncData.data : item
          );
          break;
        case 'delete':
          updatedData = dataArray.filter((item: any) => 
            item.id !== syncData.data.id
          );
          break;
      }

      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      localStorage.setItem(`${storageKey}_lastSync`, String(syncData.timestamp));
    } catch (error) {
      console.error('[Sync] Error applying local update:', error);
    }
  }

  // Update service worker cache with new data
  private async updateServiceWorkerCache(syncData: SyncData) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_CACHE',
        data: syncData
      });
    }
  }

  // Push changes to server (called by admin)
  async pushUpdate(syncData: Omit<SyncData, 'timestamp'>): Promise<boolean> {
    const fullSyncData: SyncData = {
      ...syncData,
      timestamp: Date.now()
    };

    if (!this.isOnline) {
      // Queue for later
      this.syncQueue.push(fullSyncData);
      console.log('[Sync] Queued update for later:', syncData.type);
      return false;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(fullSyncData)
      });

      if (response.ok) {
        console.log('[Sync] Update pushed successfully:', syncData.type);
        // Also apply locally
        this.applyLocalUpdate(fullSyncData);
        return true;
      } else {
        throw new Error('Failed to push update');
      }
    } catch (error) {
      console.error('[Sync] Error pushing update:', error);
      this.syncQueue.push(fullSyncData);
      return false;
    }
  }

  // Process queued updates when back online
  private async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    console.log(`[Sync] Processing ${this.syncQueue.length} queued updates`);

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const syncData of queue) {
      await this.pushUpdate(syncData);
    }
  }

  // Subscribe to updates for a specific data type
  subscribe(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  // Notify all listeners of an update
  private notifyListeners(type: string, data: any) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Get auth token from localStorage
  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }

  // Fetch latest data from server
  async fetchLatest(type: string): Promise<any[]> {
    if (!this.isOnline) {
      // Return cached data
      const storageKey = `${type}Data`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/sync/${type}`);
      if (response.ok) {
        const data = await response.json();
        // Update local cache
        localStorage.setItem(`${type}Data`, JSON.stringify(data));
        localStorage.setItem(`${type}Data_lastSync`, String(Date.now()));
        return data;
      }
    } catch (error) {
      console.error('[Sync] Error fetching latest:', error);
    }

    // Fallback to cached data
    const storageKey = `${type}Data`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  // Check if local data is stale
  isStale(type: string, maxAgeMs: number = 5 * 60 * 1000): boolean {
    const lastSync = localStorage.getItem(`${type}Data_lastSync`);
    if (!lastSync) return true;

    const age = Date.now() - parseInt(lastSync);
    return age > maxAgeMs;
  }

  // Start listening for updates (wrapper for connectToRealtimeUpdates)
  startListening(callback: (data: any) => void) {
    // Add callback to listeners
    if (!this.listeners.has('sync')) {
      this.listeners.set('sync', new Set());
    }
    this.listeners.get('sync')!.add(callback);
    
    // Connect to real-time updates if not already connected
    if (!this.eventSource && this.config.enableRealtime) {
      this.connectToRealtimeUpdates();
    }
    
    console.log('[Sync] Started listening for updates');
  }

  // Stop listening for updates
  stopListening() {
    this.listeners.clear();
    this.disconnect();
    console.log('[Sync] Stopped listening for updates');
  }

  // Pull all data from server (initial sync)
  async pullFromServer(): Promise<any> {
    if (!this.isOnline) {
      throw new Error('Device is offline');
    }

    try {
      console.log('[Sync] Pulling data from server...');
      
      const response = await fetch(`${this.config.apiUrl}/sync/data`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const data = await response.json();
      console.log('[Sync] Data pulled successfully', data);
      
      // Only save to localStorage if server has data (don't overwrite local data with empty server data)
      // Check if data exists and is not empty before saving
      if (data && typeof data === 'object') {
        if (data.sermons && Array.isArray(data.sermons) && data.sermons.length > 0) {
          localStorage.setItem('sermons', JSON.stringify(data.sermons));
          console.log('[Sync] Saved sermons to localStorage:', data.sermons.length);
        }
        if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
          localStorage.setItem('announcements', JSON.stringify(data.announcements));
          console.log('[Sync] Saved announcements to localStorage:', data.announcements.length);
        }
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          localStorage.setItem('events', JSON.stringify(data.events));
          console.log('[Sync] Saved events to localStorage:', data.events.length);
        }
        if (data.siteContent && typeof data.siteContent === 'object' && Object.keys(data.siteContent).length > 0) {
          localStorage.setItem('siteContent', JSON.stringify(data.siteContent));
          console.log('[Sync] Saved siteContent to localStorage');
        }
        if (data.prayerRequests && Array.isArray(data.prayerRequests) && data.prayerRequests.length > 0) {
          localStorage.setItem('prayerRequests', JSON.stringify(data.prayerRequests));
          console.log('[Sync] Saved prayerRequests to localStorage:', data.prayerRequests.length);
        }
        if (data.chatMessages && Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
          localStorage.setItem('chatMessages', JSON.stringify(data.chatMessages));
          console.log('[Sync] Saved chatMessages to localStorage:', data.chatMessages.length);
        }
        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
          localStorage.setItem('churchUserList', JSON.stringify(data.users));
          console.log('[Sync] Saved users to localStorage:', data.users.length);
        }
      }
      
      return data;
    } catch (error) {
      console.error('[Sync] Pull failed:', error);
      throw error;
    }
  }

  // Disconnect from real-time updates
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('[Sync] Disconnected from real-time updates');
    }
  }
}

// Create singleton instance
const syncConfig: SyncConfig = {
  apiUrl: (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api',
  enableRealtime: true
};

export const syncService = new SyncService(syncConfig);
export type { SyncData };
