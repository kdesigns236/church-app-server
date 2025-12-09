
import React, { useRef, useEffect, useState } from 'react';
import { Sermon } from '../../types';
import { FaSyncAlt } from 'react-icons/fa';
import { videoStorageService } from '../../services/videoStorageService';
import { backgroundDownloadService } from '../../services/backgroundDownloadService';
import { auth, storage } from '../../config/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

interface SermonReelProps {
  sermon: Sermon;
  isActive?: boolean;
  showChrome?: boolean;
  onUserInteraction?: () => void;
  preloadHint?: 'none' | 'metadata' | 'auto';
}

export const SermonReel: React.FC<SermonReelProps> = ({ 
  sermon, 
  isActive = true,
  showChrome = true,
  onUserInteraction,
  preloadHint = 'metadata',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [objectFit, setObjectFit] = useState<'cover' | 'contain'>('cover');
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const isMountedRef = useRef(true);
  const [embedType, setEmbedType] = useState<null | 'youtube' | 'vimeo'>(null);
  const [embedId, setEmbedId] = useState<string>('');
  const [muted, setMuted] = useState(true);

  const parseYouTubeId = (url: string): string | null => {
    try {
      if (url.includes('youtube.com/watch')) {
        const u = new URL(url);
        return u.searchParams.get('v');
      }
      if (url.includes('youtube.com/shorts/')) {
        const m = url.match(/youtube\.com\/shorts\/([^?&#/]+)/i);
        return m ? m[1] : null;
      }
      if (url.includes('youtu.be/')) {
        const m = url.match(/youtu\.be\/([^?&#/]+)/i);
        return m ? m[1] : null;
      }
      if (url.includes('youtube.com/embed/')) {
        const parts = url.split('/embed/');
        return parts[1]?.split(/[?&#]/)[0] || null;
      }
      return null;
    } catch { return null; }
  };

  const parseVimeoId = (url: string): string | null => {
    try {
      const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return m ? m[1] : null;
    } catch { return null; }
  };

  const normalizeFirebasePublicUrl = (u: string): string => {
    try {
      if (typeof u !== 'string') return u as any;
      if (u.includes('firebasestorage.googleapis.com')) {
        return u.replace(/\/(b)\/([^/]+)\//, (_m, g1, bucket) => {
          const fixed = String(bucket).replace('.firebasestorage.app', 'appspot.com');
          return `/${g1}/${fixed}/`;
        });
      }
      return u;
    } catch { return u; }
  };

  const resolveFirebaseDownloadUrl = async (maybePath: string): Promise<string | null> => {
    try {
      // Ensure anonymous auth for tokens
      try { await signInAnonymously(auth); } catch {}
      const r = ref(storage, maybePath);
      const u = await getDownloadURL(r);
      return u || null;
    } catch {
      return null;
    }
  };

  // Load video from cloud or IndexedDB (only when active)
  useEffect(() => {
    let objectUrl: string | null = null;
    const pickSermonUrl = (s: any): string | null => {
      const candidates: any[] = [
        s?.videoUrl,
        s?.video?.url,
        s?.video?.link,
        s?.url,
        s?.media?.url,
        s?.storagePath,
        s?.firebaseStoragePath,
        s?.videoPath,
        s?.filePath,
        s?.video?.storagePath,
        s?.video?.path,
        (s?.video?.bucket && s?.video?.path) ? `gs://${s.video.bucket}/${s.video.path}` : null,
        Array.isArray(s?.sources) ? s.sources.find((x: any) => typeof x === 'string' && x) : null,
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim().length > 0) return c.trim();
      }
      return null;
    };
        
    const loadVideo = async () => {
      try {
        // Do not load when not active to keep memory low on mobile
        if (!isActive) {
          setVideoSrc('');
          return;
        }
        const rawUrlUnnorm = pickSermonUrl(sermon);
        const rawUrl = typeof rawUrlUnnorm === 'string' ? normalizeFirebasePublicUrl(rawUrlUnnorm) : rawUrlUnnorm;

        // Detect common providers (YouTube, Vimeo)
        if (typeof rawUrl === 'string') {
          const yt = parseYouTubeId(rawUrl);
          if (yt) {
            setEmbedType('youtube');
            setEmbedId(yt);
            setVideoSrc('');
            return;
          }
          const vm = parseVimeoId(rawUrl);
          if (vm) {
            setEmbedType('vimeo');
            setEmbedId(vm);
            setVideoSrc('');
            return;
          }
        }
        // Set remote URL immediately for faster first frame (direct files)
        if (typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
          if (isMountedRef.current) setVideoSrc(rawUrl);
        } else if (typeof rawUrl === 'string') {
          // Try resolving Firebase Storage paths (gs://bucket/path or plain path)
          const resolved = await resolveFirebaseDownloadUrl(rawUrl);
          if (resolved && isMountedRef.current) {
            setVideoSrc(resolved);
            return;
          }
        }
        // Prefer native-downloaded file if available
        if (sermon.id) {
          try {
            const localPath = await backgroundDownloadService.getWebSrcIfDownloaded(String(sermon.id));
            if (localPath && isMountedRef.current) {
              objectUrl = localPath;
              setVideoSrc(localPath);
              return;
            }
          } catch {}
        }

        // Prefer cached offline video from IndexedDB if available
        if (sermon.id) {
          try {
            console.log('[SermonReel] Checking for cached video for sermon', sermon.id);
            const cachedUrl = await videoStorageService.getVideoUrl(String(sermon.id));
            if (cachedUrl && isMountedRef.current) {
              objectUrl = cachedUrl;
              setVideoSrc(cachedUrl);
              console.log('[SermonReel] Playing cached offline video for sermon', sermon.id);
              return;
            }
          } catch (e) {
            console.error('[SermonReel] Error checking cached video:', e);
          }
        }

        if (!rawUrl) {
          setVideoSrc('');
          return;
        }

        // Cloud-hosted videos (fallback when no cached copy)
        if (typeof rawUrl === 'string' && 
            (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
          console.log('[SermonReel] Loading video from cloud:', rawUrl);
          if (isMountedRef.current) setVideoSrc(rawUrl);
          return;
        }
        // Firebase storage path fallback
        if (typeof rawUrl === 'string') {
          const resolved = await resolveFirebaseDownloadUrl(rawUrl);
          if (resolved && isMountedRef.current) {
            setVideoSrc(resolved);
            return;
          }
        }

        // IndexedDB videos (Backwards compatibility for legacy indexed-db:// URLs)
        if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('indexed-db://')) {
          const sermonId = rawUrl.replace('indexed-db://', '');
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
        const maybeFile: any = (sermon as any)?.videoUrl;
        if (maybeFile && typeof maybeFile === 'object' && 'name' in maybeFile) {
          objectUrl = URL.createObjectURL(maybeFile as File);
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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sermon.videoUrl, isActive]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // When becoming inactive, aggressively unload the video to free memory
  useEffect(() => {
    if (!isActive) {
      try {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.removeAttribute('src');
          v.load();
        }
      } catch {}
    }
  }, [isActive]);

  // Track orientation to adjust layout (fullscreen video in landscape)
  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window === 'undefined') return;

      let landscape = false;

      if (window.matchMedia) {
        try {
          const mq = window.matchMedia('(orientation: landscape)');
          landscape = mq.matches;
        } catch {
          // Ignore matchMedia errors and fall back to dimensions
        }
      }

      if (!landscape) {
        landscape = window.innerWidth > window.innerHeight;
      }

      setIsLandscape(landscape);
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Compute best-fit strategy based on intrinsic video dimensions and screen orientation
  useEffect(() => {
    setObjectFit(isLandscape || rotation % 180 !== 0 ? 'cover' : 'contain');
  }, [isLandscape, rotation]);

  const gcd = (a: number, b: number): number => {
    return b ? gcd(b, a % b) : Math.abs(a);
  };
  const getAspectLabel = (w: number, h: number): string => '';

  const tryAutoplay = async (v: HTMLVideoElement) => {
    try { v.muted = true; await v.play(); } catch {}
  };

  const updateObjectFitFromVideo = () => {
    try {
      const v = videoRef.current;
      if (!v) return;
      const w = v.videoWidth || 0;
      const h = v.videoHeight || 0;
      if (!w || !h) return;
      const fit = (isLandscape || rotation % 180 !== 0) ? 'cover' : 'contain';
      setObjectFit(fit);
    } catch {}
  };

  // Minimal playback events (no auto-play / intersection)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handlePlay = () => { setIsPlaying(true); setIsBuffering(false); };
    const handlePause = () => { setIsPlaying(false); };
    const handleEnded = () => { setIsPlaying(false); };
    const handleCanPlay = () => { setIsReady(true); setIsBuffering(false); };
    const handleWaiting = () => { setIsBuffering(true); };
    const handlePlaying = () => { setIsReady(true); setIsBuffering(false); };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    if (isActive) {
      tryAutoplay(v);
    } else {
      try { v.pause(); } catch {}
    }
  }, [isActive, videoSrc]);

  useEffect(() => {
    updateObjectFitFromVideo();
  }, [rotation, isLandscape]);

  const handleVideoPress = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) { setMuted(false); try { v.muted = false; v.play(); } catch {} }
    else { if (isPlaying) v.pause(); else v.play(); }
    if (onUserInteraction) onUserInteraction();
  };

  const handlePointerDown = () => { if (onUserInteraction) onUserInteraction(); };

  

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const isFullScreenMode = isLandscape || rotation % 180 !== 0;

  return (
    <div className="relative snap-start snap-always bg-black flex items-center justify-center overflow-hidden" style={{ width: 'var(--app-vw, 100vw)', height: 'var(--app-vh, 100vh)' }}>
      {embedType ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {embedType === 'youtube' && (
            <iframe
              title={sermon.title}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${embedId}?playsinline=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: '0' }}
            />
          )}
          {embedType === 'vimeo' && (
            <iframe
              title={sermon.title}
              width="100%"
              height="100%"
              src={`https://player.vimeo.com/video/${embedId}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ border: '0' }}
            />
          )}
          <div className="absolute left-3 right-auto max-w-[80%] text-white bg-black/40 backdrop-blur-sm rounded-md p-3 pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}>
            <div className="text-sm font-semibold truncate">{sermon.title}</div>
            <div className="text-xs opacity-90 truncate">{sermon.pastor}</div>
            {sermon.scripture ? (
              <div className="text-xs opacity-80 truncate">{sermon.scripture}</div>
            ) : null}
          </div>
        </div>
      ) : videoSrc ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            key={videoSrc}
            ref={videoRef}
            onClick={handleVideoPress}
            onTouchEnd={handleVideoPress}
            onTouchStart={handlePointerDown}
            onPointerDown={handlePointerDown}
            className={`transition-all duration-500 cursor-pointer w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
            style={{ transform: `rotate(${rotation}deg)`, touchAction: 'manipulation' }}
            autoPlay
            controls
            playsInline
            muted={muted}
            src={videoSrc}
            preload={preloadHint}
            onLoadedMetadata={updateObjectFitFromVideo}
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
          <div className="absolute left-3 right-auto max-w-[80%] text-white bg-black/40 backdrop-blur-sm rounded-md p-3 pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}>
            <div className="text-sm font-semibold truncate">{sermon.title}</div>
            <div className="text-xs opacity-90 truncate">{sermon.pastor}</div>
            {sermon.scripture ? (
              <div className="text-xs opacity-80 truncate">{sermon.scripture}</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-white text-center p-6">No video for this sermon.</div>
      )}
      {/* Rotate button (top-right) */}
      <div className="absolute top-5 right-4 z-30" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}>
        <button 
          onClick={handleRotate}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(148,163,184,0.8)] hover:bg-black/80 hover:shadow-[0_0_26px_rgba(148,163,184,1)] hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Rotate video"
        >
          <FaSyncAlt className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};