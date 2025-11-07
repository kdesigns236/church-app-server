import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../constants/icons';
import { websocketService } from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';

// Video tile component for each participant
const VideoTile: React.FC<{ 
  participant: { id: string; name: string; stream?: MediaStream };
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}> = ({ participant, isLocal = false, isMuted = false, isVideoOff = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      const video = videoRef.current;
      video.srcObject = participant.stream;
      
      // Prevent video from pausing
      const handlePause = () => {
        if (!isVideoOff) {
          video.play().catch(err => {
            if (err.name !== 'AbortError') {
              console.error('Auto-play error:', err);
            }
          });
        }
      };
      
      video.addEventListener('pause', handlePause);
      
      // Small delay to prevent play interruption
      setTimeout(() => {
        video.play().catch(err => {
          // Ignore AbortError - it's expected when stream changes
          if (err.name !== 'AbortError') {
            console.error('Play error:', err);
          }
        });
      }, 100);
      
      return () => {
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [participant.stream, isVideoOff]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-[9/16]">
      {!isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className="w-full h-full object-cover"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      
      {/* Name label */}
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-white text-xs font-medium">
        {participant.name} {isLocal && '(You)'}
      </div>
      
      {/* Muted indicator */}
      {isMuted && isLocal && (
        <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Calculate grid layout based on participant count
const getGridLayout = (count: number) => {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4'; // 10+ participants
};

// ICE servers configuration for WebRTC (STUN + TURN for NAT traversal)
const iceServers = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN servers for relay (when direct connection fails)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLocalMinimized, setIsLocalMinimized] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; stream?: MediaStream }>>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const roomIdRef = useRef<string>('community-meeting'); // Fixed room for now

  useEffect(() => {
    // Cleanup function to release camera when component unmounts
    return () => {
      console.log('[VideoCall] Component unmounting, cleaning up...');
      
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[VideoCall] Stopped track:', track.kind);
        });
        localStreamRef.current = null;
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      
      // Leave room
      const socket = websocketService.getSocket();
      socket.emit('leave-room');
    };
  }, []);

  useEffect(() => {
    // Setup Socket.io listeners for WebRTC signaling
    const socket = websocketService.getSocket();
    
    // When existing participants are sent to us
    socket.on('existing-participants', (existingParticipants: Array<{ userId: string; userName: string }>) => {
      console.log('[VideoCall] ✅ Received existing participants:', existingParticipants.length);
      console.log('[VideoCall] Participants:', existingParticipants);
      if (existingParticipants.length === 0) {
        console.log('[VideoCall] ⚠️ No one else in the room yet');
      }
      existingParticipants.forEach(participant => {
        console.log(`[VideoCall] 🔗 Connecting to: ${participant.userName} (${participant.userId})`);
        createPeerConnection(participant.userId, participant.userName, true);
      });
    });

    // When a new user joins
    socket.on('user-joined', ({ userId, userName }: { userId: string; userName: string }) => {
      console.log('[VideoCall] ✅ New user joined:', userName, userId);
      createPeerConnection(userId, userName, false);
    });

    // When we receive an offer
    socket.on('offer', async ({ offer, fromUserId, fromUserName }: any) => {
      console.log('[VideoCall] Received offer from:', fromUserName);
      await handleOffer(offer, fromUserId, fromUserName);
    });

    // When we receive an answer
    socket.on('answer', async ({ answer, fromUserId }: any) => {
      console.log('[VideoCall] Received answer from:', fromUserId);
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // When we receive an ICE candidate
    socket.on('ice-candidate', async ({ candidate, fromUserId }: any) => {
      console.log('[VideoCall] Received ICE candidate from:', fromUserId);
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // When a user leaves
    socket.on('user-left', ({ userId }: { userId: string }) => {
      console.log('[VideoCall] User left:', userId);
      removePeerConnection(userId);
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    // Cleanup on unmount
    return () => {
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      
      // Leave room
      socket.emit('leave-room');
    };
  }, []);

  const startCall = async () => {
    try {
      console.log('[VideoCall] Requesting camera and microphone access...');
      
      // Get user media (camera + microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      console.log('[VideoCall] ✅ Got media stream');
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force play on mobile
        try {
          await localVideoRef.current.play();
          console.log('[VideoCall] ✅ Video playing');
        } catch (playError) {
          console.error('[VideoCall] Play error:', playError);
        }
      }

      setIsCallActive(true);
      
      // Add yourself as first participant
      setParticipants([{ id: 'local', name: user?.name || 'You', stream }]);
      
      // Join the room via Socket.io - this will automatically connect to anyone already in the room
      const socket = websocketService.getSocket();
      console.log('[VideoCall] 🔍 Looking for active participants in room...');
      console.log('[VideoCall] Socket connected:', socket.connected);
      console.log('[VideoCall] Socket ID:', socket.id);
      console.log('[VideoCall] Room ID:', roomIdRef.current);
      console.log('[VideoCall] User name:', user?.name || 'Anonymous');
      
      socket.emit('join-room', {
        roomId: roomIdRef.current,
        userName: user?.name || 'Anonymous'
      });
      
      // Send notification to all members (not just those in the room)
      socket.emit('meeting-started', {
        userName: user?.name || 'Anonymous',
        roomId: roomIdRef.current
      });
      
      console.log('[VideoCall] ✅ Joined room and searching for participants:', roomIdRef.current);
      
    } catch (error) {
      console.error('[VideoCall] Error accessing media devices:', error);
      alert(`Could not access camera/microphone: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check permissions in your browser settings.`);
    }
  };

  // Create a peer connection for a remote user
  const createPeerConnection = async (userId: string, userName: string, shouldCreateOffer: boolean) => {
    try {
      console.log(`[VideoCall] Creating peer connection for ${userName}`);
      
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionsRef.current.set(userId, peerConnection);

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        console.log(`[VideoCall] Received remote track from ${userName}`);
        const remoteStream = event.streams[0];
        
        setParticipants(prev => {
          const existing = prev.find(p => p.id === userId);
          if (existing) {
            return prev.map(p => p.id === userId ? { ...p, stream: remoteStream } : p);
          } else {
            return [...prev, { id: userId, name: userName, stream: remoteStream }];
          }
        });
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[VideoCall] Sending ICE candidate to ${userName}`);
          websocketService.getSocket().emit('ice-candidate', {
            candidate: event.candidate,
            targetUserId: userId
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`[VideoCall] Connection state with ${userName}:`, peerConnection.connectionState);
      };

      // If we should create an offer (we're the initiator)
      if (shouldCreateOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        console.log(`[VideoCall] Sending offer to ${userName}`);
        websocketService.getSocket().emit('offer', {
          offer,
          targetUserId: userId
        });
      }

    } catch (error) {
      console.error(`[VideoCall] Error creating peer connection for ${userName}:`, error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string, fromUserName: string) => {
    try {
      let peerConnection = peerConnectionsRef.current.get(fromUserId);
      
      if (!peerConnection) {
        // Create peer connection if it doesn't exist
        peerConnection = new RTCPeerConnection(iceServers);
        peerConnectionsRef.current.set(fromUserId, peerConnection);

        // Add local stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            peerConnection!.addTrack(track, localStreamRef.current!);
          });
        }

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          console.log(`[VideoCall] Received remote track from ${fromUserName}`);
          const remoteStream = event.streams[0];
          
          setParticipants(prev => {
            const existing = prev.find(p => p.id === fromUserId);
            if (existing) {
              return prev.map(p => p.id === fromUserId ? { ...p, stream: remoteStream } : p);
            } else {
              return [...prev, { id: fromUserId, name: fromUserName, stream: remoteStream }];
            }
          });
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            websocketService.getSocket().emit('ice-candidate', {
              candidate: event.candidate,
              targetUserId: fromUserId
            });
          }
        };
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`[VideoCall] Sending answer to ${fromUserName}`);
      websocketService.getSocket().emit('answer', {
        answer,
        targetUserId: fromUserId
      });

    } catch (error) {
      console.error(`[VideoCall] Error handling offer from ${fromUserName}:`, error);
    }
  };

  // Remove peer connection
  const removePeerConnection = (userId: string) => {
    const peerConnection = peerConnectionsRef.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(userId);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCallActive(false);
    navigate(-1);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        // Toggle enabled state (this keeps the track alive, just stops sending video)
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setIsVideoOff(!newState);
        console.log(`[VideoCall] Video ${newState ? 'ON' : 'OFF'}`);
        
        // Always ensure video element is playing (even when track is disabled)
        if (localVideoRef.current) {
          // Check if video is paused and restart it
          if (localVideoRef.current.paused) {
            localVideoRef.current.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error('[VideoCall] Error playing video:', err);
              }
            });
          }
        }
      }
    }
  };

  const flipCamera = async () => {
    try {
      console.log('[VideoCall] 🔄 Attempting to flip camera...');
      
      // Check if device has multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`[VideoCall] Found ${videoDevices.length} video devices:`, videoDevices.map(d => d.label));
      
      if (videoDevices.length < 2) {
        console.warn('[VideoCall] Only one camera available');
        alert('Your device only has one camera.');
        return;
      }
      
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      console.log(`[VideoCall] Switching from ${facingMode} to ${newFacingMode}`);
      
      // Remember current states
      const wasVideoOff = isVideoOff;
      const wasMuted = isMuted;
      
      // Stop current stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`[VideoCall] Stopping ${track.kind} track`);
          track.stop();
        });
      }
      
      // Try with ideal facingMode first (more flexible)
      let stream: MediaStream | null = null;
      
      try {
        console.log(`[VideoCall] Requesting camera with facingMode: ${newFacingMode}`);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: newFacingMode, // Use ideal, not exact
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
      } catch (error) {
        console.error('[VideoCall] Failed with ideal facingMode, trying without constraints:', error);
        // Fallback: try without facingMode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
      }
      
      if (!stream) {
        throw new Error('Failed to get media stream');
      }
      
      localStreamRef.current = stream;
      setFacingMode(newFacingMode);
      
      // Restore video on/off state
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !wasVideoOff;
      }
      
      // Restore mute state
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !wasMuted;
        console.log(`[VideoCall] Audio track enabled: ${!wasMuted}`);
      }
      
      console.log(`[VideoCall] Video track enabled: ${!wasVideoOff}`);
      
      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
        console.log('[VideoCall] Local video element updated');
      }
      
      // Update participants list with new stream
      setParticipants(prev => 
        prev.map(p => p.id === 'local' ? { ...p, stream } : p)
      );
      
      // Replace tracks in all peer connections
      console.log(`[VideoCall] Updating ${peerConnectionsRef.current.size} peer connections...`);
      peerConnectionsRef.current.forEach((peerConnection, peerId) => {
        const senders = peerConnection.getSenders();
        
        // Replace video track
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
          console.log(`[VideoCall] Replaced video track for peer ${peerId}`);
        }
        
        // Replace audio track
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        if (audioSender && audioTrack) {
          audioSender.replaceTrack(audioTrack);
          console.log(`[VideoCall] Replaced audio track for peer ${peerId}`);
        }
      });
      
      console.log('[VideoCall] ✅ Camera flipped successfully to:', newFacingMode);
    } catch (error) {
      console.error('[VideoCall] ❌ Error flipping camera:', error);
      
      // Try to restore previous stream if flip failed
      if (localStreamRef.current) {
        console.log('[VideoCall] Attempting to restore previous stream...');
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
          localStreamRef.current = fallbackStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = fallbackStream;
            await localVideoRef.current.play();
          }
          console.log('[VideoCall] ✅ Restored previous stream');
        } catch (restoreError) {
          console.error('[VideoCall] Failed to restore stream:', restoreError);
        }
      }
      
      alert(`Could not flip camera: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure your device has multiple cameras and permissions are granted.`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Back button only */}
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-4 left-4 z-50 p-3 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors"
        style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <ArrowLeftIcon className="w-6 h-6 text-white" />
      </button>

      {/* Video Grid */}
      <div className="flex-1 relative bg-black">
        {!isCallActive ? (
          // Pre-call screen
          <div className="h-full flex flex-col items-center justify-center text-white p-8">
            <div className="mb-8 text-center">
              <svg className="w-24 h-24 mx-auto mb-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Ready to join?</h2>
              <p className="text-gray-400">Start the video call with your community</p>
            </div>
            
            <button
              onClick={startCall}
              className="px-8 py-4 bg-secondary text-primary rounded-full font-bold text-lg hover:bg-gold-light transition-colors"
            >
              Join Meeting
            </button>
          </div>
        ) : (
          // Active call screen with grid
          <div className="h-full w-full p-4 overflow-y-auto">
            {/* Participants indicator */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm">
              <span className="font-bold">{participants.length}</span> participant{participants.length > 1 ? 's' : ''}
            </div>

            {/* Video Grid */}
            <div className={`grid ${getGridLayout(isLocalMinimized ? participants.length - 1 : participants.length)} gap-2 h-full w-full`}>
              {participants
                .filter(p => !isLocalMinimized || p.id !== 'local')
                .map((participant) => (
                  <VideoTile
                    key={participant.id}
                    participant={participant}
                    isLocal={participant.id === 'local'}
                    isMuted={participant.id === 'local' ? isMuted : false}
                    isVideoOff={participant.id === 'local' ? isVideoOff : false}
                  />
                ))}
            </div>
            
            {/* Minimized local video (small corner) */}
            {isLocalMinimized && (
              <div className="absolute bottom-20 right-4 w-24 h-32 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-secondary">
                <VideoTile
                  participant={participants.find(p => p.id === 'local')!}
                  isLocal={true}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {isCallActive && (
        <div className="p-6 bg-gray-800 flex items-center justify-center gap-4">
          {/* Flip camera button */}
          <button
            onClick={flipCamera}
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Flip camera"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Minimize my video button */}
          <button
            onClick={() => setIsLocalMinimized(!isLocalMinimized)}
            className={`p-4 rounded-full transition-colors ${
              isLocalMinimized ? 'bg-secondary hover:bg-gold-light' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isLocalMinimized ? 'Show my video' : 'Minimize my video'}
          >
            {isLocalMinimized ? (
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            )}
          </button>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* End call button */}
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>

          {/* Video toggle button */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
