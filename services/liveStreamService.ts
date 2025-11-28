// Live Streaming Service for Facebook Live and YouTube Live
export interface StreamPlatform {
  name: 'facebook' | 'youtube';
  displayName: string;
  isConnected: boolean;
  streamKey?: string;
  streamUrl?: string;
  accessToken?: string;
}

export interface StreamSettings {
  title: string;
  description: string;
  privacy: 'public' | 'private' | 'unlisted';
  platforms: StreamPlatform[];
}

export interface StreamStats {
  viewers: number;
  duration: string;
  bitrate: number;
  resolution: string;
}

// Base URL for the streaming bridge (Node sync server).
// Prefer VITE_SYNC_SERVER_URL; otherwise fall back to VITE_API_URL (without /api)
// and finally to the deployed Render server URL. This avoids hitting localhost:3001
// in production builds on real devices.
const STREAM_API_BASE =
  ((import.meta as any).env?.VITE_SYNC_SERVER_URL as string | undefined) ||
  (((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '')) ||
  'https://church-app-server.onrender.com';

const buildStreamUrl = (path: string): string => {
  const base = STREAM_API_BASE.replace(/\/+$/, '');
  return `${base}${path}`;
};

class LiveStreamService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isStreaming = false;
  private streamStats: StreamStats = {
    viewers: 0,
    duration: '00:00:00',
    bitrate: 0,
    resolution: '1280x720'
  };
  private startTime: number = 0;
  private statsInterval: NodeJS.Timeout | null = null;
  private ownsStream: boolean = true;
  private activePlatforms: StreamPlatform[] = [];

  // Initialize camera and microphone access
  async initializeMedia(constraints: MediaStreamConstraints = {
    video: { 
      // Request a lower resolution (480p) to reduce CPU and bandwidth requirements.
      width: { ideal: 854 }, 
      height: { ideal: 480 },
      frameRate: { ideal: 24, max: 30 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }): Promise<MediaStream> {
    try {
      console.log('[LiveStream] Requesting media access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.ownsStream = true;
      console.log('[LiveStream] Media access granted');
      return this.mediaStream;
    } catch (error) {
      console.error('[LiveStream] Media access denied:', error);
      throw new Error('Camera and microphone access required for live streaming');
    }
  }

  attachExternalStream(stream: MediaStream): void {
    this.mediaStream = stream;
    this.ownsStream = false;

    const tracks = stream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', ');
    console.log('[LiveStream] attachExternalStream with tracks:', tracks);
  }

  // Get available video/audio devices
  async getAvailableDevices(): Promise<{
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        videoDevices: devices.filter(device => device.kind === 'videoinput'),
        audioDevices: devices.filter(device => device.kind === 'audioinput')
      };
    } catch (error) {
      console.error('[LiveStream] Error getting devices:', error);
      return { videoDevices: [], audioDevices: [] };
    }
  }

  // Switch camera/microphone
  async switchDevice(deviceId: string, type: 'video' | 'audio'): Promise<void> {
    if (!this.mediaStream) return;

    try {
      const constraints: MediaStreamConstraints = {
        // Request a lower resolution (480p) to reduce CPU and bandwidth requirements.
        video: {
          width: { ideal: 854 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: true,
      };

      if (type === 'video') {
        constraints.video = { 
          width: { ideal: 854 }, 
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 }
        };
        constraints.audio = true; // Keep existing audio
      } else {
        constraints.audio = { deviceId: { exact: deviceId } };
        constraints.video = true; // Keep existing video
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Replace tracks in existing stream
      const tracks = this.mediaStream.getTracks();
      tracks.forEach(track => {
        if (track.kind === type) {
          track.stop();
          this.mediaStream!.removeTrack(track);
        }
      });

      const newTracks = newStream.getTracks();
      newTracks.forEach(track => {
        if (track.kind === type) {
          this.mediaStream!.addTrack(track);
        }
      });

      console.log(`[LiveStream] Switched ${type} device`);
    } catch (error) {
      console.error(`[LiveStream] Error switching ${type} device:`, error);
      throw error;
    }
  }

  // Start streaming to platforms
  async startStream(settings: StreamSettings): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('Media stream not initialized');
    }

    if (this.isStreaming) {
      throw new Error('Stream already active');
    }

    try {
      console.log('[LiveStream] Starting stream...', settings);
      
      // Create MediaRecorder for streaming
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp8,opus',
        // Target an even lower, more stable bitrate for slow upload
        // connections: ~700 kbps video + 64 kbps audio.
        videoBitsPerSecond: 400000,
        audioBitsPerSecond: 64000,
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      console.log('[LiveStream] MediaRecorder created with state:', this.mediaRecorder.state);

      // Handle data available for streaming
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await this.sendStreamData(event.data, settings.platforms);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('[LiveStream] MediaRecorder error:', error);
      };

      this.mediaRecorder.onstart = () => {
        console.log('[LiveStream] MediaRecorder started, state:', this.mediaRecorder?.state);
      };

      this.mediaRecorder.onstop = (event) => {
        console.log('[LiveStream] MediaRecorder stopped, state:', this.mediaRecorder?.state, 'event:', event);
      };

      // Initialize platform streams (Facebook bridge, YouTube, etc.)
      // BEFORE starting the recorder so the first WebM chunk with the
      // EBML header is sent to ffmpeg and not dropped.
      this.activePlatforms = settings.platforms;
      await this.initializePlatformStreams(settings);

      // Start recording in chunks once streams are ready
      this.mediaRecorder.start(1000); // 1 second chunks
      
      this.isStreaming = true;
      this.startTime = Date.now();
      this.startStatsTracking();

      console.log('[LiveStream] Stream started successfully');
    } catch (error) {
      console.error('[LiveStream] Error starting stream:', error);
      throw error;
    }
  }

  // Stop streaming
  async stopStream(): Promise<void> {
    try {
      console.log('[LiveStream] Stopping stream...');
      
      if (this.mediaRecorder && this.isStreaming) {
        console.log('[LiveStream] Stopping MediaRecorder, current state:', this.mediaRecorder.state);
        this.mediaRecorder.stop();
      }

      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
      }

      // Stop platform streams
      await this.stopPlatformStreams();

      this.activePlatforms = [];

      this.isStreaming = false;
      console.log('[LiveStream] Stream stopped');
    } catch (error) {
      console.error('[LiveStream] Error stopping stream:', error);
      throw error;
    }
  }

  // Send stream data to platforms
  private async sendStreamData(data: Blob, platforms: StreamPlatform[]): Promise<void> {
    const enabledPlatforms = platforms.filter(p => p.isConnected);
    
    for (const platform of enabledPlatforms) {
      try {
        if (platform.name === 'facebook') {
          await this.sendToFacebook(data, platform);
        } else if (platform.name === 'youtube') {
          await this.sendToYouTube(data, platform);
        }
      } catch (error) {
        console.error(`[LiveStream] Error sending to ${platform.name}:`, error);
      }
    }
  }

  // Facebook Live API integration
  private async sendToFacebook(data: Blob, platform: StreamPlatform): Promise<void> {
    // For the RTMP bridge, we send each MediaRecorder chunk to the
    // backend bridge, which forwards data into ffmpeg.
    const streamId = platform.streamKey;
    if (!streamId) {
      console.warn('[LiveStream] Missing Facebook streamId (streamKey)');
      return;
    }

    try {
      const response = await fetch(buildStreamUrl(`/api/facebook/live/chunk/${encodeURIComponent(streamId)}`), {
        method: 'POST',
        body: data
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[LiveStream] Facebook chunk POST failed', response.status, body);
      }
    } catch (error) {
      console.error('[LiveStream] Facebook streaming error via bridge:', error);
    }
  }

  // YouTube Live API integration
  private async sendToYouTube(data: Blob, platform: StreamPlatform): Promise<void> {
    // For the RTMP bridge, we send each MediaRecorder chunk to the
    // backend bridge, which forwards data into ffmpeg.
    const streamId = platform.streamKey;
    if (!streamId) {
      console.warn('[LiveStream] Missing YouTube streamId (streamKey)');
      return;
    }

    try {
      const response = await fetch(buildStreamUrl(`/api/youtube/live/chunk/${encodeURIComponent(streamId)}`), {
        method: 'POST',
        body: data
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[LiveStream] YouTube chunk POST failed', response.status, body);
      }
    } catch (error) {
      console.error('[LiveStream] YouTube streaming error via bridge:', error);
    }
  }

  // Initialize platform-specific streams
  private async initializePlatformStreams(settings: StreamSettings): Promise<void> {
    for (const platform of settings.platforms) {
      if (platform.isConnected) {
        try {
          if (platform.name === 'facebook') {
            await this.initializeFacebookStream(platform, settings);
          } else if (platform.name === 'youtube') {
            await this.initializeYouTubeStream(platform, settings);
          }
        } catch (error) {
          console.error(`[LiveStream] Error initializing ${platform.name}:`, error);
        }
      }
    }
  }

  // Initialize Facebook Live stream
  private async initializeFacebookStream(platform: StreamPlatform, settings: StreamSettings): Promise<void> {
    try {
      const response = await fetch(buildStreamUrl('/api/facebook/live/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: settings.title,
          description: settings.description,
          privacy: settings.privacy
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[LiveStream] Facebook bridge /start failed', response.status, body);
        return;
      }

      const data = await response.json();
      platform.streamUrl = data.secureStreamUrl || data.streamUrl;
      platform.streamKey = data.streamId;

      console.log('[LiveStream] Facebook bridge stream initialized', data.streamId);
    } catch (error) {
      console.error('[LiveStream] Facebook initialization error via bridge:', error);
    }
  }

  // Initialize YouTube Live stream
  private async initializeYouTubeStream(platform: StreamPlatform, settings: StreamSettings): Promise<void> {
    try {
      const response = await fetch(buildStreamUrl('/api/youtube/live/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: settings.title,
          description: settings.description,
          privacy: settings.privacy
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[LiveStream] YouTube bridge /start failed', response.status, body);
        return;
      }

      const data = await response.json();
      platform.streamUrl = data.rtmpUrl;
      platform.streamKey = data.streamId;

      console.log('[LiveStream] YouTube bridge stream initialized', data.streamId);
    } catch (error) {
      console.error('[LiveStream] YouTube initialization error via bridge:', error);
    }
  }

  // Stop platform streams
  private async stopPlatformStreams(): Promise<void> {
    console.log('[LiveStream] Stopping platform streams');

    const platforms = this.activePlatforms || [];
    for (const platform of platforms) {
      if (platform.name === 'facebook' && platform.streamKey) {
        try {
          await fetch(buildStreamUrl('/api/facebook/live/stop'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ streamId: platform.streamKey })
          });
        } catch (error) {
          console.error('[LiveStream] Error stopping Facebook stream via bridge:', error);
        }
      } else if (platform.name === 'youtube' && platform.streamKey) {
        try {
          await fetch(buildStreamUrl('/api/youtube/live/stop'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ streamId: platform.streamKey })
          });
        } catch (error) {
          console.error('[LiveStream] Error stopping YouTube stream via bridge:', error);
        }
      }
    }
  }

  // Start tracking stream statistics
  private startStatsTracking(): void {
    this.statsInterval = setInterval(() => {
      if (this.isStreaming) {
        const elapsed = Date.now() - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        this.streamStats.duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update other stats (would come from actual streaming metrics)
        this.streamStats.viewers = Math.floor(Math.random() * 100); // Mock data
        this.streamStats.bitrate = 2000; // kbps (approximate target bitrate)
      }
    }, 1000);
  }

  // Get current stream statistics
  getStreamStats(): StreamStats {
    return { ...this.streamStats };
  }

  // Check if currently streaming
  getIsStreaming(): boolean {
    return this.isStreaming;
  }

  // Get current media stream
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  // Clean up resources
  cleanup(): void {
    if (this.mediaStream) {
      if (this.ownsStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }
      this.mediaStream = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    this.isStreaming = false;
    this.ownsStream = true;
  }
}

// Create singleton instance
export const liveStreamService = new LiveStreamService();
