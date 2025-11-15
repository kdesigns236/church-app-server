// Multi-Camera Service for Live Streaming
// Supports local cameras, external cameras, and phone cameras via WebRTC

export interface CameraSource {
  id: string;
  name: string;
  type: 'local' | 'external' | 'phone';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  stream?: MediaStream;
  deviceId?: string;
  resolution?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  isActive?: boolean;
  lastSeen?: number;
  metadata?: {
    deviceName?: string;
    browser?: string;
    os?: string;
    batteryLevel?: number;
    networkQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface CameraConnection {
  id: string;
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  stream?: MediaStream;
  stats?: RTCStatsReport;
}

class MultiCameraService {
  private cameras: Map<string, CameraSource> = new Map();
  private connections: Map<string, CameraConnection> = new Map();
  private activeCamera: string | null = null;
  private localStream: MediaStream | null = null;
  private isInitialized = false;
  
  // WebRTC configuration
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Event listeners
  private listeners: Map<string, Function[]> = new Map();

  // Initialize the multi-camera system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[MultiCamera] Initializing multi-camera system...');
      
      // Initialize local cameras
      await this.initializeLocalCameras();
      
      // Set up WebRTC signaling
      await this.initializeSignaling();
      
      this.isInitialized = true;
      console.log('[MultiCamera] Multi-camera system initialized');
      
      this.emit('initialized', { cameras: Array.from(this.cameras.values()) });
    } catch (error) {
      console.error('[MultiCamera] Initialization failed:', error);
      throw error;
    }
  }

