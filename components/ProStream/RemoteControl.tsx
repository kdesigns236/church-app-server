import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './Sidebar';
import { CameraSlot, CameraDevice, TransitionType, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
import { FiSettings, FiX, FiMonitor } from 'react-icons/fi';
import { io, Socket } from 'socket.io-client';


const SIGNALING_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'https://church-app-server.onrender.com';

const RTC_CONFIGURATION = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};


const getSerializableState = (state: any) => {
  const { cameraSlots, ...restOfState } = state;
  const serializableSlots = cameraSlots.map((slot: CameraSlot) => {
    const { stream, ...restOfSlot } = slot;
    return restOfSlot;
  });
  return { ...restOfState, cameraSlots: serializableSlots };
};


interface RemoteControlProps {
    sessionId: string;
    onExit?: () => void;
}


const RemoteControl: React.FC<RemoteControlProps> = ({ sessionId, onExit }) => {
  const socketRef = useRef<Socket | null>(null);
  const shortSessionIdRef = useRef<string>('');
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const autoAssignedPrimaryRef = useRef(false);
  const displayPeerRef = useRef<RTCPeerConnection | null>(null);
  const displayReadyRef = useRef(false);
  const activeCameraIdRef = useRef<number | null>(null);
  const sourceModeRef = useRef<'local' | 'controller'>('local');


  const [cameraSlots, setCameraSlots] = useState<CameraSlot[]>([
    { id: 1, name: 'Camera 1', device: null, stream: null, status: 'disconnected', sourceType: null },
    { id: 2, name: 'Camera 2', device: null, stream: null, status: 'disconnected', sourceType: null },
    { id: 3, name: 'Camera 3', device: null, stream: null, status: 'disconnected', sourceType: null },
  ]);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<number | null>(null);
  const [transition, setTransition] = useState<TransitionType>('cut');
  const [sourceMode, setSourceMode] = useState<'local' | 'controller'>('local');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [activeCameraZoom, setActiveCameraZoom] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDisplayQr, setShowDisplayQr] = useState(false);
  const [lowerThirdConfig, setLowerThirdConfig] = useState<LowerThirdConfig>({
    isVisible: false,
    topText: '',
    mainText: '',
    logoIcon: '',
    accentColor: '#d32f2f',
    mainBarColor: '#ffffff',
  });
  const [lowerThirdAnimationKey, setLowerThirdAnimationKey] = useState(0);
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig>({
    isVisible: false,
    text: '',
    fontSize: 'text-3xl',
    fontFamily: 'font-sans',
    textColor: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#000000',
    backgroundOpacity: 0.5,
    animationStyle: 'fade',
    position: 'bottom',
  });
  const [lyricsConfig, setLyricsConfig] = useState<LyricsConfig>({
    isVisible: false, song: null, verseIndex: 0, fontSize: 'text-5xl', fontFamily: 'font-serif',
    textColor: '#ffffff', textAlign: 'center', backgroundColor: '#000000', backgroundOpacity: 0.6,
    animationStyle: 'fade', position: 'bottom',
  });
  const [bibleVerseConfig, setBibleVerseConfig] = useState<BibleVerseConfig>({
    isVisible: false,
    text: '',
    reference: '',
    fontSize: 'text-4xl',
    fontFamily: 'font-serif',
    textColor: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#000000',
    backgroundOpacity: 0.6,
    animationStyle: 'fade',
    position: 'bottom',
  });


  const replayLowerThirdAnimation = () => {
    setLowerThirdAnimationKey(k => k + 1);
  };


  useEffect(() => {
    activeCameraIdRef.current = activeCameraId;
  }, [activeCameraId]);


  useEffect(() => {
    sourceModeRef.current = sourceMode;
  }, [sourceMode]);


  const buildDisplayUrl = useCallback(() => {
    const short = sessionId.split(':')[1] || sessionId;

    // In production the controller often runs on pro-stream-client.onrender.com,
    // while the public viewing page (GoLive) lives on church-app-server.onrender.com.
    let base = window.location.origin;
    if (base.includes('pro-stream-client.onrender.com')) {
      base = 'https://church-app-server.onrender.com';
    }

    return `${base}/#/golive?session=${short}`;
  }, [sessionId]);


  const startDisplayWebRTC = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket || !shortSessionIdRef.current) return;
    if (!displayReadyRef.current) return;

    const activeSlot = cameraSlots.find(s => s.id === activeCameraId);
    const stream = activeSlot?.stream || null;

    if (!activeSlot || !stream) {
      if (displayPeerRef.current) {
        displayPeerRef.current.getSenders().forEach(sender => sender.track && sender.track.stop());
        displayPeerRef.current.close();
        displayPeerRef.current = null;
      }
      return;
    }

    try {
      if (displayPeerRef.current) {
        displayPeerRef.current.getSenders().forEach(sender => sender.track && sender.track.stop());
        displayPeerRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIGURATION);
      displayPeerRef.current = pc;

      // Forward only video tracks to the display; audio is owned by the GoLive device
      stream.getVideoTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const s = socketRef.current;
          if (!s) return;
          s.emit('prostream:signal', {
            sessionId: shortSessionIdRef.current,
            type: 'display-webrtc-candidate',
            payload: event.candidate,
            target: 'display',
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('prostream:signal', {
        sessionId: shortSessionIdRef.current,
        type: 'display-webrtc-offer',
        payload: offer,
        target: 'display',
      });
    } catch (err) {
      console.error('Error starting WebRTC to display:', err);
    }
  }, [cameraSlots, activeCameraId]);
  
  const refreshDevices = useCallback(async () => {
    try {
      // Request video permission only (no audio) so this controller never owns live audio
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ id: device.deviceId, label: device.label || `Camera ${device.deviceId.substring(0, 5)}` }));
      setAvailableDevices(videoDevices);
    } catch (error) {
      console.error("Permission denied or no devices found:", error);
    }
  }, []);


  const handleDeviceChange = useCallback(async (slotId: number, deviceId: string) => {
    setCameraSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const slotIndex = newSlots.findIndex(s => s.id === slotId);
      if (slotIndex === -1) return prevSlots;


      if (newSlots[slotIndex].stream) {
        newSlots[slotIndex].stream?.getTracks().forEach(track => track.stop());
      }
      
      if (!deviceId) {
        newSlots[slotIndex] = { ...newSlots[slotIndex], device: null, stream: null, status: 'disconnected', sourceType: null };
        setActiveCameraId(prevActive => prevActive === slotId ? null : prevActive);
        return newSlots;
      }


      newSlots[slotIndex] = { ...newSlots[slotIndex], sourceType: 'local', device: {id: deviceId, label: '...'} };
      return newSlots;
    });


    if (!deviceId) return;


    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      setCameraSlots(prevSlots => {
          const newSlots = [...prevSlots];
          const slotIndex = newSlots.findIndex(s => s.id === slotId);
          if (slotIndex === -1) return prevSlots;


          const device = availableDevices.find(d => d.id === deviceId) || null;
          newSlots[slotIndex] = { ...newSlots[slotIndex], device, stream, status: 'connected' };
          
          setActiveCameraId(prevActive => prevActive === null ? slotId : prevActive);
          return newSlots;
      });
    } catch (error) {
        console.error("Error getting user media:", error);
        setCameraSlots(prevSlots => {
            const newSlots = [...prevSlots];
            const slotIndex = newSlots.findIndex(s => s.id === slotId);
            if (slotIndex > -1) {
              newSlots[slotIndex] = { ...newSlots[slotIndex], device: null, stream: null, status: 'disconnected', sourceType: null };
            }
            return newSlots;
        });
    }
  }, [availableDevices]);


  useEffect(() => {
    const shortSessionId = (sessionId.split(':')[1] || sessionId).trim();
    shortSessionIdRef.current = shortSessionId;
    // Use polling-only transport for compatibility with Render and to avoid
    // WebSocket upgrade warnings in development.
    const socket = io(SIGNALING_URL, { transports: ['polling'] });
    socketRef.current = socket;
    socket.emit('prostream:join', { sessionId: shortSessionId, role: 'controller' });

    const handleSignal = async (message: any) => {
        const { type, slotId, payload, target } = message;

        // Messages intended for controller-display WebRTC
        if (type === 'display-ready' && (!target || target === 'controller')) {
            displayReadyRef.current = true;
            startDisplayWebRTC();
            return;
        }

        if (type === 'display-webrtc-answer' && (!target || target === 'controller') && payload && displayPeerRef.current) {
            try {
                await displayPeerRef.current.setRemoteDescription(new RTCSessionDescription(payload));
            } catch (err) {
                console.error('Error setting display remote description:', err);
            }
            return;
        }

        if (type === 'display-webrtc-candidate' && target === 'controller' && payload && displayPeerRef.current) {
            try {
                await displayPeerRef.current.addIceCandidate(new RTCIceCandidate(payload));
            } catch (err) {
                console.error('Error adding display ICE candidate:', err);
            }
            return;
        }

        if (!type || !slotId) return;
        const numericSlotId = parseInt(String(slotId), 10);

        if (type === 'camera-zoom') {
            const zoomValue = payload && typeof payload.zoom === 'number' ? payload.zoom : null;
            if (zoomValue && zoomValue > 0 && activeCameraIdRef.current === numericSlotId) {
                setActiveCameraZoom(zoomValue);
            }
            return;
        }

        try {
            if (type === 'camera-disconnected') {
                setCameraSlots(prev => prev.map(s => s.id === numericSlotId ? { ...s, status: 'disconnected', sourceType: null, stream: null } : s));
                peerConnectionsRef.current.get(numericSlotId)?.close();
                peerConnectionsRef.current.delete(numericSlotId);
            } else if (type === 'webrtc-offer' && (!target || target === 'controller')) {
                const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
                peerConnectionsRef.current.set(numericSlotId, peerConnection);

                peerConnection.onicecandidate = (e) => {
                    if (e.candidate) {
                        const s = socketRef.current;
                        if (!s) return;
                        s.emit('prostream:signal', {
                            sessionId: shortSessionIdRef.current,
                            type: 'webrtc-candidate',
                            slotId: numericSlotId,
                            payload: e.candidate,
                            target: 'camera'
                        });
                    }
                };
                
                peerConnection.ontrack = (e) => {
                    const [stream] = e.streams;
                    if (!stream) return;

                    setCameraSlots(prev => prev.map(slot => 
                        slot.id === numericSlotId 
                            ? { ...slot, stream, status: 'connected', sourceType: 'remote', device: null } 
                            : slot
                    ));

                    // If this phone/USB stream later stops (e.g. phone sleeps), mark it disconnected
                    // and, if it was the active external source, fall back to GoLive camera.
                    stream.getVideoTracks().forEach(track => {
                        track.onended = () => {
                            setCameraSlots(prev => prev.map(slot => 
                                slot.id === numericSlotId
                                    ? { ...slot, stream: null, status: 'disconnected', sourceType: null }
                                    : slot
                            ));

                            setActiveCameraId(prev => prev === numericSlotId ? null : prev);

                            if (sourceModeRef.current === 'controller' && activeCameraIdRef.current === numericSlotId) {
                                setSourceMode('local');
                            }
                        };
                    });

                    setActiveCameraId(prevId => prevId === null ? numericSlotId : prevId);
                };

                await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                const s = socketRef.current;
                if (s) {
                    s.emit('prostream:signal', {
                        sessionId: shortSessionIdRef.current,
                        type: 'webrtc-answer',
                        slotId: numericSlotId,
                        payload: answer,
                        target: 'camera'
                    });
                }
            } else if (type === 'webrtc-candidate' && target === 'controller') {
                await peerConnectionsRef.current.get(numericSlotId)?.addIceCandidate(new RTCIceCandidate(payload));
            }
        } catch (err) {
            console.error(`Error handling ProStream signal type ${type} for slot ${slotId}:`, err);
        }
    };

    socket.on('prostream:signal', handleSignal);

    return () => {
        peerConnectionsRef.current.forEach(pc => pc.close());
        socket.off('prostream:signal', handleSignal);
        socket.disconnect();
    };
  }, [sessionId]);


  useEffect(() => {
    const fullState = {
        activeCameraId, isLive, sourceMode, activeCameraZoom, lowerThirdConfig, lowerThirdAnimationKey,
        announcementConfig, lyricsConfig, bibleVerseConfig,
        cameraSlots: cameraSlots.map(s => ({...s, stream: null}))
    };
    const socket = socketRef.current;
    if (!socket || !shortSessionIdRef.current) return;
    socket.emit('prostream:signal', {
        sessionId: shortSessionIdRef.current,
        type: 'state-update',
        payload: getSerializableState(fullState)
    });
  }, [cameraSlots, activeCameraId, isLive, sourceMode, activeCameraZoom, lowerThirdConfig, lowerThirdAnimationKey, announcementConfig, lyricsConfig, bibleVerseConfig]);


  // When the active camera or its stream changes and the display is ready, (re)start WebRTC to the display
  useEffect(() => {
    if (!displayReadyRef.current) return;
    if (sourceMode !== 'controller') return;
    startDisplayWebRTC();
  }, [activeCameraId, cameraSlots, sourceMode, startDisplayWebRTC]);



  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Removed auto-assignment of a primary local camera.
  // Slots 1, 2 and 3 are now used only when the operator explicitly selects a device.
  const openDisplayWindow = () => {
      const url = buildDisplayUrl();
      window.open(url, '_blank', 'popup');
  };

  const copySession = useCallback(() => {
    const short = sessionId.split(':')[1] || sessionId;
    navigator.clipboard.writeText(short).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [sessionId]);

  const copyDisplayLink = useCallback(() => {
    const url = buildDisplayUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1200);
    });
  }, [buildDisplayUrl]);

  return (
    <div className="flex h-screen w-screen bg-[#1e1e1e] text-white font-sans overflow-hidden">
      <div className="w-full flex flex-col">
        <header className="flex-shrink-0 bg-[#1a1a1a] p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 border-b border-gray-700 shadow-md">
          <div className="flex items-center space-x-3">
            {onExit && (
              <button
                onClick={onExit}
                className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold flex items-center space-x-2"
                title="Back"
              >
                <FiX className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <FiSettings className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold">Church Live Streaming Controller</h1>
          </div>
          <div className="text-xs text-center text-gray-400 flex-1 sm:flex-none">
            <p>Session ID</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono bg-black px-2 py-0.5 rounded select-all">{sessionId.split(':')[1] || sessionId}</span>
              <button
                onClick={copySession}
                className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700"
                title="Copy session code"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowDisplayQr(true)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-sm"
              title="Show display QR"
            >
              QR
            </button>
            <button
              onClick={openDisplayWindow}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-sm font-semibold flex items-center space-x-2"
            >
              <FiMonitor className="w-4 h-4" />
              <span>Open Display</span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden flex p-3 sm:p-4">
          <div className="flex-1 bg-[#1a1a1a] rounded-lg overflow-y-auto border border-gray-700">
            <Sidebar
              sessionId={sessionId}
              cameraSlots={cameraSlots}
              onDeviceChange={handleDeviceChange}
              availableDevices={availableDevices}
              activeCameraId={activeCameraId}
              setActiveCameraId={setActiveCameraId}
              transition={transition}
              setTransition={setTransition}
              isLive={isLive}
              setIsLive={setIsLive}
              sourceMode={sourceMode}
              setSourceMode={setSourceMode}
              lowerThirdConfig={lowerThirdConfig}
              setLowerThirdConfig={setLowerThirdConfig}
              replayLowerThirdAnimation={replayLowerThirdAnimation}
              announcementConfig={announcementConfig}
              setAnnouncementConfig={setAnnouncementConfig}
              lyricsConfig={lyricsConfig}
              setLyricsConfig={setLyricsConfig}
              bibleVerseConfig={bibleVerseConfig}
              setBibleVerseConfig={setBibleVerseConfig}
            />
          </div>
        </div>
      </div>

      {showDisplayQr && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-2xl text-white w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Display QR Code</h3>
            <p className="text-xs text-gray-400 mb-3">Scan this on the GoLive page to connect this session.</p>
            <div className="bg-white rounded-lg p-3 flex items-center justify-center mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(buildDisplayUrl())}`}
                alt="Display link QR"
                className="w-48 h-48"
              />
            </div>
            <button
              onClick={() => setShowDisplayQr(false)}
              className="w-full py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export default RemoteControl;
