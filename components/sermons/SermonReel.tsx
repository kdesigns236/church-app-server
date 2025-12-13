
import React, { useRef, useEffect, useState } from 'react';
import { Sermon } from '../../types';
import { FaVolumeMute, FaVolumeUp, FaArrowDown, FaExpand, FaCompress } from 'react-icons/fa';
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
  const [isLandscape, setIsLandscape] = useState(false);
  const [objectFit, setObjectFit] = useState<'cover' | 'contain'>('cover');
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const isMountedRef = useRef(true);
  const [embedType, setEmbedType] = useState<null | 'youtube' | 'vimeo'>(null);
  const [embedId, setEmbedId] = useState<string>('');
  const [muted, setMuted] = useState(true);
  const playPauseTimer = useRef<number | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const hlsRef = useRef<any>(null);
  const [showProgress, setShowProgress] = useState(false);
  const progressHideRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const draggingRef = useRef(false);
  const bufferingTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cachedOnceRef = useRef(false);
  const fallbackTriedRef = useRef(false);
  const wantUnmuteRef = useRef(false);
  const retryOnceRef = useRef(false);

  // Sync fullscreen state with document and persist to localStorage
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      try { localStorage.setItem('sermonFS', fs ? '1' : '0'); } catch {}
    };
    document.addEventListener('fullscreenchange', onFsChange);
    // Initialize from localStorage (state only; actual re-entry may be blocked without user gesture)
    try { const ls = localStorage.getItem('sermonFS'); if (ls === '1') setIsFullscreen(true); } catch {}
    return () => { document.removeEventListener('fullscreenchange', onFsChange); };
  }, []);

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

  const handleLoadedMetadata = () => {
    try {
      updateObjectFitFromVideo();
      const v = videoRef.current;
      if (!v) return;
      if (v.currentTime < 0.01) {
        try { v.currentTime = 0.01; } catch {}
      }
      try {
        setDurationSec(isFinite(v.duration) ? v.duration : 0);
        setCurrentSec(v.currentTime || 0);
      } catch {}
    } catch {}
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
          let b = String(bucket);
          b = b.replace('.firebasestorage.app', '.appspot.com');
          if (b.endsWith('appspot.com') && !b.includes('.appspot.com')) {
            b = b.replace('appspot.com', '.appspot.com');
          }
          return `/${g1}/${b}/`;
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

  // Load video source only when this reel is active to avoid loading all sermons
  useEffect(() => {
    if (!isActive) {
      // Do not resolve or set video source when not active
      return;
    }
    let objectUrl: string | null = null;
    const pickSermonUrl = (s: any): string | null => {
      const candidates: any[] = [
        s?.hlsUrl,
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
        // Prefer native-downloaded file if available (fastest)
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
            const cachedUrl = await videoStorageService.getVideoUrl(String(sermon.id));
            if (cachedUrl && isMountedRef.current) {
              objectUrl = cachedUrl;
              setVideoSrc(cachedUrl);
              return;
            }
          } catch {}
        }

        // Remote URL fallback
        if (typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
          if (rawUrl.includes('firebasestorage.googleapis.com') && rawUrl.includes('/o/')) {
            try { await signInAnonymously(auth); } catch {}
            try {
              const enc = rawUrl.split('/o/')[1]?.split('?')[0] || '';
              const p = decodeURIComponent(enc);
              if (p) {
                const fresh = await getDownloadURL(ref(storage, p));
                if (fresh && isMountedRef.current) { setVideoSrc(fresh); return; }
              }
            } catch {}
          }
          if (isMountedRef.current) { setVideoSrc(rawUrl); return; }
        } else if (typeof rawUrl === 'string') {
          const resolved = await resolveFirebaseDownloadUrl(rawUrl);
          if (resolved && isMountedRef.current) {
            setVideoSrc(resolved);
            return;
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
    fallbackTriedRef.current = false;
    loadVideo();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sermon.id, isActive]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Preconnect and preload only for active reel to prevent mass loading on scroll
  useEffect(() => {
    if (!videoSrc || !isActive) return;
    let preconnectEl: HTMLLinkElement | null = null;
    let preloadEl: HTMLLinkElement | null = null;
    try {
      const u = new URL(videoSrc, window.location.href);
      preconnectEl = document.createElement('link');
      preconnectEl.rel = 'preconnect';
      preconnectEl.href = u.origin;
      preconnectEl.crossOrigin = 'anonymous';
      document.head.appendChild(preconnectEl);

      preloadEl = document.createElement('link');
      preloadEl.rel = 'preload';
      const isHls = /\.m3u8(\?.*)?$/i.test(videoSrc);
      if (isHls) {
        // For HLS manifests, preload as fetch so the manifest is available instantly for hls.js
        (preloadEl as any).as = 'fetch';
        (preloadEl as any).crossOrigin = 'anonymous';
        (preloadEl as any).type = 'application/x-mpegURL';
        preloadEl.href = videoSrc;
      } else {
        (preloadEl as any).as = 'video';
        preloadEl.href = videoSrc;
      }
      document.head.appendChild(preloadEl);
    } catch {}
    return () => {
      try { if (preconnectEl && preconnectEl.parentNode) preconnectEl.parentNode.removeChild(preconnectEl); } catch {}
      try { if (preloadEl && preloadEl.parentNode) preloadEl.parentNode.removeChild(preloadEl); } catch {}
    };
  }, [videoSrc, isActive]);

  // Opportunistically pre-warm HLS manifest only for the active reel
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const warm = async () => {
      try {
        const src = videoSrc;
        if (!isActive || !src || !/\.m3u8(\?.*)?$/i.test(src)) return;
        // Fetch master playlist
        const masterRes = await fetch(src, { cache: 'force-cache', mode: 'cors', signal: controller.signal });
        if (!masterRes.ok) return;
        const master = await masterRes.text();
        if (aborted) return;
        // Find first variant URL (non-comment line)
        const vLine = (master.split(/\r?\n/).find(l => l && !l.trim().startsWith('#')) || '').trim();
        if (!vLine) return;
        const variantUrl = new URL(vLine, src).toString();
        // Fetch variant playlist
        const varRes = await fetch(variantUrl, { cache: 'force-cache', mode: 'cors', signal: controller.signal });
        if (!varRes.ok) return;
        const variant = await varRes.text();
        if (aborted) return;
        // Warm the first media segment (first non-comment line)
        const segLine = (variant.split(/\r?\n/).find(l => l && !l.trim().startsWith('#')) || '').trim();
        if (!segLine) return;
        const segUrl = new URL(segLine, variantUrl).toString();
        // Fire and forget; do not block UI
        fetch(segUrl, { cache: 'force-cache', mode: 'cors' }).catch(() => {});
      } catch {}
    };
    warm();
    return () => { aborted = true; try { controller.abort(); } catch {} };
  }, [videoSrc, isActive]);

  // HLS (.m3u8) fallback using hls.js with robust CDN/timeout fallback — only attach when active
  useEffect(() => {
    const v = videoRef.current;
    const src = videoSrc;
    if (!v || !src) return;
    if (!isActive) {
      // If not active, ensure any existing HLS instance is cleaned up
      try { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } } catch {}
      return;
    }
    const isHls = /\.m3u8(\?.*)?$/i.test(src);
    const canNative = v.canPlayType && v.canPlayType('application/vnd.apple.mpegurl');
    let cancelled = false;
    let currentScript: HTMLScriptElement | null = null;
    let timer: any = null;
    const cleanup = () => {
      try { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } } catch {}
      if (currentScript && currentScript.parentNode) { try { currentScript.parentNode.removeChild(currentScript); } catch {} }
      if (timer) { try { window.clearTimeout(timer); } catch {} }
    };
    if (!isHls) { cleanup(); return; }
    if (canNative) {
      try { v.src = src; } catch {}
      return () => { /* native */ };
    }

    const tryNonHlsFallback = async () => {
      if (fallbackTriedRef.current) return;
      fallbackTriedRef.current = true;
      try {
        const storagePaths: (string | null | undefined)[] = [
          (sermon as any)?.firebaseStoragePath,
          (sermon as any)?.storagePath,
          (sermon as any)?.video?.storagePath,
        ];
        for (const p of storagePaths) {
          if (typeof p === 'string' && p.trim()) {
            const fresh = await resolveFirebaseDownloadUrl(p.trim());
            if (fresh && isMountedRef.current) { setIsBuffering(false); setIsReady(false); setVideoSrc(fresh); return; }
          }
        }
        const fbCandidates: any[] = [
          (sermon as any)?.fullSermonUrl,
          (sermon as any)?.videoUrl,
          (sermon as any)?.video?.url,
          (sermon as any)?.url,
          (sermon as any)?.media?.url,
        ];
        const fb = fbCandidates.find((u) => typeof u === 'string' && /^https?:\/\//i.test(u) && !/\.m3u8(\?.*)?$/i.test(u));
        if (fb) { setIsBuffering(false); setIsReady(false); setVideoSrc(fb); return; }
      } catch {}
    };

    const attachHls = () => {
      try {
        if ((window as any).Hls && (window as any).Hls.isSupported()) {
          const HlsCtor = (window as any).Hls;
          const hls = new HlsCtor({
            enableWorker: true,
            lowLatencyMode: false,
            startLevel: 0,
            capLevelToPlayerSize: true,
            maxBufferLength: 30,
            backBufferLength: 30,
            liveSyncDuration: 3,
            startFragPrefetch: true,
            abrEwmaDefaultEstimate: 800000,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 20000,
          });
          hlsRef.current = hls;
          hls.attachMedia(v);
          hls.on((window as any).Hls.Events.MEDIA_ATTACHED, () => {
            if (cancelled) return;
            try { hls.loadSource(src); } catch {}
          });
          try {
            hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
              try { if (isFinite(v.duration)) setDurationSec(v.duration); } catch {}
              if (isActive) { try { v.play().catch(() => {}); } catch {} }
              setIsReady(true); setIsBuffering(false);
            });
            hls.on(HlsCtor.Events.LEVEL_LOADED, (_e: any, data: any) => {
              const total = data && data.details && data.details.totalduration;
              if (typeof total === 'number' && isFinite(total)) setDurationSec(total);
            });
            hls.on(HlsCtor.Events.ERROR, (_event: any, data: any) => {
              if (!data) return;
              if (data.fatal) {
                if (!fallbackTriedRef.current) {
                  tryNonHlsFallback();
                  if (fallbackTriedRef.current) return;
                }
                switch (data.type) {
                  case 'mediaError':
                    try { hls.recoverMediaError(); } catch {}
                    break;
                  case 'networkError':
                    try { hls.startLoad(); } catch {}
                    break;
                  default:
                    try { hls.destroy(); } catch {}
                    hlsRef.current = null;
                    setIsBuffering(false);
                    setIsReady(false);
                    break;
                }
              }
            });
          } catch {}
          return true;
        }
      } catch {}
      return false;
    };

    const cdns = [
      'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js',
      'https://unpkg.com/hls.js@1.5.13/dist/hls.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js',
    ];
    let idx = 0;
    const loadFromCdn = () => {
      if (cancelled) return;
      if (attachHls()) return;
      if (idx >= cdns.length) { tryNonHlsFallback(); return; }
      try {
        if (currentScript && currentScript.parentNode) currentScript.parentNode.removeChild(currentScript);
      } catch {}
      const s = document.createElement('script');
      currentScript = s;
      s.src = cdns[idx++];
      s.async = true;
      s.onload = () => { if (!cancelled) { if (!attachHls()) { loadFromCdn(); } } };
      s.onerror = () => { if (!cancelled) loadFromCdn(); };
      document.head.appendChild(s);
      if (timer) { try { window.clearTimeout(timer); } catch {} }
      timer = window.setTimeout(() => { if (!cancelled) loadFromCdn(); }, 3500);
    };

    loadFromCdn();
    return () => { cancelled = true; cleanup(); };
  }, [videoSrc, isActive]);

  // Global mute preference: initialize from localStorage and sync across reels
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sermonMuted');
      // Always start muted to satisfy autoplay; remember preference and apply after first gesture
      if (stored === '0') {
        wantUnmuteRef.current = true;
        setMuted(true);
      } else {
        setMuted(true);
      }
    } catch {}
    const onFirstGesture = () => {
      try {
        if (wantUnmuteRef.current) {
          wantUnmuteRef.current = false;
          setMuted(false);
          try { localStorage.setItem('sermonMuted', '0'); } catch {}
          try { window.dispatchEvent(new CustomEvent('sermon-mute-changed', { detail: { muted: false } })); } catch {}
          const v = videoRef.current;
          try { if (v) { v.muted = false; v.volume = 1; v.play().catch(() => {}); } } catch {}
        }
      } catch {}
      try { window.removeEventListener('pointerdown', onFirstGesture, true); } catch {}
      try { window.removeEventListener('touchstart', onFirstGesture, true); } catch {}
    };
    try { window.addEventListener('pointerdown', onFirstGesture, true); } catch {}
    try { window.addEventListener('touchstart', onFirstGesture, true); } catch {}
    const onMuteChanged = (e: any) => {
      try {
        const m = e && e.detail && typeof e.detail.muted === 'boolean' ? e.detail.muted : undefined;
        if (typeof m === 'boolean') setMuted(m);
      } catch {}
    };
    try { window.addEventListener('sermon-mute-changed', onMuteChanged as any); } catch {}
    return () => {
      try { window.removeEventListener('sermon-mute-changed', onMuteChanged as any); } catch {}
      try { window.removeEventListener('pointerdown', onFirstGesture, true); } catch {}
      try { window.removeEventListener('touchstart', onFirstGesture, true); } catch {}
    };
  }, []);

  // First-visit scroll hint (one-time)
  useEffect(() => {
    try {
      if (!localStorage.getItem('sermonHintShown')) {
        setShowHint(true);
        const handler = () => {
          setShowHint(false);
          try { localStorage.setItem('sermonHintShown', '1'); } catch {}
          try {
            window.removeEventListener('pointerdown', handler, true);
            window.removeEventListener('touchstart', handler, true);
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('wheel', handler, true);
            window.removeEventListener('touchmove', handler, true);
          } catch {}
        };
        try {
          window.addEventListener('pointerdown', handler, true);
          window.addEventListener('touchstart', handler, true);
          window.addEventListener('scroll', handler, true);
          window.addEventListener('wheel', handler, true);
          window.addEventListener('touchmove', handler, true);
        } catch {}
        return () => {
          try {
            window.removeEventListener('pointerdown', handler, true);
            window.removeEventListener('touchstart', handler, true);
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('wheel', handler, true);
            window.removeEventListener('touchmove', handler, true);
          } catch {}
        };
      }
    } catch {}
  }, []);

  // Do not unload source on inactivity; just pause in the visibility effect below

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

  // Compute best-fit strategy: fill screen in landscape; avoid zoom in portrait
  useEffect(() => {
    setObjectFit(isLandscape ? 'cover' : 'contain');
  }, [isLandscape]);

  const gcd = (a: number, b: number): number => {
    return b ? gcd(b, a % b) : Math.abs(a);
  };
  const getAspectLabel = (w: number, h: number): string => '';

  const tryAutoplay = async (v: HTMLVideoElement) => {
    try { await v.play(); } catch (e: any) { if (!e || e.name !== 'AbortError') { console.warn('[SermonReel] Autoplay failed:', e); } }
  };

  const updateObjectFitFromVideo = () => {
    try {
      const v = videoRef.current;
      if (!v) return;
      const w = v.videoWidth || 0;
      const h = v.videoHeight || 0;
      if (!w || !h) return;
      // Fill in landscape; fit in portrait
      const fit = isLandscape ? 'cover' : 'contain';
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
    const handleCanPlay = () => {
      setIsReady(true);
      setIsBuffering(false);
      try {
        const v = videoRef.current;
        if (v && isActive) tryAutoplay(v);
      } catch {}
      // Opportunistic caching for non-HLS MP4/WebM on web: save to IndexedDB once
      try {
        if (!cachedOnceRef.current && typeof videoSrc === 'string' && !/\.m3u8(\?.*)?$/i.test(videoSrc)) {
          cachedOnceRef.current = true;
          (async () => {
            try {
              const already = await videoStorageService.hasVideo(String(sermon.id));
              if (already) return;
              const res = await fetch(videoSrc, { cache: 'force-cache' });
              const blob = await res.blob();
              const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'mp4' : 'mp4';
              const file = new File([blob], `${(sermon.title || 'sermon').replace(/[^a-z0-9\-]+/gi,'_')}.${ext}`, { type: blob.type || 'video/mp4' });
              await videoStorageService.saveVideo(String(sermon.id), file);
            } catch {}
          })();
        }
      } catch {}
    };
    const handleWaiting = () => {
      const v = videoRef.current as HTMLVideoElement | null;
      if (draggingRef.current || (v && (v.seeking || v.readyState >= 2))) return;
      if (bufferingTimerRef.current) window.clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = window.setTimeout(() => setIsBuffering(true), 160);
    };
    const handlePlaying = () => {
      if (bufferingTimerRef.current) { window.clearTimeout(bufferingTimerRef.current); bufferingTimerRef.current = null; }
      setIsReady(true);
      setIsBuffering(false);
    };
    const handleSeeking = () => {
      if (bufferingTimerRef.current) { window.clearTimeout(bufferingTimerRef.current); bufferingTimerRef.current = null; }
      setIsBuffering(false);
    };
    const handleSeeked = () => {
      if (bufferingTimerRef.current) { window.clearTimeout(bufferingTimerRef.current); bufferingTimerRef.current = null; }
      setIsBuffering(false);
    };
    const handleTimeUpdate = () => {
      try {
        const v = videoRef.current;
        if (!v) return;
        setCurrentSec(v.currentTime || 0);
        if (!durationSec && isFinite(v.duration)) setDurationSec(v.duration);
      } catch {}
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      if (bufferingTimerRef.current) window.clearTimeout(bufferingTimerRef.current);
    };
  }, [videoSrc, durationSec]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    if (playPauseTimer.current) window.clearTimeout(playPauseTimer.current);
    playPauseTimer.current = window.setTimeout(() => {
      if (!videoRef.current) return;
      if (isActive) {
        tryAutoplay(videoRef.current);
      } else {
        try { videoRef.current.pause(); videoRef.current.muted = true; } catch {}
      }
    }, 120);
    return () => { if (playPauseTimer.current) window.clearTimeout(playPauseTimer.current); };
  }, [isActive, videoSrc]);

  // Apply mute state whenever active changes or user toggles mute
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      try {
        v.muted = muted;
        if (!muted) v.play().catch(() => {});
      } catch {}
    } else {
      try { v.pause(); v.muted = true; } catch {}
    }
  }, [isActive, muted]);

  // Best-effort: if user had fullscreen enabled and we rotate or activate a new reel, try to re-enter
  useEffect(() => {
    const tryReenter = () => {
      try {
        const wantFs = localStorage.getItem('sermonFS') === '1';
        const el: any = wrapperRef.current;
        if (wantFs && el && !document.fullscreenElement && el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        }
      } catch {}
    };
    const onResize = () => { setTimeout(tryReenter, 200); };
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('orientationchange', onResize); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    try {
      if (!isActive) return;
      const wantFs = localStorage.getItem('sermonFS') === '1';
      const el: any = wrapperRef.current;
      if (wantFs && el && !document.fullscreenElement && el.requestFullscreen) {
        // Attempt when this reel becomes active
        setTimeout(() => { try { el.requestFullscreen().catch(() => {}); } catch {} }, 60);
      }
      revealProgress(1600);
    } catch {}
  }, [isActive]);

  useEffect(() => {
    updateObjectFitFromVideo();
  }, [isLandscape]);

  const handleVideoPress = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      setMuted(false);
      try { v.muted = false; v.play().catch(() => {}); } catch {}
      try { localStorage.setItem('sermonMuted', '0'); } catch {}
      try { window.dispatchEvent(new CustomEvent('sermon-mute-changed', { detail: { muted: false } })); } catch {}
      if (onUserInteraction) onUserInteraction();
      revealProgress(3000);
      return;
    }
    // If controls are hidden, just reveal them on first tap
    if (!showProgress) {
      if (onUserInteraction) onUserInteraction();
      revealProgress(3000);
      return;
    }
    // Controls visible: toggle play/pause
    if (isPlaying) v.pause(); else v.play().catch(() => {});
  };

  const handlePointerDown = () => { if (onUserInteraction) onUserInteraction(); revealProgress(3000); };

  

  const revealProgress = (ms: number = 2800) => {
    setShowProgress(true);
    if (progressHideRef.current) window.clearTimeout(progressHideRef.current);
    progressHideRef.current = window.setTimeout(() => setShowProgress(false), ms);
  };

  const seekFromClientX = (clientX: number) => {
    const v = videoRef.current;
    if (!v || !durationSec) return;
    const bar = document.getElementById(`sermon-progress-${sermon.id}`);
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = rect.width > 0 ? x / rect.width : 0;
    const t = pct * durationSec;
    try { v.currentTime = t; setCurrentSec(t); } catch {}
  };

  const removeDragListeners = () => {
    try {
      window.removeEventListener('pointermove', onDragMove as any, true);
      window.removeEventListener('pointerup', onDragEnd as any, true);
      window.removeEventListener('pointercancel', onDragEnd as any, true);
    } catch {}
  };

  const onDragMove = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    seekFromClientX(e.clientX);
  };
  const onDragEnd = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    seekFromClientX(e.clientX);
    draggingRef.current = false;
    setIsDragging(false);
    removeDragListeners();
  };
  const onBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try { e.preventDefault(); e.stopPropagation(); } catch {}
    draggingRef.current = true;
    setIsDragging(true);
    seekFromClientX(e.clientX);
    window.addEventListener('pointermove', onDragMove as any, true);
    window.addEventListener('pointerup', onDragEnd as any, true);
    window.addEventListener('pointercancel', onDragEnd as any, true);
    revealProgress(3500);
  };
  const onBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromClientX(e.clientX);
    revealProgress(3500);
  };

  useEffect(() => {
    return () => { if (progressHideRef.current) window.clearTimeout(progressHideRef.current); };
  }, []);

  return (
    <div ref={wrapperRef} className="relative snap-start snap-always bg-black flex items-center justify-center overflow-hidden" style={{ width: 'var(--app-vw, 100vw)', height: 'var(--app-vh, 100vh)' }}>
      {embedType ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {embedType === 'youtube' && (
            isActive ? (
              <iframe
                title={sermon.title}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: '0' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%' }} />
            )
          )}
          {embedType === 'vimeo' && (
            isActive ? (
              <iframe
                title={sermon.title}
                width="100%"
                height="100%"
                src={`https://player.vimeo.com/video/${embedId}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ border: '0' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%' }} />
            )
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
            key={sermon.id}
            ref={videoRef}
            onPointerUp={handleVideoPress}
            onPointerDown={handlePointerDown}
            className={`absolute inset-0 transition-all duration-500 cursor-pointer w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
            style={{ touchAction: 'manipulation', objectPosition: 'center' as any }}
            autoPlay={isActive}
            loop
            playsInline
            muted={muted}
            src={/\.m3u8(\?.*)?$/i.test(videoSrc) && !(videoRef.current && videoRef.current.canPlayType && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) ? undefined : videoSrc}
            preload={isActive ? 'auto' : preloadHint}
            onLoadedMetadata={handleLoadedMetadata}
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
              try {
                if (/\/sermons%2Fhls%2F/i.test(videoSrc)) {
                  const enc = videoSrc.split('/o/')[1]?.split('?')[0] || '';
                  const dec = decodeURIComponent(enc);
                  const m = dec.match(/sermons\/hls\/([^/]+)\//);
                  if (m && m[1]) {
                    const mp4Path = `sermons/${m[1]}.mp4`;
                    const fresh = await getDownloadURL(ref(storage, mp4Path));
                    if (fresh && isMountedRef.current) { setVideoSrc(fresh); return; }
                  }
                }
              } catch {}
              try { await tryNonHlsFallback(); } catch {}
            }}
          />
          {isActive && (!isReady || isBuffering) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="h-10 w-10 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            </div>
          )}
          {showProgress && (
            <div
              id={`sermon-progress-${sermon.id}`}
              className="absolute left-0 right-0 z-30 h-2 bg-white/20 cursor-pointer"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}
              onPointerDown={onBarPointerDown}
              onClick={onBarClick}
            >
              {(() => {
                const pct = Math.max(0, Math.min(100, durationSec ? (Math.min(currentSec, durationSec) / durationSec) * 100 : 0));
                return (
                  <div
                    className="h-full bg-white"
                    style={{
                      transform: `scaleX(${pct / 100})`,
                      transformOrigin: 'left center',
                      transition: isDragging ? 'none' : 'transform 100ms linear',
                      width: '100%',
                    }}
                  />
                );
              })()}
            </div>
          )}
          {!showProgress && (
            <div
              className="absolute left-0 right-0 z-30 h-0.5 bg-white/20 cursor-pointer"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}
              onPointerDown={() => revealProgress(3500)}
              onClick={() => revealProgress(3500)}
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
      ) : (
        <div className="text-white text-center p-6">No video for this sermon.</div>
      )}
      {/* No manual rotate; orientation handled automatically */}
      {/* Fullscreen toggle (always available when video) */}
      {!embedType && videoSrc && (
        <div className="absolute right-4 z-30 flex flex-col items-end gap-3" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}>
          <button
            onClick={async () => {
              try {
                const el: any = wrapperRef.current;
                if (!document.fullscreenElement) {
                  if (el?.requestFullscreen) await el.requestFullscreen();
                  else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) (videoRef.current as any).webkitEnterFullscreen();
                  setIsFullscreen(true);
                  try { localStorage.setItem('sermonFS', '1'); } catch {}
                } else {
                  if (document.exitFullscreen) await document.exitFullscreen();
                  setIsFullscreen(false);
                  try { localStorage.setItem('sermonFS', '0'); } catch {}
                }
              } catch {}
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(148,163,184,0.8)] hover:bg-black/80 hover:shadow-[0_0_26px_rgba(148,163,184,1)] hover:scale-110 active:scale-95 transition-all duration-300"
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            {isFullscreen ? <FaCompress className="w-5 h-5 text-white" /> : <FaExpand className="w-5 h-5 text-white" />}
          </button>
          <button
            onClick={() => {
              const v = videoRef.current;
              const next = !muted;
              setMuted(next);
              try { if (v) { v.muted = next; if (!next) { v.volume = 1; v.play().catch(() => {}); } } } catch {}
              try { localStorage.setItem('sermonMuted', next ? '1' : '0'); } catch {}
              try { window.dispatchEvent(new CustomEvent('sermon-mute-changed', { detail: { muted: next } })); } catch {}
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(148,163,184,0.8)] hover:bg-black/80 hover:shadow-[0_0_26px_rgba(148,163,184,1)] hover:scale-110 active:scale-95 transition-all duration-300"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <FaVolumeMute className="w-5 h-5 text-white" /> : <FaVolumeUp className="w-5 h-5 text-white" />}
          </button>
        </div>
      )}

      {showHint && (
        <div
          className="absolute inset-x-0 bottom-8 z-30 flex flex-col items-center gap-2"
          onClick={() => { setShowHint(false); try { localStorage.setItem('sermonHintShown', '1'); } catch {} }}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="rounded-full bg-black/60 border border-white/10 p-3 animate-bounce">
            <FaArrowDown className="w-5 h-5 text-white" />
          </div>
          <div className="text-white text-xs bg-black/50 px-2 py-1 rounded-md">Scroll to navigate sermons</div>
        </div>
      )}
    </div>
  );
};