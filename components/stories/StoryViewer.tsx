import React from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiPause, FiPlay, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { storiesService, Story } from '../../services/storiesService';
import { uploadService } from '../../services/uploadService';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const fixMediaUrl = (u?: string): string => {
  try {
    if (!u || typeof u !== 'string') return '';
    const t = u.trim();
    if (!t || t === 'UPLOADING') return '';
    if (t.startsWith('blob:') || t.startsWith('data:')) return '';
    let url = t;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http:')) {
      url = url.replace(/^http:/i, 'https:');
    }
    if (url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app')) {
      try {
        const parsed = new URL(url);
        if (parsed.searchParams.get('alt') !== 'media') parsed.searchParams.set('alt', 'media');
        const token = parsed.searchParams.get('token');
        if (token) parsed.searchParams.set('token', token);
        url = parsed.toString();
      } catch {}
    }
    return url;
  } catch {
    return u || '';
  }
};

const formatRelativeTime = (input?: string | null): string => {
  try {
    if (!input) return '';
    const d = new Date(input);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' } as any);
  } catch { return ''; }
};

interface StoryViewerProps {
  stories: Story[];
  startIndex?: number;
  onClose: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
  onStoryUpdated?: (story: Story) => void;
  onStoryDeleted?: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, startIndex = 0, onClose, currentUserId, isAdmin, onStoryUpdated, onStoryDeleted }) => {
  const [index, setIndex] = React.useState<number>(clamp(startIndex, 0, Math.max(0, stories.length - 1)));
  const [paused, setPaused] = React.useState(false);
  const [progress, setProgress] = React.useState<number[]>(() => stories.map(() => 0));
  const [videoDurations, setVideoDurations] = React.useState<number[]>(() => stories.map(() => 0));
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const holdRef = React.useRef<boolean>(false);
  const longPressTimerRef = React.useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState('');
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const swipedRef = React.useRef<boolean>(false);
  const ignoreClickOnceRef = React.useRef<boolean>(false);
  const [showSoundTip, setShowSoundTip] = React.useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = React.useState<boolean>(true);
  const lastProgressRef = React.useRef<number>(0);
  const lastUpdateMsRef = React.useRef<number>(0);

  const isVideo = stories[index]?.media?.type === 'video';

  React.useEffect(() => {
    // Reset progress when story set or index changes forward
    setProgress((prev) => prev.map((p, i) => (i < index ? 100 : i === index ? 0 : 0)));
    lastProgressRef.current = 0;
    lastUpdateMsRef.current = 0;
  }, [index, stories]);

  React.useEffect(() => {
    const step = () => {
      if (paused || holdRef.current) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const current = stories[index];
      if (!current) return;
      const isVid = current.media.type === 'video';
      const imgDuration = 5000; // 5s for images
      let pct = 0;
      if (isVid) {
        // For videos, rely on onTimeUpdate to update progress; avoid per-frame state updates
        return;
      } else {
        // Approximate using time
        if (!imageLoaded) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        setProgress((prev) => {
          const arr = prev.slice();
          const next = clamp(arr[index] + (100 / (imgDuration / 50)), 0, 100);
          arr[index] = next;
          return arr;
        });
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      setProgress((prev) => {
        const arr = prev.slice();
        arr[index] = clamp(pct, 0, 100);
        return arr;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [index, paused, videoDurations, stories, imageLoaded]);

  React.useEffect(() => {
    const s = stories[index];
    if (!s) return;
    setImageLoaded(s.media.type === 'image' ? false : true);
  }, [index, stories]);

  React.useEffect(() => {
    const preload = (i: number) => {
      const s = stories[i];
      if (!s || s.media.type !== 'image') return;
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = fixMediaUrl(s.media.url);
      } catch {}
    };
    preload(index + 1);
    preload(index - 1);
  }, [index, stories]);

  React.useEffect(() => {
    if (!stories[index]) return;
    if (stories[index].media.type === 'video') {
      try {
        if (videoRef.current) { try { videoRef.current.muted = false; videoRef.current.volume = 1; } catch {} }
        const p = videoRef.current?.play();
        if (p && typeof (p as any).catch === 'function') {
          (p as Promise<void>).catch(() => {
            try {
              const shown = localStorage.getItem('story_sound_tip_shown') === '1';
              if (!shown) setShowSoundTip(true);
            } catch {}
          });
        }
      } catch {}
    }
  }, [index]);

  const goNext = () => {
    if (index + 1 >= stories.length) {
      onClose();
    } else {
      setIndex(index + 1);
    }
  };
  const goPrev = () => {
    if (index - 1 < 0) {
      onClose();
    } else {
      setIndex(index - 1);
    }
  };

  const onPointerDown = () => {
    setPaused(true);
    holdRef.current = true;
    try { videoRef.current?.pause(); } catch {}
    // Long-press to open context menu (owner/admin only)
    const s = stories[index];
    const isOwner = s && currentUserId && s.authorId && String(s.authorId) === String(currentUserId);
    if ((isOwner || isAdmin) && !menuOpen) {
      try {
        const id = window.setTimeout(() => {
          setMenuOpen(true);
          setIsEditing(false);
          setEditText(String(s?.content || ''));
        }, 600) as unknown as number;
        longPressTimerRef.current = id;
      } catch {}
    }
  };
  const onPointerUp = () => {
    holdRef.current = false;
    setPaused(false);
    // Clear long-press timer
    if (longPressTimerRef.current != null) {
      try { window.clearTimeout(longPressTimerRef.current); } catch {}
      longPressTimerRef.current = null;
    }
    // Dismiss sound tip after explicit interaction
    if (showSoundTip) {
      try { localStorage.setItem('story_sound_tip_shown', '1'); } catch {}
      setShowSoundTip(false);
    }
    try { videoRef.current?.play().catch(()=>{}); } catch {}
  };

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (menuOpen || isEditing) return;
    if (ignoreClickOnceRef.current) { ignoreClickOnceRef.current = false; return; }
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.33) goPrev(); else goNext();
  };

  const current = stories[index];
  if (!current) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onMouseDown={onPointerDown}
      onMouseUp={onPointerUp}
      onTouchStart={(e) => { try { const t = e.touches[0]; touchStartXRef.current = t.clientX; touchStartYRef.current = t.clientY; swipedRef.current = false; } catch {} onPointerDown(); }}
      onTouchMove={(e) => { if (menuOpen || isEditing) return; try { const sx = touchStartXRef.current; const sy = touchStartYRef.current; if (sx == null || sy == null) return; const t = e.touches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy; if (!swipedRef.current && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swipedRef.current = true; ignoreClickOnceRef.current = true; if (dx < 0) { goNext(); } else { goPrev(); } } } catch {} }}
      onTouchEnd={onPointerUp}
      onClick={onTap}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
      >
        <FiX size={28} />
      </button>

      {/* Prev/Next buttons */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 9999 }}
        aria-label="Previous"
      >
        <FiChevronLeft size={22} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 9999 }}
        aria-label="Next"
      >
        <FiChevronRight size={22} />
      </button>

      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 6 }}>
        {stories.map((_, i) => (
          <div
            key={i}
            style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 9999, position: 'relative' }}
            onClick={(e) => {
              e.stopPropagation();
              if (i !== index) { setIndex(i); return; }
              const el = e.currentTarget as HTMLDivElement;
              const rect = el.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
              const v = videoRef.current;
              if (stories[i].media.type === 'video' && v && (v.duration || 0) > 0) {
                try { v.currentTime = ratio * v.duration; } catch {}
              } else {
                setProgress((prev) => { const arr = prev.slice(); arr[i] = ratio * 100; return arr; });
              }
            }}
          >
            <div style={{ width: `${i < index ? 100 : i === index ? progress[i] : 0}%`, height: '100%', background: 'white', borderRadius: 9999, transition: 'width 80ms linear' }} />
          </div>
        ))}
      </div>

      <div style={{ width: 'min(720px, 96vw)', height: 'min(92vh, 1280px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9999, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
            {(current.author || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
              {(currentUserId && current.authorId && String(current.authorId) === String(currentUserId)) ? 'You' : (current.author || 'Unknown')}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{formatRelativeTime(current.createdAt)}</span>
          </div>
        </div>
        {current.media.type === 'image' ? (
          <img
            src={fixMediaUrl(current.media.url)}
            alt="story"
            decoding="async"
            loading="eager"
            fetchPriority="high"
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, opacity: imageLoaded ? 1 : 0, transition: 'opacity 200ms ease' }}
            onError={(e) => { try { (e.currentTarget as HTMLImageElement).src = fixMediaUrl((e.currentTarget as HTMLImageElement).src); } catch {} finally { setImageLoaded(true); } }}
            onLoad={() => { setImageLoaded(true); window.setTimeout(() => goNext(), 5000); }}
          />
        ) : (
          <video
            ref={videoRef}
            src={fixMediaUrl(current.media.url)}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, background: 'black' }}
            playsInline
            autoPlay
            preload="auto"
            muted={false}
            onTimeUpdate={(e) => {
              try {
                const v = e.currentTarget as HTMLVideoElement;
                const dur = v?.duration || videoDurations[index] || 0;
                if (!dur || isNaN(dur) || !isFinite(dur)) return;
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                if (now - (lastUpdateMsRef.current || 0) < 120) return; // throttle ~8fps
                lastUpdateMsRef.current = now;
                const pct = clamp((v.currentTime / dur) * 100, 0, 100);
                if (Math.abs(pct - (lastProgressRef.current || 0)) < 0.5) return;
                lastProgressRef.current = pct;
                setProgress((prev) => {
                  const arr = prev.slice();
                  arr[index] = pct;
                  return arr;
                });
              } catch {}
            }}
            onLoadedMetadata={() => { try { setVideoDurations((prev) => { const arr = prev.slice(); arr[index] = videoRef.current?.duration || 0; return arr; }); if (videoRef.current) { try { videoRef.current.muted = false; videoRef.current.volume = 1; } catch {} } const p = videoRef.current?.play(); if (p && (p as any).catch) { (p as Promise<void>).catch(() => { const shown = localStorage.getItem('story_sound_tip_shown') === '1'; if (!shown) setShowSoundTip(true); }); } } catch {} }}
            onEnded={() => goNext()}
            onError={() => goNext()}
          />
        )}

        {current.media.type === 'image' && !imageLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: 9999 }} />
          </div>
        )}

        {/* Caption overlay */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
          {!isEditing ? (
            <div style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))', padding: '24px 12px 8px', borderRadius: 12 }}>
              {current.content && (
                <div style={{ color: 'white', fontSize: 14, lineHeight: 1.35, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{current.content}</div>
              )}
              {(currentUserId && current.authorId && String(current.authorId) === String(currentUserId)) || isAdmin ? (
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditText(String(current.content || '')); }} style={{ marginTop: 6, background: 'transparent', border: 'none', color: 'white', opacity: 0.85, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiEdit2 size={14} /> Edit caption
                </button>
              ) : null}
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.65)', padding: 12, borderRadius: 12, display: 'flex', gap: 8 }}>
              <input value={editText} onChange={(e) => setEditText(e.target.value)} style={{ flex: 1, background: 'white', borderRadius: 8, border: 'none', padding: '8px 10px', fontSize: 14 }} placeholder="Add a caption" />
              <button onClick={async (e) => {
                e.stopPropagation();
                try {
                  const updated = await storiesService.updateStory(current.id, { text: editText });
                  if (updated) {
                    setIsEditing(false);
                    if (onStoryUpdated) onStoryUpdated(updated);
                  }
                } catch {}
              }} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>Save</button>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
        </div>

        {/* Pause/Play button */}
        <button onClick={(e) => { e.stopPropagation(); const next = !paused; setPaused(next); try { if (next) videoRef.current?.pause(); else videoRef.current?.play().catch(()=>{}); } catch {} }}
          style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.35)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 9999 }}
          aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? <FiPlay size={18} /> : <FiPause size={18} />}
        </button>
      </div>

      {showSoundTip && (
        <div style={{ position: 'absolute', top: 50, right: 16, background: 'rgba(0,0,0,0.65)', color: 'white', padding: '8px 10px', borderRadius: 9999, fontSize: 12 }}>
          Tap to enable sound
        </div>
      )}

      {/* Context menu for owner/admin (long-press) */}
      {menuOpen && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 90, right: 16, background: 'rgba(0,0,0,0.85)', color: 'white', borderRadius: 12, padding: 8, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setIsEditing(true); setEditText(String(current.content || '')); }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <FiEdit2 size={16} /> Edit caption
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); replaceInputRef.current?.click(); }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <FiEdit2 size={16} /> Replace media
          </button>
          <button onClick={async (e) => {
            e.stopPropagation();
            setMenuOpen(false);
            const ok = window.confirm('Delete this story?');
            if (!ok) return;
            try {
              const done = await storiesService.deleteStory(current.id);
              if (done) {
                if (onStoryDeleted) onStoryDeleted(current.id);
                onClose();
              }
            } catch {}
          }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
            <FiTrash2 size={16} /> Delete
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            Close
          </button>
          <input ref={replaceInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={async (e) => {
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
              const url = await uploadService.uploadFile(file);
              const updated = await storiesService.updateStory(current.id, { media: { url, type } });
              if (updated) {
                if (onStoryUpdated) onStoryUpdated(updated);
              }
            } catch {}
          }} />
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
