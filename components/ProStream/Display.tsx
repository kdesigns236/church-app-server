import React, { useState, useEffect, useRef } from 'react';
import VideoPreview from './VideoPreview';
import { IconSettings } from './icons';
import { CameraSlot, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';
import { io, Socket } from 'socket.io-client';


interface DisplayProps {
    sessionId: string;
}


const Display: React.FC<DisplayProps> = ({ sessionId }) => {
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lowerThirdConfig, setLowerThirdConfig] = useState<LowerThirdConfig>({ isVisible: false, topText: '', mainText: '', logoIcon: '', accentColor: '', mainBarColor: '' });
  const [lowerThirdAnimationKey, setLowerThirdAnimationKey] = useState(0);
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig>({ isVisible: false, text: '', fontSize: '', fontFamily: '', textColor: '', textAlign: 'center', backgroundColor: '', backgroundOpacity: 0, animationStyle: 'fade', position: 'bottom' });
  const [lyricsConfig, setLyricsConfig] = useState<LyricsConfig>({ isVisible: false, song: null, verseIndex: 0, fontSize: '', fontFamily: '', textColor: '', textAlign: 'center', backgroundColor: '', backgroundOpacity: 0, animationStyle: 'fade', position: 'bottom' });
  const [bibleVerseConfig, setBibleVerseConfig] = useState<BibleVerseConfig>({ isVisible: false, text: '', reference: '', fontSize: '', fontFamily: '', textColor: '', textAlign: 'center', backgroundColor: '', backgroundOpacity: 0, animationStyle: 'fade', position: 'bottom' });
  const socketRef = useRef<Socket | null>(null);
  const shortSessionIdRef = useRef<string>('');
  
  // Start with the local default camera so the GoLive page shows a feed immediately
  useEffect(() => {
    if (activeStream) return;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        currentStreamRef.current = stream;
        setActiveStream(stream);
      })
      .catch(() => {
        // If permission denied or no device, keep waiting for controller
      });
  }, []);

  useEffect(() => {
    if (!sessionId) return;


    const shortSessionId = (sessionId.split(':')[1] || sessionId).trim();
    shortSessionIdRef.current = shortSessionId;
    const signalingUrl = import.meta.env.VITE_SYNC_SERVER_URL || 'https://church-app-server.onrender.com';
    const socket = io(signalingUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('prostream:join', { sessionId: shortSessionId, role: 'display' });


    const handleSignal = (message: any) => {
      const { type, payload } = message;
      if (type !== 'state-update' || !payload) return;


      if (!isConnected) setIsConnected(true);


      setIsLive(payload.isLive);
      setLowerThirdConfig(payload.lowerThirdConfig);
      setLowerThirdAnimationKey(payload.lowerThirdAnimationKey);
      setAnnouncementConfig(payload.announcementConfig);
      setLyricsConfig(payload.lyricsConfig);
      setBibleVerseConfig(payload.bibleVerseConfig);
      
      const activeSlot = payload.cameraSlots.find((s: CameraSlot) => s.id === payload.activeCameraId);


      if (activeSlot && activeSlot.status === 'connected') {
        if (activeSlot.sourceType === 'local' && activeSlot.device?.id) {
          navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: activeSlot.device.id } } })
            .then(stream => {
              if (currentStreamRef.current && currentStreamRef.current !== stream) {
                currentStreamRef.current.getTracks().forEach(track => track.stop());
              }
              currentStreamRef.current = stream;
              setActiveStream(stream);
            })
            .catch(err => console.error("Display error getting local stream:", err));
        } else if (activeSlot.sourceType === 'remote') {
          // Placeholder remote handling; keep a visible stream
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              if (currentStreamRef.current && currentStreamRef.current !== stream) {
                currentStreamRef.current.getTracks().forEach(track => track.stop());
              }
              currentStreamRef.current = stream;
              setActiveStream(stream);
            })
            .catch(err => console.error("Display error getting remote placeholder:", err));
        }
        // If activeSlot is connected but unknown type, do not clear the current local fallback
      } else {
        // No active slot chosen by controller: keep existing local fallback stream if any
      }
    };


    socket.on('prostream:signal', handleSignal);


    return () => {
      socket.off('prostream:signal', handleSignal);
      socket.disconnect();
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
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
      />
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
