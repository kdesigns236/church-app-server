import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, MicrophoneIcon, StopIcon, SettingsIcon, ArrowLeftIcon } from '../constants/icons';

interface CameraClientState {
  status: 'connecting' | 'connected' | 'streaming' | 'disconnected' | 'error';
  sessionId: string | null;
  stream: MediaStream | null;
  connection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  error: string | null;
}

interface CameraSettings {
  resolution: '480p' | '720p' | '1080p';
  frameRate: 15 | 30 | 60;
  facingMode: 'user' | 'environment';
  quality: 'low' | 'medium' | 'high';
}

const CameraClientPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clientState, setClientState] = useState<CameraClientState>({
    status: 'disconnected',
    sessionId: null,
    stream: null,
    connection: null,
    dataChannel: null,
    error: null
  });

  const [settings, setSettings] = useState<CameraSettings>({
    resolution: '720p',
    frameRate: 30,
    facingMode: 'environment',
    quality: 'high'
  });

  const [showSettings, setShowSettings] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize on component mount
  useEffect(() => {
    initializeClient();
    detectDeviceInfo();
    
    return () => {
      cleanup();
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && clientState.stream) {
      videoRef.current.srcObject = clientState.stream;
    }
  }, [clientState.stream]);

  // Initialize camera client
  const initializeClient = async () => {
    try {
      // Get session ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      if (!sessionId) {
        throw new Error('No session ID provided');
      }

      setClientState(prev => ({
        ...prev,
        sessionId,
        status: 'connecting'
      }));

      // Initialize camera
      await initializeCamera();
      
      // Connect to streaming server
      await connectToServer(sessionId);
      
    } catch (error) {
      console.error('[CameraClient] Initialization failed:', error);
      setClientState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  };

  // Initialize camera stream
  const initializeCamera = async () => {
    try {
      const constraints = getMediaConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setClientState(prev => ({
        ...prev,
        stream
      }));

      console.log('[CameraClient] Camera initialized');
    } catch (error) {
      throw new Error('Failed to access camera. Please grant camera permissions.');
    }
  };

  // Get media constraints based on settings
  const getMediaConstraints = (): MediaStreamConstraints => {
    const resolutionMap = {
      '480p': { width: 640, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 }
    };

    return {
      video: {
        ...resolutionMap[settings.resolution],
        frameRate: settings.frameRate,
        facingMode: settings.facingMode
      },
      audio: true
    };
  };

  // Connect to streaming server via WebRTC
  const connectToServer = async (sessionId: string) => {
    try {
      const connection = new RTCPeerConnection(rtcConfig);
      
      // Set up connection event handlers
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            sessionId
          });
        }
      };

      connection.onconnectionstatechange = () => {
        console.log('[CameraClient] Connection state:', connection.connectionState);
        
        if (connection.connectionState === 'connected') {
          setClientState(prev => ({
            ...prev,
            status: 'connected'
          }));
        } else if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
          setClientState(prev => ({
            ...prev,
            status: 'disconnected'
          }));
        }
      };

      // Create data channel for control messages
      const dataChannel = connection.createDataChannel('camera-control', {
        ordered: true
      });

      dataChannel.onopen = () => {
        console.log('[CameraClient] Data channel opened');
        sendDeviceInfo();
      };

      dataChannel.onmessage = (event) => {
        handleControlMessage(JSON.parse(event.data));
      };

      // Add stream to connection
      if (clientState.stream) {
        clientState.stream.getTracks().forEach(track => {
          connection.addTrack(track, clientState.stream!);
        });
      }

      // Create offer
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      // Send offer to server
      const answer = await sendOfferToServer(sessionId, offer);
      await connection.setRemoteDescription(answer);

      setClientState(prev => ({
        ...prev,
        connection,
        dataChannel
      }));

      console.log('[CameraClient] Connected to server');
    } catch (error) {
      throw new Error('Failed to connect to streaming server');
    }
  };

  // Send offer to server and get answer
  const sendOfferToServer = async (sessionId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
    try {
      const response = await fetch('/api/camera/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          offer,
          deviceInfo
        })
      });

      if (!response.ok) {
        throw new Error('Server rejected connection');
      }

      const { answer } = await response.json();
      return answer;
    } catch (error) {
      throw new Error('Failed to communicate with server');
    }
  };

  // Send signaling message
  const sendSignalingMessage = async (message: any) => {
    try {
      await fetch('/api/camera/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('[CameraClient] Signaling error:', error);
    }
  };

  // Handle control messages from server
  const handleControlMessage = (message: any) => {
    console.log('[CameraClient] Received control message:', message);
    
    switch (message.command) {
      case 'change-quality':
        changeQuality(message.params.quality);
        break;
      case 'switch-camera':
        switchCamera();
        break;
      case 'start-streaming':
        startStreaming();
        break;
      case 'stop-streaming':
        stopStreaming();
        break;
    }
  };

  // Send device info to server
  const sendDeviceInfo = () => {
    if (clientState.dataChannel && deviceInfo) {
      const message = {
        type: 'metadata',
        data: {
          ...deviceInfo,
          settings,
          timestamp: Date.now()
        }
      };

      clientState.dataChannel.send(JSON.stringify(message));
    }
  };

  // Detect device information
  const detectDeviceInfo = () => {
    const info = {
      deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' :
                  navigator.userAgent.includes('Android') ? 'Android Phone' :
                  navigator.userAgent.includes('iPad') ? 'iPad' : 'Mobile Device',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
               navigator.userAgent.includes('Safari') ? 'Safari' :
               navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Unknown',
      os: navigator.userAgent.includes('iOS') ? 'iOS' :
          navigator.userAgent.includes('Android') ? 'Android' :
          navigator.userAgent.includes('Windows') ? 'Windows' : 'Unknown',
      screenSize: `${screen.width}x${screen.height}`,
      networkQuality: 'good' // Would be detected based on connection speed
    };

    setDeviceInfo(info);
  };

  // Start streaming
  const startStreaming = () => {
    setClientState(prev => ({
      ...prev,
      status: 'streaming'
    }));

    // Send status update
    if (clientState.dataChannel) {
      clientState.dataChannel.send(JSON.stringify({
        type: 'status',
        status: 'streaming'
      }));
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    setClientState(prev => ({
      ...prev,
      status: 'connected'
    }));

    // Send status update
    if (clientState.dataChannel) {
      clientState.dataChannel.send(JSON.stringify({
        type: 'status',
        status: 'connected'
      }));
    }
  };

  // Change camera quality
  const changeQuality = async (quality: 'low' | 'medium' | 'high') => {
    try {
      setSettings(prev => ({ ...prev, quality }));
      
      // Restart camera with new settings
      if (clientState.stream) {
        clientState.stream.getTracks().forEach(track => track.stop());
      }
      
      await initializeCamera();
      
      // Send quality change notification
      if (clientState.dataChannel) {
        clientState.dataChannel.send(JSON.stringify({
          type: 'quality-changed',
          quality
        }));
      }
    } catch (error) {
      console.error('[CameraClient] Error changing quality:', error);
    }
  };

  // Switch between front and back camera
  const switchCamera = async () => {
    try {
      const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';
      setSettings(prev => ({ ...prev, facingMode: newFacingMode }));
      
      // Restart camera with new facing mode
      if (clientState.stream) {
        clientState.stream.getTracks().forEach(track => track.stop());
      }
      
      await initializeCamera();
      
      console.log('[CameraClient] Camera switched to:', newFacingMode);
    } catch (error) {
      console.error('[CameraClient] Error switching camera:', error);
    }
  };

  // Apply new settings
  const applySettings = async () => {
    try {
      if (clientState.stream) {
        clientState.stream.getTracks().forEach(track => track.stop());
      }
      
      await initializeCamera();
      setShowSettings(false);
      
      console.log('[CameraClient] Settings applied:', settings);
    } catch (error) {
      console.error('[CameraClient] Error applying settings:', error);
    }
  };

  // Cleanup
  const cleanup = () => {
    if (clientState.stream) {
      clientState.stream.getTracks().forEach(track => track.stop());
    }
    
    if (clientState.connection) {
      clientState.connection.close();
    }
  };

  // Disconnect from server
  const disconnect = () => {
    cleanup();
    setClientState({
      status: 'disconnected',
      sessionId: null,
      stream: null,
      connection: null,
      dataChannel: null,
      error: null
    });
  };

  const getStatusColor = () => {
    switch (clientState.status) {
      case 'connected': return 'bg-green-500';
      case 'streaming': return 'bg-red-500 animate-pulse';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (clientState.status) {
      case 'connected': return 'Connected';
      case 'streaming': return 'LIVE';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CameraIcon className="w-6 h-6 text-blue-400" />
          <h1 className="text-lg font-semibold">Camera Client</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative">
        {clientState.error ? (
          <div className="flex items-center justify-center h-full bg-red-900/20">
            <div className="text-center p-6">
              <div className="text-red-400 mb-4">
                <CameraIcon className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
              <p className="text-gray-300 mb-4">{clientState.error}</p>
              <button
                onClick={initializeClient}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Stream overlay */}
            {clientState.status === 'streaming' && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
            
            {/* Settings overlay */}
            {showSettings && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-lg p-6 w-full max-w-sm">
                  <h3 className="text-lg font-semibold mb-4">Camera Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Resolution</label>
                      <select
                        value={settings.resolution}
                        onChange={(e) => setSettings(prev => ({ ...prev, resolution: e.target.value as any }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                      >
                        <option value="480p">480p (640x480)</option>
                        <option value="720p">720p (1280x720)</option>
                        <option value="1080p">1080p (1920x1080)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Frame Rate</label>
                      <select
                        value={settings.frameRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, frameRate: parseInt(e.target.value) as any }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                      >
                        <option value={15}>15 FPS</option>
                        <option value={30}>30 FPS</option>
                        <option value={60}>60 FPS</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Camera</label>
                      <select
                        value={settings.facingMode}
                        onChange={(e) => setSettings(prev => ({ ...prev, facingMode: e.target.value as any }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                      >
                        <option value="environment">Back Camera</option>
                        <option value="user">Front Camera</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applySettings}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={switchCamera}
            disabled={clientState.status !== 'connected' && clientState.status !== 'streaming'}
            className="bg-gray-700 p-3 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CameraIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            disabled={clientState.status === 'streaming'}
            className="bg-gray-700 p-3 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={disconnect}
            className="bg-red-600 p-3 rounded-full hover:bg-red-700 transition-colors"
          >
            <StopIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Device Info */}
        {deviceInfo && (
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>{deviceInfo.deviceName} • {settings.resolution} • {settings.frameRate}fps</p>
            <p>Session: {clientState.sessionId?.slice(0, 8)}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraClientPage;
