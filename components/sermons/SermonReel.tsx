
import React, { useRef, useEffect, useState } from 'react';
import { Sermon } from '../../types';
import { PlayIcon, SoundOnIcon, SoundOffIcon } from '../../constants/icons';
import { SermonOverlay } from './SermonOverlay';
import { videoStorageService } from '../../services/videoStorageService';
import { auth, storage } from '../../config/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

interface SermonReelProps {
  sermon: Sermon;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isActive?: boolean;
}

export const SermonReel: React.FC<SermonReelProps> = ({ 
  sermon, 
  onLike, 
  onComment, 
  onShare, 
  onSave, 
  isMuted, 
  onToggleMute,
  isActive = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [rotation, setRotation] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load video from cloud or IndexedDB
  useEffect(() => {
    let objectUrl: string | null = null;
        
    const loadVideo = async () => {
      if (!sermon.videoUrl) {
        setVideoSrc('');
        return;
      }

      try {
        // Cloud-hosted videos (Priority)
        if (typeof sermon.videoUrl === 'string' && 
            (sermon.videoUrl.startsWith('http://') || sermon.videoUrl.startsWith('https://'))) {
          console.log('[SermonReel] Loading video from cloud:', sermon.videoUrl);
          // For all URLs (Firebase and Cloudinary)
          if (isMountedRef.current) setVideoSrc(sermon.videoUrl);
          return;
        }

        // IndexedDB videos (Backwards compatibility)
        if (sermon.videoUrl && typeof sermon.videoUrl === 'string' && sermon.videoUrl.startsWith('indexed-db://')) {
          const sermonId = sermon.videoUrl.replace('indexed-db://', '');
          console.log('[SermonReel] ⚠️ Old video format (IndexedDB):', sermonId);
          
          try {
            // Ensure video storage is initialized
            await videoStorageService.initialize();
            
            const url = await videoStorageService.getVideoUrl(sermonId);
                  if (url && isMountedRef.current) {
              objectUrl = url;
              setVideoSrc(url);
              console.log('[SermonReel] Video loaded from IndexedDB (legacy)');
            } else {
              console.error('[SermonReel] Video not found in IndexedDB:', sermonId);
              setVideoSrc('');
            }
          } catch (error) {
            console.error('[SermonReel] Failed to load from IndexedDB:', error);
            setVideoSrc('');
          }
          return;
        }

        // File object
        if (typeof sermon.videoUrl === 'object' && 'name' in sermon.videoUrl) {
          objectUrl = URL.createObjectURL(sermon.videoUrl as File);
          if (isMountedRef.current) setVideoSrc(objectUrl);
          return;
        }

        // Unknown format
        console.error('[SermonReel] Unknown video URL format:', sermon.videoUrl);
        setVideoSrc('');
        
      } catch (error) {
        console.error('[SermonReel] Error loading video:', error);
        if (isMountedRef.current) setVideoSrc('');
      }
    };

    loadVideo();

    return () => {
      isMountedRef.current = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sermon.videoUrl]);

  // Control video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isActive) {
          video.play().catch(() => {
            // Autoplay prevented
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.65 }
    );

    observer.observe(video);

    // Sync isPlaying state with video events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      observer.disconnect();
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoSrc, isActive]);

  const handleVideoPress = () => {
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = parseFloat(e.target.value);
      setCurrentTime(video.currentTime);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="relative w-screen h-screen snap-start snap-always bg-black flex items-center justify-center overflow-hidden">
      {videoSrc ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            key={videoSrc}
            ref={videoRef}
            onClick={handleVideoPress}
            className="max-w-full max-h-full w-auto h-auto transition-all duration-500 cursor-pointer"
            style={{ transform: `rotate(${rotation}deg)` }}
            loop
            playsInline
            muted={isMuted}
            src={videoSrc}
            preload="auto"
            crossOrigin="anonymous"
            aria-label={`Sermon titled ${sermon.title}`}
            onError={async (e) => {
              console.error('Video load error:', e);
              console.log('Video URL:', videoSrc);
              
              // If it's a Firebase URL and auth is required, try to get a fresh URL
              if (videoSrc.includes('firebasestorage.googleapis.com')) {
                try {
                  // Re-attempt anonymous sign in
                  await signInAnonymously(auth);
                  
                  // Get a fresh URL with the new auth token
                  const storagePath = decodeURIComponent(videoSrc.split('/o/')[1].split('?')[0]);
                  const storageRef = ref(storage, storagePath);
                  const freshUrl = await getDownloadURL(storageRef);
                  
                  if (isMountedRef.current) setVideoSrc(freshUrl);
                } catch (authError) {
                  console.error('Failed to refresh video URL:', authError);
                }
              }
            }}
          />
        </div>
      ) : (
        <div className="text-white text-center p-8 animate-fade-in">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
            <svg className="w-24 h-24 mx-auto text-red-500 relative z-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xl font-bold mb-2 text-red-500">No Video Available</p>
          <p className="text-sm text-white/70 mb-1">This sermon doesn't have a video yet.</p>
          <p className="text-xs text-white/50 mt-4 px-4 py-2 bg-white/5 rounded-full inline-block">📹 Admin: Upload in Admin Panel</p>
        </div>
      )}
      
      <SermonOverlay 
        sermon={sermon} 
        onLike={onLike} 
        onComment={onComment}
        onShare={onShare}
        onSave={onSave} 
      />
      
      {/* Center Play Button */}
      {!isPlaying && videoSrc && (
        <button 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-transparent border-none cursor-pointer hover:scale-110 transition-transform active:scale-95"
          onClick={handleVideoPress}
          aria-label="Play video"
        >
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-6 shadow-2xl">
            <PlayIcon className="w-16 h-16 text-white drop-shadow-lg" />
          </div>
        </button>
      )}

      {/* Top Right Controls */}
      <div className="absolute top-5 right-4 z-30 flex flex-col gap-2.5">
        <button 
          onClick={onToggleMute}
          className="p-2.5 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 hover:scale-110 transition-all duration-300 shadow-xl active:scale-95"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? 
            <SoundOffIcon className="w-5 h-5 text-white"/> : 
            <SoundOnIcon className="w-5 h-5 text-red-500"/>
          }
        </button>

        <button 
          onClick={handleRotate}
          className="p-2.5 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 hover:scale-110 transition-all duration-300 shadow-xl active:scale-95"
          aria-label="Rotate video"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button 
          onClick={handleVideoPress}
          className="p-2.5 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 hover:scale-110 transition-all duration-300 shadow-xl active:scale-95"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {showControls && duration > 0 && videoSrc && (
        <div className="absolute bottom-2 left-0 right-0 z-20 px-4 transition-opacity duration-300">
          <div className="bg-gradient-to-t from-black/60 to-transparent pt-3 pb-2 px-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer progress-slider"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)` 
              }}
            />
            <div className="flex justify-between items-center text-white text-xs mt-2 font-semibold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .progress-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .progress-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
};