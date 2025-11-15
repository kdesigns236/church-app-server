import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './Sidebar';
import { CameraSlot, CameraDevice, TransitionType, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
import { IconSettings, IconVideo, IconX } from './icons';
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


  const [cameraSlots, setCameraSlots] = useState<CameraSlot[]>([
    { id: 1, name: 'Camera 1', device: null, stream: null, status: 'disconnected', sourceType: null },
    { id: 2, name: 'Camera 2', device: null, stream: null, status: 'disconnected', sourceType: null },
    { id: 3, name: 'Camera 3', device: null, stream: null, status: 'disconnected', sourceType: null },
  ]);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<number | null>(null);
  const [transition, setTransition] = useState<TransitionType>('cut');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
    setLowerThirdConfig(prev => ({...prev, isVisible: false}));
    setTimeout(() => {
        setLowerThirdAnimationKey(k => k + 1);
        setLowerThirdConfig(prev => ({...prev, isVisible: true}));
    }, 100)
  }
  
  const refreshDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    const socket = io(SIGNALING_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('prostream:join', { sessionId: shortSessionId, role: 'controller' });

    const handleSignal = async (message: any) => {
        const { type, slotId, payload, target } = message;
        if (!type || !slotId) return;
        const numericSlotId = parseInt(String(slotId), 10);

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
                    setCameraSlots(prev => prev.map(slot => 
                        slot.id === numericSlotId 
                            ? { ...slot, stream: e.streams[0], status: 'connected', sourceType: 'remote', device: null } 
                            : slot
                    ));
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
        activeCameraId, isLive, lowerThirdConfig, lowerThirdAnimationKey,
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
  }, [cameraSlots, activeCameraId, isLive, lowerThirdConfig, lowerThirdAnimationKey, announcementConfig, lyricsConfig, bibleVerseConfig]);



  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Auto-assign the primary camera (slot 1) to the first available local device if nothing is active yet
  useEffect(() => {
    if (autoAssignedPrimaryRef.current) return;
    if (availableDevices.length === 0) return;
    if (activeCameraId !== null) return;
    if (!cameraSlots[0] || cameraSlots[0].status !== 'disconnected') return;

    const firstDevice = availableDevices[0];
    if (!firstDevice) return;

    autoAssignedPrimaryRef.current = true;
    handleDeviceChange(1, firstDevice.id);
  }, [availableDevices, activeCameraId, cameraSlots, handleDeviceChange]);
  const openDisplayWindow = () => {
      const sessionParam = sessionId.split(':')[1];
      const url = `${window.location.origin}${window.location.pathname}?role=display&session=${sessionParam}`;
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
    const short = sessionId.split(':')[1] || sessionId;
    const url = `${window.location.origin}${window.location.pathname}?role=display&session=${short}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1200);
    });
  }, [sessionId]);

  return (
    <div className="flex h-screen w-screen bg-[#1e1e1e] text-white font-sans overflow-hidden">
      <div className="w-full flex flex-col">
        <header className="flex-shrink-0 bg-[#1a1a1a] p-3 flex items-center justify-between border-b border-gray-700 shadow-md">
          <div className="flex items-center space-x-3">
            {onExit && (
              <button
                onClick={onExit}
                className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold flex items-center space-x-2"
                title="Back"
              >
                <IconX className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <IconSettings className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold">Stream Dashboard</h1>
          </div>
          <div className="text-xs text-center text-gray-400">
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
          <div className="flex items-center gap-2">
            <button
              onClick={copyDisplayLink}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-sm"
              title="Copy display URL"
            >
              {copiedLink ? 'Link Copied' : 'Copy Link'}
            </button>
            <button
              onClick={openDisplayWindow}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-sm font-semibold flex items-center space-x-2"
            >
              <IconVideo className="w-4 h-4" />
              <span>Open Display</span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden flex gap-4 p-4">
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
    </div>
  );
};


export default RemoteControl;