  // Initialize local cameras (built-in and USB)
  private async initializeLocalCameras(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      for (const device of videoDevices) {
        const cameraId = `local_${device.deviceId}`;
        const camera: CameraSource = {
          id: cameraId,
          name: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          type: 'local',
          status: 'disconnected',
          deviceId: device.deviceId,
          quality: 'high',
          resolution: '1280x720'
        };

        this.cameras.set(cameraId, camera);
      }

      console.log(`[MultiCamera] Found ${videoDevices.length} local cameras`);
    } catch (error) {
      console.error('[MultiCamera] Error initializing local cameras:', error);
    }
  }

  // Initialize WebRTC signaling for external connections
  private async initializeSignaling(): Promise<void> {
    // This would connect to your WebSocket server for signaling
    // For now, we'll set up the basic structure
    console.log('[MultiCamera] WebRTC signaling initialized');
  }

  // Connect to a local camera
  async connectLocalCamera(cameraId: string, constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const camera = this.cameras.get(cameraId);
    if (!camera || camera.type !== 'local') {
      throw new Error('Invalid local camera ID');
    }

    try {
      console.log(`[MultiCamera] Connecting to local camera: ${camera.name}`);
      camera.status = 'connecting';
      this.emit('cameraStatusChanged', { cameraId, status: 'connecting' });

      const defaultConstraints: MediaStreamConstraints = {
        video: {
          deviceId: camera.deviceId ? { exact: camera.deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false // Audio handled separately
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints);
      
      camera.stream = stream;
      camera.status = 'connected';
      camera.lastSeen = Date.now();

      // Update resolution based on actual stream
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        camera.resolution = `${settings.width}x${settings.height}`;
      }

      this.cameras.set(cameraId, camera);
      this.emit('cameraConnected', { camera });

      console.log(`[MultiCamera] Local camera connected: ${camera.name}`);
      return stream;
    } catch (error) {
      camera.status = 'error';
      this.cameras.set(cameraId, camera);
      this.emit('cameraError', { cameraId, error });
      throw error;
    }
  }

  // Generate connection URL for external devices
  generateConnectionUrl(): string {
    const sessionId = this.generateSessionId();
    const baseUrl = window.location.origin;
    return `${baseUrl}/camera-client?session=${sessionId}&role=camera`;
  }

  // Generate QR code data for easy phone connection
  generateQRCode(): string {
    return this.generateConnectionUrl();
  }

  // Accept incoming camera connection
  async acceptCameraConnection(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      console.log(`[MultiCamera] Accepting camera connection from: ${peerId}`);

      const connection = new RTCPeerConnection(this.rtcConfig);
      const connectionId = `external_${peerId}`;

      // Set up connection event handlers
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage(peerId, {
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };

      connection.ontrack = (event) => {
        console.log(`[MultiCamera] Received stream from: ${peerId}`);
        const [stream] = event.streams;
        this.handleIncomingStream(peerId, stream);
      };

      connection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        this.setupDataChannel(peerId, dataChannel);
      };

      // Set remote description and create answer
      await connection.setRemoteDescription(offer);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      // Store connection
      this.connections.set(connectionId, {
        id: connectionId,
        peerId,
        connection
      });

      // Create camera entry
      const camera: CameraSource = {
        id: connectionId,
        name: `External Camera ${peerId.slice(0, 8)}`,
        type: 'external',
        status: 'connecting',
        quality: 'high'
      };

      this.cameras.set(connectionId, camera);
      this.emit('cameraConnecting', { camera });

      return answer;
    } catch (error) {
      console.error('[MultiCamera] Error accepting camera connection:', error);
      throw error;
    }
  }

  // Handle incoming video stream from external camera
  private handleIncomingStream(peerId: string, stream: MediaStream): void {
    const connectionId = `external_${peerId}`;
    const camera = this.cameras.get(connectionId);

    if (camera) {
      camera.stream = stream;
      camera.status = 'connected';
      camera.lastSeen = Date.now();

      // Get stream metadata
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        camera.resolution = `${settings.width}x${settings.height}`;
      }

      this.cameras.set(connectionId, camera);
      this.emit('cameraConnected', { camera });

      console.log(`[MultiCamera] External camera stream ready: ${camera.name}`);
    }
  }

  // Set up data channel for camera control
  private setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
    const connectionId = `external_${peerId}`;
    const connection = this.connections.get(connectionId);

    if (connection) {
      connection.dataChannel = dataChannel;

      dataChannel.onopen = () => {
        console.log(`[MultiCamera] Data channel opened for: ${peerId}`);
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleDataChannelMessage(peerId, message);
        } catch (error) {
          console.error('[MultiCamera] Error parsing data channel message:', error);
        }
      };

      dataChannel.onerror = (error) => {
        console.error(`[MultiCamera] Data channel error for ${peerId}:`, error);
      };
    }
  }

  // Handle data channel messages (camera metadata, controls)
  private handleDataChannelMessage(peerId: string, message: any): void {
    const connectionId = `external_${peerId}`;
    const camera = this.cameras.get(connectionId);

    if (!camera) return;

    switch (message.type) {
      case 'metadata':
        camera.metadata = {
          ...camera.metadata,
          ...message.data
        };
        this.cameras.set(connectionId, camera);
        this.emit('cameraMetadataUpdated', { cameraId: connectionId, metadata: camera.metadata });
        break;

      case 'quality-changed':
        camera.quality = message.quality;
        this.cameras.set(connectionId, camera);
        this.emit('cameraQualityChanged', { cameraId: connectionId, quality: message.quality });
        break;

      case 'status':
        camera.status = message.status;
        camera.lastSeen = Date.now();
        this.cameras.set(connectionId, camera);
        this.emit('cameraStatusChanged', { cameraId: connectionId, status: message.status });
        break;
    }
  }

  // Switch to a different camera
  async switchToCamera(cameraId: string): Promise<MediaStream | null> {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error('Camera not found');
    }

    if (camera.status !== 'connected' || !camera.stream) {
      throw new Error('Camera not connected or no stream available');
    }

    try {
      console.log(`[MultiCamera] Switching to camera: ${camera.name}`);

      // Deactivate current camera
      if (this.activeCamera) {
        const currentCamera = this.cameras.get(this.activeCamera);
        if (currentCamera) {
          currentCamera.isActive = false;
          this.cameras.set(this.activeCamera, currentCamera);
        }
      }

      // Activate new camera
      camera.isActive = true;
      this.activeCamera = cameraId;
      this.cameras.set(cameraId, camera);

      this.emit('cameraActivated', { cameraId, camera });
      console.log(`[MultiCamera] Switched to camera: ${camera.name}`);

      return camera.stream;
    } catch (error) {
      console.error('[MultiCamera] Error switching camera:', error);
      throw error;
    }
  }

  // Send control command to external camera
  async sendCameraControl(cameraId: string, command: string, params?: any): Promise<void> {
    const camera = this.cameras.get(cameraId);
    if (!camera || camera.type === 'local') {
      throw new Error('Invalid camera for remote control');
    }

    const connection = this.connections.get(cameraId);
    if (!connection || !connection.dataChannel) {
      throw new Error('No data channel available for camera control');
    }

    try {
      const message = {
        type: 'control',
        command,
        params,
        timestamp: Date.now()
      };

      connection.dataChannel.send(JSON.stringify(message));
      console.log(`[MultiCamera] Sent control command to ${camera.name}: ${command}`);
    } catch (error) {
      console.error('[MultiCamera] Error sending camera control:', error);
      throw error;
    }
  }

  // Get all available cameras
  getCameras(): CameraSource[] {
    return Array.from(this.cameras.values());
  }

  // Get active camera
  getActiveCamera(): CameraSource | null {
    if (!this.activeCamera) return null;
    return this.cameras.get(this.activeCamera) || null;
  }

  // Get camera by ID
  getCamera(cameraId: string): CameraSource | null {
    return this.cameras.get(cameraId) || null;
  }

  // Disconnect camera
  async disconnectCamera(cameraId: string): Promise<void> {
    const camera = this.cameras.get(cameraId);
    if (!camera) return;

    try {
      console.log(`[MultiCamera] Disconnecting camera: ${camera.name}`);

      // Stop stream
      if (camera.stream) {
        camera.stream.getTracks().forEach(track => track.stop());
      }

      // Close WebRTC connection for external cameras
      if (camera.type === 'external') {
        const connection = this.connections.get(cameraId);
        if (connection) {
          connection.connection.close();
          this.connections.delete(cameraId);
        }
      }

      // Update camera status
      camera.status = 'disconnected';
      camera.stream = undefined;
      camera.isActive = false;

      if (this.activeCamera === cameraId) {
        this.activeCamera = null;
      }

      this.cameras.set(cameraId, camera);
      this.emit('cameraDisconnected', { cameraId, camera });

      console.log(`[MultiCamera] Camera disconnected: ${camera.name}`);
    } catch (error) {
      console.error('[MultiCamera] Error disconnecting camera:', error);
      throw error;
    }
  }

  // Remove camera completely
  removeCamera(cameraId: string): void {
    const camera = this.cameras.get(cameraId);
    if (!camera) return;

    this.disconnectCamera(cameraId);
    this.cameras.delete(cameraId);
    this.emit('cameraRemoved', { cameraId });
  }

  // Get connection statistics
  async getConnectionStats(cameraId: string): Promise<RTCStatsReport | null> {
    const connection = this.connections.get(cameraId);
    if (!connection) return null;

    try {
      return await connection.connection.getStats();
    } catch (error) {
      console.error('[MultiCamera] Error getting connection stats:', error);
      return null;
    }
  }

  // Monitor camera health
  startHealthMonitoring(): void {
    setInterval(() => {
      this.checkCameraHealth();
    }, 5000); // Check every 5 seconds
  }

  private checkCameraHealth(): void {
    const now = Date.now();
    const timeout = 30000; // 30 seconds timeout

    for (const [cameraId, camera] of this.cameras.entries()) {
      if (camera.status === 'connected' && camera.lastSeen) {
        if (now - camera.lastSeen > timeout) {
          console.warn(`[MultiCamera] Camera timeout: ${camera.name}`);
          camera.status = 'error';
          this.cameras.set(cameraId, camera);
          this.emit('cameraTimeout', { cameraId, camera });
        }
      }
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[MultiCamera] Event callback error for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private sendSignalingMessage(peerId: string, message: any): void {
    // This would send the message through your WebSocket server
    // Implementation depends on your signaling server setup
    console.log(`[MultiCamera] Sending signaling message to ${peerId}:`, message.type);
  }

  // Cleanup
  cleanup(): void {
    console.log('[MultiCamera] Cleaning up multi-camera service...');

    // Disconnect all cameras
    for (const cameraId of this.cameras.keys()) {
      this.disconnectCamera(cameraId);
    }

    // Clear all data
    this.cameras.clear();
    this.connections.clear();
    this.listeners.clear();
    this.activeCamera = null;
    this.isInitialized = false;

    console.log('[MultiCamera] Cleanup complete');
  }
}

// Create singleton instance
export const multiCameraService = new MultiCameraService();
