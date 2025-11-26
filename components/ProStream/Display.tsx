import React, { useState, useEffect, useRef } from 'react';
import VideoPreview from './VideoPreview';
import ProgramOutputCanvas from './ProgramOutputCanvas';
import { FiSettings } from 'react-icons/fi';
import { CameraSlot, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
import { io, Socket } from 'socket.io-client';
import { liveStreamService, StreamSettings, StreamPlatform } from '../../services/liveStreamService';
import { oauthService } from '../../services/oauthService';

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

interface DisplayProps {
    sessionId: string;
}


const Display: React.FC<DisplayProps> = ({ sessionId }) => {
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [sourceMode, setSourceMode] = useState<'local' | 'controller'>('local');
  const localStreamRef = useRef<MediaStream | null>(null);
  const controllerStreamRef = useRef<MediaStream | null>(null);
  const sourceModeRef = useRef<'local' | 'controller'>('local');
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [streamToYoutube, setStreamToYoutube] = useState<boolean>(true);
  const [streamToFacebook, setStreamToFacebook] = useState<boolean>(false);
  const [lowerThirdConfig, setLowerThirdConfig] = useState<LowerThirdConfig>({ isVisible: false, topText: '', mainText: '', logoIcon: '', accentColor: '', mainBarColor: '' });
  const [lowerThirdAnimationKey, setLowerThirdAnimationKey] = useState(0);
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig>({ isVisible: false, text: '', fontSize: '', fontFamily: '', textColor: '', textAlign: 'center', backgroundColor: '', backgroundOpacity: 0, animationStyle: 'fade', position: 'bottom' });
  const [lyricsConfig, setLyricsConfig] = useState<LyricsConfig>({ isVisible: false, song: null, verseIndex: 0, fontSize: '', fontFamily: '', textColor: '', textAlign: 'center', backgroundColor: '', backgroundOpacity: 0, animationStyle: 'fade', position: 'bottom' });
  const [bibleVerseConfig, setBibleVerseConfig] = useState<BibleVerseConfig>({ isVisible: false, text: '', reference: '', fontSize: '', fontFamily: '', textColor: '', textAlign: 'center', backgroundColor: '', backgroundOpacity: 0, animationStyle: 'fade', position: 'bottom' });
  const socketRef = useRef<Socket | null>(null);
  const shortSessionIdRef = useRef<string>('');
  const displayPeerRef = useRef<RTCPeerConnection | null>(null);
  const hasRequestedLocalRef = useRef(false);
  const [rotate90, setRotate90] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = window.localStorage.getItem('prostream_display_rotate90');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [remoteZoom, setRemoteZoom] = useState<number | null>(null);
  const [programStream, setProgramStream] = useState<MediaStream | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ facebook: boolean; youtube: boolean }>({
    facebook: false,
    youtube: false,
  });
  const [authLoading, setAuthLoading] = useState<{ facebook: boolean; youtube: boolean }>({
    facebook: false,
    youtube: false,
  });
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [localZoom] = useState<number>(1);
  const [localFacingMode, setLocalFacingMode] = useState<'environment' | 'user'>('environment');
  const localFacingModeRef = useRef<'environment' | 'user'>('environment');
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);

  // Detect mobile-sized layout so we can show a simplified camera UI
  useEffect(() => {
    const updateLayout = () => {
      if (typeof window === 'undefined') return;
      setIsMobileLayout(window.innerWidth <= 768);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Ensure we have a live local camera stream when GoLive camera is selected
  function activateLocalIfNeeded() {
    const existing = localStreamRef.current;
    if (existing) {
      const hasLiveTrack = existing.getVideoTracks().some(t => t.readyState === 'live');
      if (hasLiveTrack) {
        setActiveStream(existing);
        return;
      }
      existing.getTracks().forEach(track => track.stop());
    }

    const mediaDevices = (navigator as any)?.mediaDevices as MediaDevices | undefined;
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
      // On some mobile browsers over HTTP (e.g. LAN dev URLs), getUserMedia is
      // not available because the context is not secure. In that case, skip
      // attaching a local camera instead of crashing the whole GoLive page.
      console.warn('[LiveStream] getUserMedia is not available in this context (requires HTTPS or localhost).');
      return;
    }

    const constraints: MediaStreamConstraints = {
      video: {
        // Target smooth 16:9 720p for YouTube (lighter on bandwidth)
        width: { min: 640, ideal: 1280, max: 1280 },
        height: { min: 360, ideal: 720, max: 720 },
        aspectRatio: { ideal: 16 / 9 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: localFacingModeRef.current,
      } as any,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
    mediaDevices.getUserMedia(constraints)
      .then(stream => {
        localStreamRef.current = stream;
        if (sourceModeRef.current === 'local') {
          setActiveStream(stream);
        }
      })
      .catch(() => {
        // If permission denied or no device, keep waiting for controller
      });
  }

  useEffect(() => {
    localFacingModeRef.current = localFacingMode;
  }, [localFacingMode]);

  useEffect(() => {
    sourceModeRef.current = sourceMode;
  }, [sourceMode]);
  

  useEffect(() => {
    if (!isMobileLayout) return;
    const video = mobileVideoRef.current;
    if (!video) return;
    if (activeStream) {
      (video as any).srcObject = activeStream;
    } else {
      (video as any).srcObject = null;
    }
  }, [activeStream, isMobileLayout]);


  useEffect(() => {
    try {
      window.localStorage.setItem('prostream_display_rotate90', rotate90 ? 'true' : 'false');
    } catch {}
  }, [rotate90]);
  
  useEffect(() => {
    try {
      // For the RTMP bridges we only need the stream keys configured on the
      // server. The frontend does not need Facebook or YouTube access tokens
      // just to push video, so treat both platforms as available by default.
      setConnectionStatus({
        facebook: true,
        youtube: true,
      });
    } catch {}
  }, []);
  
  useEffect(() => {
    const videoSource = programStream || activeStream;
    if (!videoSource) return;

    // Build a streaming MediaStream that always uses video from the
    // current active source (local or controller) but audio only from
    // the local GoLive PC microphone.
    const mixed = new MediaStream();

    videoSource.getVideoTracks().forEach(track => {
      mixed.addTrack(track);
    });

    const local = localStreamRef.current;
    if (local) {
      local.getAudioTracks().forEach(track => {
        mixed.addTrack(track);
      });
    }

    liveStreamService.attachExternalStream(mixed);
  }, [activeStream, programStream]);
  
  // Start with the local default camera so the GoLive page shows a feed immediately
  useEffect(() => {
    if (hasRequestedLocalRef.current) return;
    hasRequestedLocalRef.current = true;
    activateLocalIfNeeded();
  }, []);

  useEffect(() => {
    if (!sessionId) return;


    const shortSessionId = (sessionId.split(':')[1] || sessionId).trim();
    shortSessionIdRef.current = shortSessionId;
    const signalingUrl = import.meta.env.VITE_SYNC_SERVER_URL || 'https://church-app-server.onrender.com';
    // Use polling-only transport for maximum compatibility with Render and to
    // avoid noisy WebSocket upgrade failures in the console.
    const socket = io(signalingUrl, { transports: ['polling'] });
    socketRef.current = socket;
    socket.emit('prostream:join', { sessionId: shortSessionId, role: 'display' });

    // Let the controller know this display is ready to receive a WebRTC stream
    socket.emit('prostream:signal', {
      sessionId: shortSessionId,
      type: 'display-ready',
      target: 'controller',
    });


    const handleSignal = async (message: any) => {
      const { type, payload, target } = message;
      if (target && target !== 'display') return;

      // WebRTC offer/answer/candidates from controller
      if (type === 'display-webrtc-offer' && payload) {
        try {
          if (displayPeerRef.current) {
            displayPeerRef.current.close();
          }
          const pc = new RTCPeerConnection(RTC_CONFIGURATION);
          displayPeerRef.current = pc;

          pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (!stream) return;

            if (controllerStreamRef.current && controllerStreamRef.current !== stream) {
              controllerStreamRef.current.getTracks().forEach(track => track.stop());
            }
            controllerStreamRef.current = stream;

            // If the external stream later stops (e.g. phone sleeps), fall back to GoLive camera
            stream.getVideoTracks().forEach(track => {
              track.onended = () => {
                if (sourceModeRef.current === 'controller') {
                  activateLocalIfNeeded();
                }
              };
            });

            if (sourceModeRef.current === 'controller') {
              setActiveStream(stream);
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const s = socketRef.current;
              if (!s) return;
              s.emit('prostream:signal', {
                sessionId: shortSessionIdRef.current,
                type: 'display-webrtc-candidate',
                payload: event.candidate,
                target: 'controller',
              });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const s = socketRef.current;
          if (s) {
            s.emit('prostream:signal', {
              sessionId: shortSessionIdRef.current,
              type: 'display-webrtc-answer',
              payload: answer,
              target: 'controller',
            });
          }
        } catch (err) {
          console.error('Error handling display-webrtc-offer:', err);
        }
        return;
      }

      if (type === 'display-webrtc-candidate' && payload && displayPeerRef.current) {
        try {
          await displayPeerRef.current.addIceCandidate(new RTCIceCandidate(payload));
        } catch (err) {
          console.error('Error adding display ICE candidate:', err);
        }
        return;
      }

      if (type !== 'state-update' || !payload) return;

      if (!isConnected) setIsConnected(true);

      if (payload.sourceMode) {
        const mode: 'local' | 'controller' = payload.sourceMode === 'controller' ? 'controller' : 'local';
        setSourceMode(mode);
        sourceModeRef.current = mode;

        if (mode === 'controller') {
          const s = controllerStreamRef.current;
          if (s) {
            const hasLiveTrack = s.getVideoTracks().some(t => t.readyState === 'live');
            if (hasLiveTrack) {
              setActiveStream(s);
            }
          }
          // If no live external stream yet, keep showing whatever is currently active (usually GoLive camera)

          if (typeof payload.activeCameraZoom === 'number') {
            setRemoteZoom(payload.activeCameraZoom > 1 ? payload.activeCameraZoom : 1);
          } else {
            setRemoteZoom(null);
          }
        } else if (mode === 'local') {
          activateLocalIfNeeded();
          setRemoteZoom(null);
        }
      }

      setLowerThirdConfig(payload.lowerThirdConfig);
      setLowerThirdAnimationKey(payload.lowerThirdAnimationKey);
      setAnnouncementConfig(payload.announcementConfig);
      setLyricsConfig(payload.lyricsConfig);
      setBibleVerseConfig(payload.bibleVerseConfig);
    };


    socket.on('prostream:signal', handleSignal);


    return () => {
      socket.off('prostream:signal', handleSignal);
      socket.disconnect();
      if (displayPeerRef.current) {
        displayPeerRef.current.close();
        displayPeerRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (controllerStreamRef.current) {
        controllerStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, isConnected]);


  if (!sessionId) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Invalid Session ID.</div>;
  }


  const buildPlatforms = (): StreamPlatform[] => {
    const platforms: StreamPlatform[] = [];

    if (streamToYoutube) {
      const ytToken = oauthService.getStoredToken('youtube');
      const accessToken = ytToken?.accessToken || 'rtmp';
      platforms.push({
        name: 'youtube',
        displayName: 'YouTube',
        isConnected: true,
        accessToken,
      });
    }

    if (streamToFacebook) {
      // For the Facebook RTMP bridge we only need the Page access token
      // on the server (FACEBOOK_PAGE_ACCESS_TOKEN in server/.env).
      // The frontend just needs to indicate that Facebook is enabled.
      platforms.push({
        name: 'facebook',
        displayName: 'Facebook',
        isConnected: true,
      });
    }

    return platforms;
  };


  const handleConnectYoutube = async () => {
    if (authLoading.youtube) return;
    try {
      setAuthLoading(prev => ({ ...prev, youtube: true }));
      await oauthService.authenticateYouTube();
      const status = oauthService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (err) {
      console.error('[Display] YouTube authentication failed', err);
      alert('Failed to connect YouTube. Please check your YouTube streaming setup.');
    } finally {
      setAuthLoading(prev => ({ ...prev, youtube: false }));
    }
  };


  const handleConnectFacebook = async () => {
    if (authLoading.facebook) return;
    try {
      setAuthLoading(prev => ({ ...prev, facebook: true }));
      // For Facebook RTMP we rely solely on the persistent stream key
      // configured on the server. Mark Facebook as connected and show
      // a simple informational message.
      setConnectionStatus(prev => ({ ...prev, facebook: true }));
      alert('Facebook streaming uses the server stream key. No additional login is required here.');
    } finally {
      setAuthLoading(prev => ({ ...prev, facebook: false }));
    }
  };


  const handleToggleLive = async () => {
    if (isTogglingLive) return;
    if (!streamToYoutube && !streamToFacebook) return;
    if (!activeStream) {
      alert('No active video feed. Connect a controller or local camera before going live.');
      return;
    }

    try {
      setIsTogglingLive(true);

      if (!isLive) {
        const platforms = buildPlatforms();
        if (platforms.length === 0) {
          alert('No connected platforms. Connect Facebook or YouTube before going live.');
          return;
        }

        const settings: StreamSettings = {
          title: 'Church Live Service',
          description: 'Live service stream',
          privacy: 'public',
          platforms,
        };
        const videoSource = programStream || activeStream;
        if (videoSource) {
          const mixed = new MediaStream();
          videoSource.getVideoTracks().forEach(track => {
            mixed.addTrack(track);
          });

          const local = localStreamRef.current;
          if (local) {
            local.getAudioTracks().forEach(track => {
              mixed.addTrack(track);
            });
          }

          liveStreamService.attachExternalStream(mixed);
        }
        await liveStreamService.startStream(settings);
        setIsLive(true);
      } else {
        await liveStreamService.stopStream();
        setIsLive(false);
      }
    } catch (err) {
      console.error('[Display] Failed to toggle live stream', err);
      alert('Failed to toggle live stream. Please check your streaming setup.');
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleFlipCamera = () => {
    // Force local source when flipping cameras on mobile
    setSourceMode('local');
    sourceModeRef.current = 'local';

    const nextMode: 'environment' | 'user' =
      localFacingModeRef.current === 'environment' ? 'user' : 'environment';
    localFacingModeRef.current = nextMode;
    setLocalFacingMode(nextMode);
    activateLocalIfNeeded();
  };

  return (
    <div className="h-screen w-screen bg-black relative">
      {isMobileLayout ? (
        <video
          ref={mobileVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <VideoPreview
          stream={activeStream}
          isLive={isLive}
          lowerThirdConfig={lowerThirdConfig}
          lowerThirdAnimationKey={lowerThirdAnimationKey}
          announcementConfig={announcementConfig}
          lyricsConfig={lyricsConfig}
          bibleVerseConfig={bibleVerseConfig}
          rotate90={rotate90}
          zoomScale={sourceMode === 'controller' ? (remoteZoom || undefined) : localZoom || undefined}
        />
      )}
      <ProgramOutputCanvas
        sourceStream={activeStream}
        lowerThirdConfig={lowerThirdConfig}
        announcementConfig={announcementConfig}
        lyricsConfig={lyricsConfig}
        bibleVerseConfig={bibleVerseConfig}
        rotate90={rotate90}
        zoomScale={sourceMode === 'controller' ? (remoteZoom || undefined) : localZoom || undefined}
        onProgramStreamReady={setProgramStream}
      />

      {/* Desktop GoLive controls */}
      {!isMobileLayout && controlsVisible && (
        <div className="absolute bottom-4 left-4 z-30 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-700 max-w-md">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col gap-1 text-xs text-gray-300">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={streamToYoutube}
                    onChange={() => setStreamToYoutube(p => !p)}
                    className="form-checkbox h-4 w-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500"
                  />
                  <span>Stream to YouTube</span>
                </label>
                <div className="flex items-center gap-2 pl-6">
                  <button
                    onClick={handleConnectYoutube}
                    className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-[11px] disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={authLoading.youtube}
                  >
                    {connectionStatus.youtube ? 'Reconnect YouTube' : 'Connect YouTube'}
                  </button>
                  <span
                    className={connectionStatus.youtube ? 'text-green-400 text-[11px]' : 'text-gray-400 text-[11px]'}
                  >
                    {connectionStatus.youtube ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={streamToFacebook}
                    onChange={() => setStreamToFacebook(p => !p)}
                    className="form-checkbox h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span>Stream to Facebook</span>
                </label>
                <div className="flex items-center gap-2 pl-6">
                  <button
                    onClick={handleConnectFacebook}
                    className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-[11px] disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={authLoading.facebook}
                  >
                    {connectionStatus.facebook ? 'Reconnect Facebook' : 'Connect Facebook'}
                  </button>
                  <span
                    className={connectionStatus.facebook ? 'text-green-400 text-[11px]' : 'text-gray-400 text-[11px]'}
                  >
                    {connectionStatus.facebook ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleLive}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
                  isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } ${(!streamToYoutube && !streamToFacebook) || isTogglingLive ? 'bg-gray-600 cursor-not-allowed hover:bg-gray-600' : ''}`}
                disabled={!streamToYoutube && !streamToFacebook || isTogglingLive}
              >
                {isLive ? 'STOP STREAM' : 'GO LIVE'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              GoLive controls the live status and audio. The controller only switches cameras and overlays.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-gray-300">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rotate90}
                  onChange={() => setRotate90(v => !v)}
                  className="h-3 w-3 text-red-500 bg-gray-800 border-gray-600 rounded"
                />
                <span>Rotate 90°</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Desktop toggle button for advanced GoLive panel */}
      {!isMobileLayout && (
        <button
          onClick={() => setControlsVisible(v => !v)}
          className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-gray-600 text-[11px] font-semibold uppercase tracking-wide text-gray-100 hover:bg-black/80"
        >
          {controlsVisible ? 'Hide GoLive Panel' : 'Show GoLive Panel'}
        </button>
      )}

      {/* Mobile-friendly camera controls overlay */}
      {isMobileLayout && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between items-center pointer-events-none">
          {/* Top area could be used later for indicators; keep minimal for now */}
          <div className="w-full flex justify-end items-center px-4 pt-6 text-xs text-gray-200 pointer-events-auto">
            {isLive && (
              <span className="flex items-center gap-2 bg-red-600/80 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Bottom controls: keep only a simple Flip button on mobile */}
          <div className="w-full px-6 pb-8 flex flex-col items-center gap-5 pointer-events-auto">
            <div className="flex items-center justify-center">
              <button
                onClick={handleFlipCamera}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-sm border border-white/25 text-white shadow-[0_0_20px_rgba(59,130,246,0.9)] hover:bg-black/85 active:scale-95 transition-all duration-200"
                aria-label="Flip camera"
              >
                <span className="text-xs font-semibold tracking-wide">FLIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default Display;
