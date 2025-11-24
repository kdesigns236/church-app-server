import React, { useRef, useEffect, useState } from 'react';
import { FaVideo, FaSyncAlt } from 'react-icons/fa';

interface MobileCameraProps {
  slotId: number;
}

const MobileCamera: React.FC<MobileCameraProps> = ({ slotId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [hardwareZoom, setHardwareZoom] = useState(false);
  const [gimbalAssist, setGimbalAssist] = useState(true);


  const setupZoomForStream = (newStream: MediaStream) => {
    const track = newStream.getVideoTracks()[0];
    videoTrackRef.current = track || null;


    if (track && (track as any).getCapabilities) {
      try {
        const caps = (track as any).getCapabilities();
        if (caps && caps.zoom) {
          const min = caps.zoom.min ?? 1;
          const max = caps.zoom.max ?? 5;
          const step = caps.zoom.step ?? 0.1;
          setHardwareZoom(true);
          setZoomSupported(true);
          setZoomRange({ min, max, step });
          const settings = (track as any).getSettings?.() || {};
          const initialZoom =
            (settings as any).zoom ??
            (caps.zoom.default ?? min);
          setZoom(initialZoom);
          (track as any)
            .applyConstraints({ advanced: [{ zoom: initialZoom }] })
            .catch((err: any) => console.warn('Failed to apply initial zoom on MobileCamera', err));
          return;
        } else {
          setHardwareZoom(false);
          setZoomSupported(true);
          const min = 1;
          const max = 3;
          const step = 0.1;
          setZoomRange({ min, max, step });
          setZoom(1);
          return;
        }
      } catch (err) {
        console.warn('Zoom not supported on this mobile camera.', err);
        setHardwareZoom(false);
        setZoomSupported(true);
        const min = 1;
        const max = 3;
        const step = 0.1;
        setZoomRange({ min, max, step });
        setZoom(1);
        return;
      }
    }


    setHardwareZoom(false);
    setZoomSupported(true);
    const min = 1;
    const max = 3;
    const step = 0.1;
    setZoomRange({ min, max, step });
    setZoom(1);
  };

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
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: true
      });

      setStream(newStream);
      setIsConnected(true);
      setupZoomForStream(newStream);
      
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


  const applyZoom = (value: number) => {
    setZoom(value);
    const track: any = videoTrackRef.current as any;
    if (!hardwareZoom || !track || !track.applyConstraints) return;
    track
      .applyConstraints({ advanced: [{ zoom: value }] })
      .catch((err: any) => console.warn('Failed to apply zoom on MobileCamera', err));
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

  const videoStyle: React.CSSProperties = {};
  if (!hardwareZoom && zoom !== null && zoom > 1) {
    videoStyle.transform = `scale(${zoom})`;
    videoStyle.transformOrigin = 'center center';
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/95 p-4 flex items-center justify-between shadow-lg shadow-black/40 border-b border-white/5 backdrop-blur-sm">
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
            style={videoStyle}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaVideo className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400">Camera not active</p>
            </div>
          </div>
        )}

        {gimbalAssist && (
          <div className="absolute inset-6 pointer-events-none">
            <div className="absolute inset-0 border border-white/15 rounded-xl" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/25 rounded-full" />
            <div className="absolute top-1/2 left-8 right-8 border-t border-white/15" />
          </div>
        )}

        {/* Camera overlay info */}
        {isConnected && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-red-500/40 shadow-[0_0_18px_rgba(248,113,113,0.85)]">
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
            className="absolute top-4 right-4 p-3 rounded-full bg-gradient-to-tr from-blue-500/85 to-indigo-500/85 backdrop-blur-sm border border-white/20 shadow-[0_0_26px_rgba(59,130,246,0.95)] hover:shadow-[0_0_34px_rgba(59,130,246,1)] hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <FaSyncAlt className="w-6 h-6 text-white" />
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
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-[0_0_24px_rgba(16,185,129,0.85)] hover:shadow-[0_0_32px_rgba(16,185,129,1)] disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200"
          >
            {isConnected ? 'Camera Active' : 'Start Camera'}
          </button>
          <button
            onClick={stopCamera}
            disabled={!isConnected}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_24px_rgba(248,113,113,0.9)] hover:shadow-[0_0_32px_rgba(248,113,113,1)] disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200"
          >
            Stop Camera
          </button>
        </div>

        {zoomSupported && zoomRange && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-semibold">Zoom</span>
              {zoom !== null && (
                <span className="text-gray-300">{zoom.toFixed(1)}x</span>
              )}
            </div>
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={zoom ?? zoomRange.min}
              onChange={e => applyZoom(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Gimbal Assist Overlay</span>
          <button
            onClick={() => setGimbalAssist(prev => !prev)}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              gimbalAssist
                ? 'bg-blue-600 hover:bg-blue-500 border border-blue-400/70 shadow-[0_0_18px_rgba(37,99,235,0.9)]'
                : 'bg-gray-700 hover:bg-gray-600 border border-white/15'
            }`}
          >
            {gimbalAssist ? 'On' : 'Off'}
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
