// WebSocket Service using Socket.io for real-time synchronization
import { io, Socket } from 'socket.io-client';

interface SyncData {
  type: 'sermons' | 'announcements' | 'events' | 'siteContent' | 'prayerRequests' | 'bibleStudies' | 'chatMessages' | 'users';
  action: 'add' | 'update' | 'delete' | 'clear';
  data: any;
  timestamp?: number;
  adminId?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private apiUrl: string;

  constructor() {
    // @ts-ignore - Vite env variable
    // Use production URL as fallback for mobile builds
    this.apiUrl = import.meta.env?.VITE_API_URL || 'https://church-app-server.onrender.com/api';
    // Remove /api suffix for Socket.io connection (Socket.io uses its own /socket.io/ path)
    this.serverUrl = this.apiUrl.replace('/api', '');
    console.log('[WebSocket] API URL:', this.apiUrl);
    console.log('[WebSocket] Server URL:', this.serverUrl);
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', this.serverUrl);

    this.socket = io(this.serverUrl, {
      transports: ['polling', 'websocket'], // Try polling first for Render compatibility
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000
    });

    this.setupEventHandlers();
  }

  // Setup Socket.io event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempts = 0;
      this.notifyListeners('connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.notifyListeners('disconnected', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
      }
    });

    // Listen for sync updates from server
    this.socket.on('sync_update', (syncData: SyncData) => {
      console.log('[WebSocket] Received sync update:', syncData.type, syncData.action);
      this.handleSyncUpdate(syncData);
    });

    this.socket.on('connected', (data) => {
      console.log('[WebSocket] Server says:', data.message);
    });
  }

  // Handle incoming sync updates
  private handleSyncUpdate(syncData: SyncData): void {
    // Apply update to localStorage
    this.applyLocalUpdate(syncData);

    // Notify all listeners
    this.notifyListeners('sync_update', syncData);
  }

  // Apply update to localStorage
  private applyLocalUpdate(syncData: SyncData): void {
    const storageKey = syncData.type;
    
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
          // Check if already exists to avoid duplicates
          if (!dataArray.find((item: any) => item.id === syncData.data.id)) {
            updatedData = [...dataArray, syncData.data];
          }
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
      console.log(`[WebSocket] Updated ${storageKey} in localStorage`);
    } catch (error) {
      console.error('[WebSocket] Error applying local update:', error);
    }
  }

  // Push update to server
  async pushUpdate(syncData: Omit<SyncData, 'timestamp'>): Promise<void> {
    const dataWithTimestamp = {
      ...syncData,
      timestamp: Date.now()
    };

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('[WebSocket] ❌ No auth token found! User might not be logged in.');
        throw new Error('Authentication required. Please log in again.');
      }

      console.log(`[WebSocket] Pushing ${syncData.type} update to server...`);
      console.log(`[WebSocket] API URL: ${this.apiUrl}/sync/push`);
      console.log(`[WebSocket] Has token: ${!!token}`);

      const response = await fetch(`${this.apiUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataWithTimestamp)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WebSocket] ❌ Server error: ${response.status} ${response.statusText}`);
        console.error(`[WebSocket] ❌ Error details: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`);
      }

      console.log(`[WebSocket] ✅ Update pushed successfully: ${syncData.type}`);
    } catch (error) {
      console.error('[WebSocket] ❌ Push failed:', error);
      console.error('[WebSocket] ❌ Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Pull all data from server
  async pullFromServer(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/sync/data`);
      
      if (!response.ok) {
        throw new Error(`Pull failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[WebSocket] Data pulled successfully');

      // Save to localStorage with validation
      if (data && typeof data === 'object') {
        if (data.sermons && Array.isArray(data.sermons) && data.sermons.length > 0) {
          localStorage.setItem('sermons', JSON.stringify(data.sermons));
        }
        if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
          localStorage.setItem('announcements', JSON.stringify(data.announcements));
        }
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          localStorage.setItem('events', JSON.stringify(data.events));
        }
        if (data.siteContent && typeof data.siteContent === 'object' && Object.keys(data.siteContent).length > 0) {
          localStorage.setItem('siteContent', JSON.stringify(data.siteContent));
        }
        if (data.prayerRequests && Array.isArray(data.prayerRequests) && data.prayerRequests.length > 0) {
          localStorage.setItem('prayerRequests', JSON.stringify(data.prayerRequests));
        }
        if (data.chatMessages && Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
          localStorage.setItem('chatMessages', JSON.stringify(data.chatMessages));
        }
        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
          localStorage.setItem('churchUserList', JSON.stringify(data.users));
        }
      }
      
      return data;
    } catch (error) {
      console.error('[WebSocket] Pull failed:', error);
      throw error;
    }
  }

  // Add listener for sync updates
  addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Remove listener
  removeListener(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Notify all listeners
  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Disconnect from server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[WebSocket] Disconnected');
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance for direct access (for WebRTC signaling)
  getSocket(): Socket {
    if (!this.socket) {
      this.connect();
    }
    return this.socket!;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
