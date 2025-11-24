import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IconVideo, IconFlipCamera, IconX } from './icons';
import { io, Socket } from 'socket.io-client';


interface CameraClientProps {
  sessionId: string;
  slotId: string;
  onExit: () => void;
}


const SIGNALING_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'https://church-app-server.onrender.com';


const RTC_CONFIGURATION = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};


const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const to2 = (v: number) => v.toString().padStart(2, '0');
  return `${to2(hours)}:${to2(minutes)}:${to2(seconds)}`;
};


const CameraClient: React.FC<CameraClientProps> = ({ sessionId, slotId, onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const shortSessionIdRef = useRef<string>('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wakeLockRef = useRef<any>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);


  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [uiVisible, setUiVisible] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resolutionLabel, setResolutionLabel] = useState<string>('');
  const [showOrientationHint, setShowOrientationHint] = useState(true);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [hardwareZoom, setHardwareZoom] = useState(false);
  const [gimbalAssist, setGimbalAssist] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);



  const startWebRTC = useCallback(async (stream: MediaStream) => {
    const socket = socketRef.current;
    if (!socket || !shortSessionIdRef.current) return;
    try {
      peerConnectionRef.current = new RTCPeerConnection(RTC_CONFIGURATION);
      
      stream.getTracks().forEach(track => peerConnectionRef.current?.addTrack(track, stream));
      
      peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
              socket.emit('prostream:signal', {
                  sessionId: shortSessionIdRef.current,
                  type: 'webrtc-candidate',
                  slotId,
                  payload: event.candidate,
                  target: 'controller'
              });
          }
      };
      
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('prostream:signal', {
          sessionId: shortSessionIdRef.current,
          type: 'webrtc-offer',
          slotId,
          payload: offer,
          target: 'controller'
      });
    } catch (err) {
      console.error('Error starting WebRTC connection:', err);
      setError('Failed to establish a video connection with the controller.');
    }
  }, [slotId]);


  const startCamera = useCallback(async () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
    }


    try {
      setError(null);
      const highResConstraints: MediaStreamConstraints = {
        video: {
          facingMode,
          // Target smooth 720p instead of heavier 1080p
          width: { min: 640, ideal: 1280, max: 1280 },
          height: { min: 360, ideal: 720, max: 720 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, max: 30 },
        } as any,
        // Controller sends video-only; audio comes from GoLive PC
        audio: false,
      };


      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(highResConstraints);
      } catch (err) {
        console.warn('High-resolution constraints failed, falling back to default camera settings.', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { min: 640, ideal: 1280 },
            height: { min: 360, ideal: 720 },
            aspectRatio: { ideal: 16 / 9 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });
      }


      streamRef.current = stream;


      const videoTrack = stream.getVideoTracks()[0];
      videoTrackRef.current = videoTrack || null;
      let settings: any = {};


      if (videoTrack && typeof (videoTrack as any).getSettings === 'function') {
        settings = (videoTrack as any).getSettings();
      }


      if (videoTrack && (videoTrack as any).getCapabilities) {
        try {
          const caps = (videoTrack as any).getCapabilities();
          if (caps && caps.zoom) {
            const min = caps.zoom.min ?? 1;
            const max = caps.zoom.max ?? 5;
            const step = caps.zoom.step ?? 0.1;
            setHardwareZoom(true);
            setZoomSupported(true);
            setZoomRange({ min, max, step });
            const initialZoom =
              (settings as any).zoom ??
              (caps.zoom.default ?? min);
            setZoom(initialZoom);
            (videoTrack as any)
              .applyConstraints({ advanced: [{ zoom: initialZoom }] })
              .catch((err: any) => console.warn('Failed to apply initial zoom', err));
          } else {
            setHardwareZoom(false);
            setZoomSupported(true);
            const min = 1;
            const max = 3;
            const step = 0.1;
            setZoomRange({ min, max, step });
            setZoom(1);
          }
        } catch (err) {
          console.warn('Zoom not supported on this camera.', err);
          setHardwareZoom(false);
          setZoomSupported(true);
          const min = 1;
          const max = 3;
          const step = 0.1;
          setZoomRange({ min, max, step });
          setZoom(1);
        }
      } else {
        setHardwareZoom(false);
        setZoomSupported(true);
        const min = 1;
        const max = 3;
        const step = 0.1;
        setZoomRange({ min, max, step });
        setZoom(1);
      }


      if (settings && (settings as any).width && (settings as any).height) {
        const width = (settings as any).width as number;
        const height = (settings as any).height as number;
        let label = `${width}x${height}`;
        if (width >= 3840 || height >= 2160) {
          label += ' (4K)';
        } else if (width >= 1920 || height >= 1080) {
          label += ' (1080p)';
        }
        setResolutionLabel(label);
      } else {
        setResolutionLabel('HD');
      }


      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      if (isStreaming) {
        startWebRTC(stream);
      }


    } catch (err) {
      console.error("Error accessing media devices.", err);
      setError("Could not access camera. Please check permissions and try a different camera mode.");
    }
  }, [facingMode, isStreaming, startWebRTC]);



  useEffect(() => {
    const shortSessionId = (sessionId.split(':')[1] || sessionId).trim();
    shortSessionIdRef.current = shortSessionId;
    const socket = io(SIGNALING_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('prostream:join', { sessionId: shortSessionId, role: 'camera', slotId });


    const handleSignal = async (message: any) => {
        const { type, slotId: msgSlotId, payload, target } = message;
        if (target !== 'camera' || String(msgSlotId) !== String(slotId)) return;


        try {
            if (type === 'webrtc-answer') {
                await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(payload));
            } else if (type === 'webrtc-candidate') {
                await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(payload));
            }
        } catch (err) {
            console.error('Error processing WebRTC message from controller:', err);
        }
    };
    socket.on('prostream:signal', handleSignal);
    
    const handleUnload = () => {
        const s = socketRef.current;
        if (!s || !shortSessionIdRef.current) return;
        s.emit('prostream:signal', { type: 'camera-disconnected', sessionId: shortSessionIdRef.current, slotId });
    };
    window.addEventListener('beforeunload', handleUnload);


    return () => {
        handleUnload();
        peerConnectionRef.current?.close();
        socket.off('prostream:signal', handleSignal);
        socket.disconnect();
        window.removeEventListener('beforeunload', handleUnload);
    };
  }, [sessionId, slotId]);


  useEffect(() => {
    startCamera();
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [startCamera]);


  useEffect(() => {
    const anyNavigator: any = navigator as any;
    let cancelled = false;


    const requestWakeLock = async () => {
      try {
        if (anyNavigator.wakeLock && anyNavigator.wakeLock.request) {
          const sentinel = await anyNavigator.wakeLock.request('screen');
          if (cancelled) {
            await sentinel.release().catch(() => {});
            return;
          }
          wakeLockRef.current = sentinel;
          sentinel.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        }
      } catch (err) {
        console.warn('Screen wake lock not available.', err);
      }
    };


    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock();
      }
    };


    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);


    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    const updateOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setShowOrientationHint(false);
        setUiVisible(true);
      }
    };


    updateOrientation();


    const handleResize = () => updateOrientation();


    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);


    const lockOrientation = async () => {
      try {
        const anyScreen: any = window.screen as any;
        if (anyScreen.orientation && anyScreen.orientation.lock) {
          await anyScreen.orientation.lock('landscape');
        }
      } catch (err) {
        console.warn('Orientation lock not supported.', err);
      }
    };


    lockOrientation();


    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);


  useEffect(() => {
    const start = Date.now();
    setElapsedMs(0);
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);


  const applyZoom = (value: number) => {
    setZoom(value);

    const track: any = videoTrackRef.current as any;
    if (hardwareZoom && track && track.applyConstraints) {
      track
        .applyConstraints({ advanced: [{ zoom: value }] })
        .catch((err: any) => console.warn('Failed to apply zoom value', err));
    }


    if (!hardwareZoom) {
      const socket = socketRef.current;
      if (socket && shortSessionIdRef.current) {
        socket.emit('prostream:signal', {
          sessionId: shortSessionIdRef.current,
          type: 'camera-zoom',
          slotId,
          payload: { zoom: value },
          target: 'controller',
        });
      }
    }
  };


  const startStreaming = () => {
    const stream = streamRef.current;
    setIsStreaming(true);
    if (stream) {
      startWebRTC(stream);
    } else {
      startCamera();
    }
  };


  const stopStreaming = () => {
    setIsStreaming(false);
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (err) {
        console.warn('Error closing peer connection on stopStreaming', err);
      }
      peerConnectionRef.current = null;
    }
  };


  const flipCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };


  const videoStyle: React.CSSProperties = {};
  if (!hardwareZoom && zoom !== null && zoom > 1) {
    videoStyle.transform = `scale(${zoom})`;
    videoStyle.transformOrigin = 'center center';
  }


  return (
    <div
      className="relative h-screen w-screen bg-black flex items-center justify-center text-white font-sans cursor-pointer"
      onClick={() => setUiVisible(true)}
    >
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={videoStyle}></video>
      
      {/* UI Overlay Container */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()} 
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"></div>


        {gimbalAssist && (
          <div className="absolute inset-6 pointer-events-none">
            <div className="absolute inset-0 border border-white/15 rounded-xl" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/25 rounded-full" />
            <div className="absolute top-1/2 left-8 right-8 border-t border-white/15" />
          </div>
        )}


        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
          <div className="flex flex-col items-start space-y-1 p-2 bg-black/40 backdrop-blur-sm rounded-full border border-red-400/40 shadow-[0_0_22px_rgba(248,113,113,0.9)]">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold tracking-wider text-green-300 text-xs uppercase">LIVE</span>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-200">Slot {slotId}</span>
            </div>
            <div className="flex items-center text-[11px] text-gray-300">
              <span>{formatDuration(elapsedMs)}</span>
              {resolutionLabel && (
                <span className="ml-2 opacity-80">{resolutionLabel}</span>
              )}
            </div>
          </div>
          <button
            onClick={onExit}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/20 text-white shadow-[0_0_16px_rgba(15,23,42,0.9)] hover:bg-white/20 active:bg-white/30 transition-all duration-200"
            title="Exit Camera Mode"
            aria-label="Exit Camera Mode"
          >
            <IconX className="w-6 h-6" />
          </button>
        </div>


        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-4 right-4 flex justify-center items-center space-x-5">
            <button
              onClick={isStreaming ? stopStreaming : startStreaming}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isStreaming
                  ? 'bg-red-600/80 border-red-300 shadow-[0_0_34px_rgba(248,113,113,1)] scale-105'
                  : 'bg-gray-600/80 border-gray-300 shadow-[0_0_22px_rgba(148,163,184,0.9)]'
              }`}
              aria-label={isStreaming ? 'Stop camera stream' : 'Start camera stream'}
            >
              <div
                className={`w-12 h-12 rounded-full ${
                  isStreaming
                    ? 'bg-red-500 shadow-[0_0_30px_rgba(248,113,113,1)]'
                    : 'bg-gray-200'
                }`}
              ></div>
            </button>
            <button 
                onClick={flipCamera}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-500/85 to-indigo-500/85 backdrop-blur-md border border-white/25 text-white shadow-[0_0_26px_rgba(59,130,246,1)] hover:shadow-[0_0_34px_rgba(59,130,246,1)] hover:scale-110 active:scale-95 transition-all duration-300"
                aria-label="Flip camera"
            >
                <IconFlipCamera className="w-7 h-7"/>
            </button>
        </div>


        {zoomSupported && zoomRange && (
          <div className="absolute bottom-24 left-4 right-4 max-w-md mx-auto bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-gray-200 mb-2">
              <span className="font-medium">Zoom</span>
              {zoom !== null && (
                <span className="opacity-80">{zoom.toFixed(1)}x</span>
              )}
            </div>
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={zoom ?? zoomRange.min}
              onChange={e => applyZoom(Number(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
        )}


        <div className="absolute bottom-4 left-4">
          <button
            onClick={() => setGimbalAssist(prev => !prev)}
            className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 text-[11px] font-semibold uppercase tracking-wide shadow-[0_0_16px_rgba(148,163,184,0.9)] hover:bg-black/75 transition-colors"
          >
            Gimbal Assist: {gimbalAssist ? 'On' : 'Off'}
          </button>
        </div>
      </div>


      {showOrientationHint && isPortrait && !error && (
        <div
          className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-10 px-6 text-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowOrientationHint(false);
            setUiVisible(true);
          }}
        >
          <h2 className="text-xl font-semibold mb-2">Rotate your phone</h2>
          <p className="text-sm text-gray-300">
            For the best Pro Master quality, hold your device in landscape while recording. Tap anywhere to continue.
          </p>
        </div>
      )}


      {error && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-10">
          <IconVideo className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Camera Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};


export default CameraClient;
