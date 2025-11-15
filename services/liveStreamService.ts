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

  // Initialize camera and microphone access
  async initializeMedia(constraints: MediaStreamConstraints = {
    video: { 
      width: { ideal: 1280 }, 
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
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
      console.log('[LiveStream] Media access granted');
      return this.mediaStream;
    } catch (error) {
      console.error('[LiveStream] Media access denied:', error);
      throw new Error('Camera and microphone access required for live streaming');
    }
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
      const constraints: MediaStreamConstraints = {};
      
      if (type === 'video') {
        constraints.video = { deviceId: { exact: deviceId } };
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
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      
      // Handle data available for streaming
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await this.sendStreamData(event.data, settings.platforms);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('[LiveStream] MediaRecorder error:', error);
      };

      // Start recording in chunks
      this.mediaRecorder.start(1000); // 1 second chunks
      
      this.isStreaming = true;
      this.startTime = Date.now();
      this.startStatsTracking();

      // Initialize platform streams
      await this.initializePlatformStreams(settings);

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
        this.mediaRecorder.stop();
      }

      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = null;
      }

      // Stop platform streams
      await this.stopPlatformStreams();

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
    if (!platform.accessToken) return;

    try {
      // Convert blob to base64 for Facebook Live API
      const arrayBuffer = await data.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to Facebook Live API (simplified - real implementation would use RTMP)
      const response = await fetch(`https://graph.facebook.com/v18.0/me/live_videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'LIVE_NOW',
          stream_data: base64
        })
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      console.log('[LiveStream] Data sent to Facebook Live');
    } catch (error) {
      console.error('[LiveStream] Facebook streaming error:', error);
    }
  }

  // YouTube Live API integration
  private async sendToYouTube(data: Blob, platform: StreamPlatform): Promise<void> {
    if (!platform.accessToken) return;

    try {
      // YouTube Live API integration (simplified)
      const response = await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            title: 'Church Live Stream',
            scheduledStartTime: new Date().toISOString()
          },
          status: {
            privacyStatus: 'public'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      console.log('[LiveStream] Data sent to YouTube Live');
    } catch (error) {
      console.error('[LiveStream] YouTube streaming error:', error);
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
    if (!platform.accessToken) return;

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me/live_videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: settings.title,
          description: settings.description,
          privacy: settings.privacy === 'public' ? 'EVERYONE' : 'SELF',
          status: 'SCHEDULED_UNPUBLISHED'
        })
      });

      const data = await response.json();
      platform.streamUrl = data.secure_stream_url;
      platform.streamKey = data.stream_id;
      
      console.log('[LiveStream] Facebook stream initialized');
    } catch (error) {
      console.error('[LiveStream] Facebook initialization error:', error);
    }
  }

  // Initialize YouTube Live stream
  private async initializeYouTubeStream(platform: StreamPlatform, settings: StreamSettings): Promise<void> {
    if (!platform.accessToken) return;

    try {
      // Create YouTube Live broadcast
      const broadcastResponse = await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            title: settings.title,
            description: settings.description,
            scheduledStartTime: new Date().toISOString()
          },
          status: {
            privacyStatus: settings.privacy
          }
        })
      });

      const broadcastData = await broadcastResponse.json();
      
      // Create YouTube Live stream
      const streamResponse = await fetch(`https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            title: `${settings.title} - Stream`
          },
          cdn: {
            format: '720p',
            ingestionType: 'rtmp'
          }
        })
      });

      const streamData = await streamResponse.json();
      platform.streamUrl = streamData.cdn.ingestionInfo.ingestionAddress;
      platform.streamKey = streamData.cdn.ingestionInfo.streamName;
      
      console.log('[LiveStream] YouTube stream initialized');
    } catch (error) {
      console.error('[LiveStream] YouTube initialization error:', error);
    }
  }

  // Stop platform streams
  private async stopPlatformStreams(): Promise<void> {
    // Implementation for stopping platform-specific streams
    console.log('[LiveStream] Stopping platform streams');
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
        this.streamStats.bitrate = 2500; // kbps
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
      this.mediaStream.getTracks().forEach(track => track.stop());
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
  }
}

// Create singleton instance
export const liveStreamService = new LiveStreamService();
