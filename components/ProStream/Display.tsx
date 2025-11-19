import React, { useState, useEffect, useRef } from 'react';
import VideoPreview from './VideoPreview';
import { IconSettings } from './icons';
import { CameraSlot, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
import { io, Socket } from 'socket.io-client';

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

    navigator.mediaDevices.getUserMedia({ video: true })
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
    sourceModeRef.current = sourceMode;
  }, [sourceMode]);
  

  useEffect(() => {
    try {
      window.localStorage.setItem('prostream_display_rotate90', rotate90 ? 'true' : 'false');
    } catch {}
  }, [rotate90]);
  
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
    const socket = io(signalingUrl, { transports: ['websocket', 'polling'] });
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


  return (
    <div className="h-screen w-screen bg-black relative">
      <VideoPreview
        stream={activeStream}
        isLive={isLive}
        lowerThirdConfig={lowerThirdConfig}
        lowerThirdAnimationKey={lowerThirdAnimationKey}
        announcementConfig={announcementConfig}
        lyricsConfig={lyricsConfig}
        bibleVerseConfig={bibleVerseConfig}
        rotate90={rotate90}
        zoomScale={remoteZoom || undefined}
      />
      {/* Local GO LIVE controls - display owns live state and target platforms */}
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
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamToFacebook}
                  onChange={() => setStreamToFacebook(p => !p)}
                  className="form-checkbox h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <span>Stream to Facebook</span>
              </label>
            </div>
            <button
              onClick={() => {
                if (!streamToYoutube && !streamToFacebook) return;
                setIsLive(prev => !prev);
              }}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 transform active:scale-95 ${
                isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              } ${!streamToYoutube && !streamToFacebook ? 'bg-gray-600 cursor-not-allowed hover:bg-gray-600' : ''}`}
              disabled={!streamToYoutube && !streamToFacebook}
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
       {!isConnected && !activeStream && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4">
             <div className="bg-[#1e1e1e] p-8 rounded-lg shadow-2xl text-white text-center w-full max-w-md">
                <div className="animate-pulse flex justify-center items-center mb-4">
                  <IconSettings className="w-16 h-16 mx-auto text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Waiting for Controller</h3>
                <p className="text-gray-400 mb-6">The live display is ready. Open the controller app to begin.</p>
                <p className="text-xs text-gray-500 mt-4 break-words">Session ID: <code className="bg-black p-1 rounded">{sessionId.split(':')[1]}</code></p>
            </div>
        </div>
      )}
    </div>
  );
};


export default Display;
