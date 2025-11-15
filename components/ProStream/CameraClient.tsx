import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IconVideo, IconMic, IconMicOff, IconFlipCamera, IconX } from './icons';


interface CameraClientProps {
  sessionId: string;
  slotId: string;
  onExit: () => void;
}


const RTC_CONFIGURATION = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};


const CameraClient: React.FC<CameraClientProps> = ({ sessionId, slotId, onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);


  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [uiVisible, setUiVisible] = useState(true);



  const startWebRTC = useCallback(async (stream: MediaStream) => {
    if (!channelRef.current) return;
    try {
      peerConnectionRef.current = new RTCPeerConnection(RTC_CONFIGURATION);
      
      stream.getTracks().forEach(track => peerConnectionRef.current?.addTrack(track, stream));
      
      peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
              channelRef.current?.postMessage({ type: 'webrtc-candidate', slotId, payload: event.candidate, target: 'controller' });
          }
      };
      
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      channelRef.current?.postMessage({ type: 'webrtc-offer', slotId, payload: offer });
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facingMode }, width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;


      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      startWebRTC(stream);


    } catch (err) {
      console.error("Error accessing media devices.", err);
      setError("Could not access camera. Please check permissions and try a different camera mode.");
    }
  }, [facingMode, isMuted, startWebRTC]);



  useEffect(() => {
    const shortSessionId = (sessionId.split(':')[1] || sessionId).trim();
    channelRef.current = new BroadcastChannel(shortSessionId);


    const handleMessage = async (event: MessageEvent) => {
        const { type, slotId: msgSlotId, payload, target } = event.data;
        if (target !== 'camera' || msgSlotId.toString() !== slotId) return;


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
    channelRef.current.onmessage = handleMessage;
    
    const handleUnload = () => {
        channelRef.current?.postMessage({ type: 'camera-disconnected', slotId });
    };
    window.addEventListener('beforeunload', handleUnload);


    return () => {
        handleUnload();
        peerConnectionRef.current?.close();
        channelRef.current?.close();
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


  const toggleMute = () => {
      setIsMuted(prev => {
          const newMutedState = !prev;
          if (streamRef.current) {
              streamRef.current.getAudioTracks().forEach(track => track.enabled = !newMutedState);
          }
          return newMutedState;
      });
  };


  const flipCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };


  return (
    <div
      className="relative h-screen w-screen bg-black flex items-center justify-center text-white font-sans cursor-pointer"
      onClick={() => setUiVisible(prev => !prev)}
    >
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
      
      {/* UI Overlay Container */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()} 
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"></div>


        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center" style={{textShadow: '0 1px 5px rgba(0,0,0,0.5)'}}>
          <div className="flex items-center space-x-2 p-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/10">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold tracking-wider text-green-300 text-xs uppercase">LIVE</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-200">Slot {slotId}</span>
          </div>
          <button
            onClick={onExit}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
            title="Exit Camera Mode"
            aria-label="Exit Camera Mode"
          >
            <IconX className="w-6 h-6" />
          </button>
        </div>


        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-4 right-4 flex justify-center items-center space-x-4">
            <button 
                onClick={toggleMute}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white transition-colors hover:bg-white/20 active:bg-white/30"
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
                {isMuted ? <IconMicOff className="w-8 h-8"/> : <IconMic className="w-8 h-8"/>}
            </button>
            <div 
                className="w-20 h-20 rounded-full flex items-center justify-center bg-red-600/80 border-4 border-white/20 shadow-lg"
                aria-label="Recording indicator"
            >
                 <div className="w-16 h-16 bg-red-600 rounded-full"></div>
            </div>
            <button 
                onClick={flipCamera}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white transition-colors hover:bg-white/20 active:bg-white/30"
                aria-label="Flip camera"
            >
                <IconFlipCamera className="w-8 h-8"/>
            </button>
        </div>
      </div>


      {error && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-10">
            <IconVideo className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Camera Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button onClick={startCamera} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Try Again</button>
        </div>
      )}
    </div>
  );
};


export default CameraClient;
