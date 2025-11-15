import React, { useRef, useEffect, useState } from 'react';

interface MobileCameraProps {
  slotId: number;
}

const MobileCamera: React.FC<MobileCameraProps> = ({ slotId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      setError('');
      console.log('Starting mobile camera...');
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: true
      });

      setStream(newStream);
      setIsConnected(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      console.log('Mobile camera started successfully');
    } catch (err: any) {
      console.error('Error starting mobile camera:', err);
      setError(`Camera access failed: ${err.message}`);
      setIsConnected(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsConnected(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    // Auto-start camera when component mounts
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Mobile Camera</h1>
          <p className="text-sm text-gray-400">Camera Slot {slotId}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Video Display */}
      <div className="flex-1 relative bg-black">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400">Camera not active</p>
            </div>
          </div>
        )}

        {/* Camera overlay info */}
        {isConnected && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">LIVE</span>
            </div>
          </div>
        )}

        {/* Camera switch button */}
        {isConnected && (
          <button
            onClick={switchCamera}
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-3 rounded-full hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 p-4 m-4 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-gray-900 p-4 space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={startCamera}
            disabled={isConnected}
            className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {isConnected ? 'Camera Active' : 'Start Camera'}
          </button>
          <button
            onClick={stopCamera}
            disabled={!isConnected}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Stop Camera
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">
            Camera Mode: {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
          </p>
          <p className="text-xs text-gray-500">
            To use this as a camera source, share your screen or use screen mirroring to send this video back to the main computer.
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
          <p className="text-blue-200 text-xs font-semibold mb-1">Instructions:</p>
          <p className="text-blue-200 text-xs">
            1. Keep this page open and camera active<br/>
            2. On your main computer, use screen sharing or video capture software<br/>
            3. Select this phone's screen as a video source<br/>
            4. The camera feed will appear in Camera Slot {slotId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileCamera;
