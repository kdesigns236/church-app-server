import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMessageCircle,
  FiShare2,
  FiX,
  FiVideo,
  FiImage,
  FiSmile,
  FiThumbsUp,
  FiMoreHorizontal,
  FiGlobe,
  FiArrowLeft,
  FiPlus,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAppContext } from '../context/AppContext';
import { Post } from '../types';
import StoryViewer from '../components/stories/StoryViewer';
import { storiesService, Story } from '../services/storiesService';
import { uploadService } from '../services/uploadService';


const CommunityFeedPage: React.FC = () => {
  const { user, users } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { posts, handlePostInteraction, addPostComment, deletePost, updatePost } = useAppContext();
  // force periodic refresh for relative time labels
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const [activeComment, setActiveComment] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activePostMenuId, setActivePostMenuId] = useState<number | null>(null);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editMedia, setEditMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [removeInlineMedia, setRemoveInlineMedia] = useState<boolean>(false);
  const [showSyncHint, setShowSyncHint] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const feedRootRef = useRef<HTMLDivElement | null>(null);
  const editImageInputRef = useRef<HTMLInputElement | null>(null);
  const editVideoInputRef = useRef<HTMLInputElement | null>(null);
  // New Stories state
  const [stories, setStories] = useState<Story[]>([]);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStories, setViewerStories] = useState<Story[]>([]);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  

  

  

  

  

  

  

  

  

  

  const formatRelativeTime = (input: string | null | undefined): string => {
    if (!input) return '';
    if (input === 'Just now') return input;
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const canDeletePost = (post: Post): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const anyPost: any = post as any;
    if (anyPost && anyPost.authorId && user.id) return anyPost.authorId === user.id;
    return post.author === user.name;
  };
  const canEditPost = (post: Post): boolean => canDeletePost(post);

  const handleDeletePost = (post: Post) => {
    if (!canDeletePost(post)) {
      alert('You can only delete your own posts.');
      return;
    }

    const confirmed = window.confirm('Delete this post?');
    if (!confirmed) return;

    deletePost(post.id);
    setActivePostMenuId(null);

    if (activeComment === post.id) {
      setActiveComment(null);
      setCommentText('');
    }
  };

  const activeCommentPost =
    activeComment !== null ? posts.find((p) => p.id === activeComment) : null;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (activePostMenuId === null) return;
    const onPointerDown = (e: any) => {
      try {
        const el = postMenuRef.current;
        const target = e?.target as Node | null;
        if (!el || !target) {
          setActivePostMenuId(null);
          return;
        }
        if (!el.contains(target)) {
          setActivePostMenuId(null);
        }
      } catch {
        setActivePostMenuId(null);
      }
    };
    const onScroll = () => {
      try { setActivePostMenuId(null); } catch {}
    };
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [activePostMenuId]);

  // Close menu whenever route changes
  useEffect(() => {
    try { setActivePostMenuId(null); } catch {}
  }, [location.pathname]);

  const currentUserName = user?.name || 'You';
  const currentUserAvatar =
    (user?.name && user.name.trim().charAt(0).toUpperCase()) || 'ME';

  const currentUserProfilePicture =
    (user && (user as any).profilePictureUrl) ||
    (user && (user as any).profilePicture) ||
    undefined;

  const getUserProfilePicture = (authorId?: string, name?: string): string | undefined => {
    const list = users || [];
    let match = authorId ? list.find(u => u.id === authorId) : undefined;
    if (!match && name) match = list.find(u => u.name === name);
    if (!match) return undefined;
    return ((match as any).profilePictureUrl || (match as any).profilePicture || undefined);
  };

  const isUserOnline = (authorId?: string, name?: string): boolean => {
    const list = users || [];
    let match = authorId ? list.find(u => u.id === authorId) : undefined;
    if (!match && name) match = list.find(u => u.name === name);
    return !!(match && match.isOnline);
  };

  // Normalize potentially insecure or malformed media URLs so media renders reliably on HTTPS
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
          // Ensure direct media delivery
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

  // Safely call HTMLVideoElement.play(), swallowing AbortError and ignoring detached elements
  const safePlay = (el?: HTMLVideoElement | null) => {
    try {
      if (!el) return;
      const connected = typeof (el as any).isConnected === 'boolean'
        ? (el as any).isConnected
        : (typeof document !== 'undefined' && document.contains ? document.contains(el) : true);
      if (!connected) return;
      const p = el.play();
      if (p && typeof (p as any).catch === 'function') {
        (p as Promise<void>).catch((err: any) => {
          if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError' || err.name === 'NotSupportedError')) {
            return;
          }
        });
      }
    } catch {}
  };

  const safeLoadThenPlay = (el?: HTMLVideoElement | null) => {
    try { if (!el) return; el.load(); } catch {}
    safePlay(el);
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const el = e.currentTarget;
      if (!el.dataset.retry) {
        el.dataset.retry = '1';
        el.src = fixMediaUrl(el.src);
      }
    } catch {}
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    try {
      const el = e.currentTarget;
      const src = el.currentSrc || (el as any).src || '';
      const fixed = fixMediaUrl(src);
      if (fixed && fixed !== src) {
        try { (el as any).src = fixed; } catch { try { el.setAttribute('src', fixed); } catch {} }
        setTimeout(() => { try { safeLoadThenPlay(el); } catch {} }, 0);
      }
    } catch {}
  };

  useEffect(() => {
    const search = location && location.search ? location.search : '';
    if (!search) return;
    const params = new URLSearchParams(search);
    const pid = params.get('post');
    if (!pid) return;
    const idNum = Number(pid);
    if (!Number.isNaN(idNum)) {
      setActiveComment(idNum);
    }
  }, [location.search, posts.length]);


  const handleLike = (postId: number) => {
    handlePostInteraction(postId, 'like');
  };

  const handleComment = (postId: number) => {
    if (!user) return;
    if (commentText.trim()) {
      addPostComment(postId, commentText, user);
      setCommentText('');
    }
  };

  const showToast = (message: string) => {
    setToast({ message });
    window.setTimeout(() => setToast(null), 2200);
  };

  const buildShareUrl = (postId: number) => `${window.location.origin}/#/chat?post=${postId}`;

  const handleShare = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const url = buildShareUrl(postId);
    const title = `${post.author} on Church App`;
    const text = post.content || '';

    try {
      const navAny = navigator as any;
      if (navAny && typeof navAny.share === 'function') {
        await navAny.share({ title, text, url });
        handlePostInteraction(postId, 'share');
        showToast('Shared');
        return;
      }
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        return;
      }
    }

    try {
      const textToCopy = `${text ? text + '\n' : ''}${url}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      handlePostInteraction(postId, 'share');
      showToast('Link copied');
    } catch {
      showToast('Unable to share');
    }
  };


  // Pause post videos when scrolled out of view (with scroll fallback)
  useEffect(() => {
    const rootEl = feedRootRef.current || null;
    const videos = Array.from((feedRootRef.current || document).querySelectorAll('video[data-post-video]')) as HTMLVideoElement[];
    if (videos.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const v = entry.target as HTMLVideoElement;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.25) {
          try { v.pause(); } catch {}
        }
      }
    }, { root: rootEl, threshold: [0, 0.25, 0.5, 0.75, 1] });
    videos.forEach(v => io.observe(v));
    const scrollHandler = () => {
      videos.forEach(video => {
        try {
          const rect = video.getBoundingClientRect();
          const visible = (rect.bottom > 0 && rect.top < window.innerHeight);
          const visiblePercent = visible ? (Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)) / Math.max(1, rect.height) : 0;
          if (visiblePercent < 0.25) {
            video.pause();
          }
        } catch {}
      });
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    return () => { try { io.disconnect(); } catch {} window.removeEventListener('scroll', scrollHandler); };
  }, [posts.length]);

  // Fetch stories on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await storiesService.fetchStories();
        if (!cancelled) setStories(Array.isArray(list) ? list : []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, { author: string; authorId?: string; stories: Story[]; latestTs: number }>();
    for (const s of stories) {
      const key = s.authorId ? `id:${s.authorId}` : `name:${s.author}`;
      const entry = map.get(key);
      const ts = new Date(s.createdAt || 0).getTime() || 0;
      if (entry) {
        entry.stories.push(s);
        if (ts > entry.latestTs) entry.latestTs = ts;
      } else {
        map.set(key, { author: s.author, authorId: s.authorId, stories: [s], latestTs: ts });
      }
    }
    const arr = Array.from(map.values());
    arr.forEach((g) => g.stories.sort((a, b) => (new Date(b.createdAt).getTime()) - (new Date(a.createdAt).getTime())));
    arr.sort((a, b) => b.latestTs - a.latestTs);
    return arr;
  }, [stories]);

  const openGroup = (author: string, authorId?: string) => {
    const list = stories.filter((s) => (authorId ? s.authorId === authorId : s.author === author));
    if (list.length === 0) return;
    setViewerStories(list);
    setViewerStartIndex(0);
    setViewerOpen(true);
  };

  const onAddStoryClick = () => {
    storyFileInputRef.current?.click();
  };

  const onStoryFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      e.currentTarget.value = '';
      if (!file) return;
      const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
      showToast('Uploading...');
      const url = await uploadService.uploadFile(file);
      const created = await storiesService.createStory({ url, type }, '');
      if (created) {
        setStories((prev) => [created, ...prev]);
        showToast('Story added');
      } else {
        showToast('Failed to add story');
      }
    } catch {
      showToast('Upload failed');
    }
  };

  

  

  // Lightweight sync hint: if no posts yet, show a small message while initial data loads.
  // This never blocks rendering cached content.
  useEffect(() => {
    if (posts.length === 0) {
      const id = window.setTimeout(() => setShowSyncHint(true), 1500);
      return () => window.clearTimeout(id);
    }
    setShowSyncHint(false);
  }, [posts.length]);

  return (
    <div
      ref={feedRootRef}
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#020617' : '#f0f2f5',
        color: isDark ? '#e5e7eb' : '#111827',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: isDark ? '#020617' : 'white',
          borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)'
        }}
      >
        <div
          style={{
            maxWidth: '672px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                marginRight: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                borderRadius: 9999,
                color: isDark ? '#e5e7eb' : '#111827',
              }}
            >
              <FiArrowLeft size={20} />
            </button>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#2563eb',
                margin: 0,
              }}
            >
              Church Community
            </h1>
          </div>
          <Link
            to="/chat-room"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 9999,
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <FiMessageCircle size={18} />
            <span>Group Chat</span>
          </Link>
        </div>
      </div>

      {showSyncHint && (
        <p
          style={{
            padding: '8px 16px 0',
            fontSize: 12,
            color: isDark ? '#9ca3af' : '#6b7280',
            textAlign: 'center',
          }}
        >
          Syncing community from server... This may take a moment on a slow connection.
        </p>
      )}

      <div
        style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 16px 32px' }}
      >
        {/* Stories */}
        <div style={{ backgroundColor: isDark ? '#020617' : 'white', borderRadius: 10, padding: '12px', marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {user && (
              <div style={{ flex: '0 0 auto', width: 96 }}>
                <button onClick={onAddStoryClick} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto' }}>
                    <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {currentUserProfilePicture ? (
                        <img src={currentUserProfilePicture} alt={currentUserName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#111827', fontWeight: 'bold', fontSize: 20 }}>{currentUserAvatar}</span>
                      )}
                    </div>
                    <div style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
                      <FiPlus size={18} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: isDark ? '#e5e7eb' : '#111827' }}>Add story</div>
                </button>
                <input ref={storyFileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={onStoryFileSelected} />
              </div>
            )}

            {groups.map((g) => (
              <div key={(g.authorId || g.author)} style={{ flex: '0 0 auto', width: 96 }}>
                <button onClick={() => openGroup(g.author, g.authorId)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto' }}>
                    <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', background: 'linear-gradient(45deg, #f59e0b, #3b82f6)' }} />
                    <div style={{ position: 'relative', width: 84, height: 84, borderRadius: '50%', background: isDark ? '#111827' : 'white', padding: 3 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#e5e7eb' }}>
                        {getUserProfilePicture(g.authorId, g.author) ? (
                          <img src={getUserProfilePicture(g.authorId, g.author) as string} alt={g.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#111827', fontWeight: 'bold', fontSize: 18 }}>{g.author.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: isDark ? '#e5e7eb' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.author}</div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {viewerOpen && (
          <StoryViewer
            stories={viewerStories}
            startIndex={viewerStartIndex}
            onClose={() => setViewerOpen(false)}
            currentUserId={user?.id}
            isAdmin={user?.role === 'admin'}
            onStoryUpdated={(updated) => {
              try {
                setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                setViewerStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              } catch {}
            }}
            onStoryDeleted={(id) => {
              try {
                setStories((prev) => prev.filter((s) => s.id !== id));
                setViewerStories((prev) => prev.filter((s) => s.id !== id));
                setViewerOpen(false);
              } catch {}
            }}
          />
        )}

        {/* Create Post */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {currentUserProfilePicture ? (
                <img
                  src={currentUserProfilePicture}
                  alt={currentUserName}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  {currentUserAvatar}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/create-post')}
              style={{
                flex: 1,
                backgroundColor: '#f3f4f6',
                borderRadius: 9999,
                padding: '10px 16px',
                textAlign: 'left',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              {`What's on your mind, ${currentUserName.split(' ')[0]}?`}
            </button>
          </div>
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            <button
              onClick={() => navigate('/create-post')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              <FiVideo size={18} />
              <span>Video</span>
            </button>
            <button
              onClick={() => navigate('/create-post')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#22c55e',
                cursor: 'pointer',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              <FiImage size={18} />
              <span>Photo</span>
            </button>
            <button
              onClick={() => navigate('/create-post')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#f97316',
                cursor: 'pointer',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              <FiSmile size={18} />
              <span>Feeling</span>
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              backgroundColor: isDark ? '#020617' : 'white',
              borderRadius: '8px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {/* Post Header */}
            <div
              style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {getUserProfilePicture((post as any).authorId, post.author) ? (
                    <img
                      src={getUserProfilePicture((post as any).authorId, post.author) as string}
                      alt={post.author}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      {post.avatar}
                    </span>
                  )}
                </div>
                <span
                  aria-label={isUserOnline((post as any).authorId, post.author) ? 'Online' : 'Offline'}
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    backgroundColor: isUserOnline((post as any).authorId, post.author) ? '#10b981' : '#9ca3af',
                    border: '2px solid white',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  {post.author}
                </h3>
                <div
                  style={{
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '12px',
                    color: '#6b7280',
                  }}
                >
                  <span>{formatRelativeTime(post.time)}</span>
                  <span>&bull;</span>
                  <FiGlobe size={12} />
                  <span>Public</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePostMenuId((prev) => (prev === post.id ? null : post.id));
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#9ca3af',
                }}
              >
                <FiMoreHorizontal size={18} />
              </button>
            </div>

            {/* Post Actions Menu (3-dot) */}
            {activePostMenuId === post.id && (
              <div
                ref={postMenuRef}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 44,
                  right: 8,
                  zIndex: 20,
                  backgroundColor: isDark ? '#020617' : 'white',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  minWidth: 160,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveComment(post.id);
                    setActivePostMenuId(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: isDark ? '#e5e7eb' : '#111827',
                  }}
                >
                  View details
                </button>
                {canEditPost(post) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(post.id);
                      setEditContent(post.content || '');
                      setEditMedia(null);
                      setRemoveInlineMedia(false);
                      setActivePostMenuId(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: isDark ? '#e5e7eb' : '#111827',
                    }}
                  >
                    Edit post
                  </button>
                )}
                {canEditPost(post) && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePostMenuId(null);
                      navigate(`/create-post?edit=${post.id}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: isDark ? '#e5e7eb' : '#111827',
                    }}
                  >
                    Edit in full editor
                  </button>
                )}
                {canDeletePost(post) && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#ef4444',
                    }}
                  >
                    Delete post
                  </button>
                )}
              </div>
            )}

            {/* Post Content / Inline Editor */}
            <div style={{ padding: '0 16px 12px' }}>
              {editingPostId === post.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                      borderRadius: 8,
                      padding: 10,
                      background: isDark ? '#0b1220' : 'white',
                      color: isDark ? '#e5e7eb' : '#111827',
                      resize: 'vertical',
                    }}
                  />
                  {(!removeInlineMedia && (editMedia || post.media)) && (
                    <div style={{ marginTop: 8 }}>
                      {(editMedia || post.media)!.type === 'image' ? (
                        <img
                          src={(editMedia || post.media)!.url}
                          alt="Post media"
                          style={{ width: '100%', borderRadius: 8, maxHeight: 320, objectFit: 'cover' }}
                        />
                      ) : (
                        <video
                          controls
                          src={fixMediaUrl((editMedia || post.media)!.url)}
                          preload="metadata"
                          style={{ width: '100%', borderRadius: 8, maxHeight: 320, background: '#000' }}
                        />
                      )}
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => { setEditMedia(null); setRemoveInlineMedia(true); }}
                          style={{ fontSize: 12, color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          Remove media
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => editVideoInputRef.current?.click()}
                      style={{ padding: '8px 12px', background: 'transparent', color: '#ef4444', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
                    >
                      <FiVideo size={16} style={{ marginRight: 6, verticalAlign: '-2px' }} /> Change video
                    </button>
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      style={{ padding: '8px 12px', background: 'transparent', color: '#22c55e', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
                    >
                      <FiImage size={16} style={{ marginRight: 6, verticalAlign: '-2px' }} /> Change photo
                    </button>
                    <input
                      ref={editVideoInputRef}
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const result = reader.result;
                            if (typeof result === 'string') {
                              setEditMedia({ url: result, type: 'video' });
                              setRemoveInlineMedia(false);
                            }
                          };
                          reader.readAsDataURL(file);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <input
                      ref={editImageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const result = reader.result;
                            if (typeof result === 'string') {
                              setEditMedia({ url: result, type: 'image' });
                              setRemoveInlineMedia(false);
                            }
                          };
                          reader.readAsDataURL(file);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = (editContent || '').trim();
                        if (!trimmed) return;
                        // Permission guard
                        if (!canEditPost(post)) return;
                        const finalMedia = removeInlineMedia ? undefined : (editMedia ? editMedia : post.media);
                        const updated: Post = { ...post, content: trimmed, media: finalMedia as any };
                        updatePost(updated);
                        setEditingPostId(null);
                        setEditMedia(null);
                        setRemoveInlineMedia(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#1877f2',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingPostId(null); setEditContent(''); setEditMedia(null); setRemoveInlineMedia(false); }}
                      style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        color: isDark ? '#e5e7eb' : '#111827',
                        border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: isDark ? '#e5e7eb' : '#1f2937',
                    fontSize: '15px',
                    lineHeight: 1.5,
                  }}
                >
                  {post.content}
                </p>
              )}
            </div>

            {editingPostId !== post.id && post.media && (
              <div style={{ padding: '0 16px 12px' }}>
                {post.media.type === 'image' ? (
                  <img
                    src={fixMediaUrl(post.media.url)}
                    alt="Post media"
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      maxHeight: '360px',
                      objectFit: 'cover',
                      borderRadius: 10,
                    }}
                    onError={handleImgError}
                  />
                ) : (
                  <video
                    data-post-video
                    controls
                    src={fixMediaUrl(post.media.url)}
                    preload="metadata"
                    style={{
                      width: '100%',
                      maxHeight: '360px',
                      borderRadius: 10,
                      backgroundColor: '#000',
                    }}
                    onError={handleVideoError}
                  />
                )}
              </div>
            )}

            {/* Post Stats */}
            <div
              style={{
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#6b7280',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '9999px',
                    backgroundColor: '#1877f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                  }}
                >
                  <FiThumbsUp size={10} />
                </div>
                <span>{post.likes}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span>{post.comments.length} comments</span>
                <span>{post.shares} shares</span>
              </div>
            </div>

            {/* Post Actions */}
            <div
              style={{
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: post.liked
                    ? 'rgba(24, 119, 242, 0.08)'
                    : 'transparent',
                  cursor: 'pointer',
                  color: post.liked ? '#1877f2' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: 6,
                }}
              >
                <FiThumbsUp
                  size={20}
                  fill={post.liked ? 'currentColor' : 'none'}
                />
                <span>Like</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveComment(post.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <FiMessageCircle size={20} />
                <span>Comment</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(post.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <FiShare2 size={20} />
                <span>Share</span>
              </button>
            </div>

            {/* Comments Section */}
            {/* Comment Input */}
          </div>
        ))}
      </div>

      {activeCommentPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? '#020617' : 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', width: 36, height: 36 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isDark ? '#1d4ed8' : '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {getUserProfilePicture(activeCommentPost.author) ? (
                      <img
                        src={getUserProfilePicture(activeCommentPost.author) as string}
                        alt={activeCommentPost.author}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        {activeCommentPost.avatar}
                      </span>
                    )}
                  </div>
                  <span
                    aria-label={isUserOnline((activeCommentPost as any)?.authorId, activeCommentPost.author) ? 'Online' : 'Offline'}
                    style={{
                      position: 'absolute',
                      right: -2,
                      bottom: -2,
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      backgroundColor: isUserOnline((activeCommentPost as any)?.authorId, activeCommentPost.author) ? '#10b981' : '#9ca3af',
                      border: '2px solid white',
                    }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: '14px',
                      color: isDark ? '#e5e7eb' : '#111827',
                    }}
                  >
                    {activeCommentPost.author}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: isDark ? '#9ca3af' : '#6b7280',
                    }}
                  >
                    {formatRelativeTime(activeCommentPost.time)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveComment(null);
                  setCommentText('');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                <FiX size={22} />
              </button>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: isDark ? '#e5e7eb' : '#111827',
                  lineHeight: 1.5,
                }}
              >
                {activeCommentPost.content}
              </p>
            </div>

            <div
              style={{
                padding: '12px 16px',
                flex: 1,
                overflowY: 'auto',
              }}
            >
              {activeCommentPost.comments.length === 0 && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: isDark ? '#6b7280' : '#9ca3af',
                  }}
                >
                  No comments yet. Be the first to share something!
                </p>
              )}
              {activeCommentPost.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <div style={{ position: 'relative', width: 32, height: 32 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#4b5563' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {getUserProfilePicture(comment.author) ? (
                        <img
                          src={getUserProfilePicture(comment.author) as string}
                          alt={comment.author}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {comment.author.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span
                      aria-label={isUserOnline((comment as any).authorId, comment.author) ? 'Online' : 'Offline'}
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 9,
                        height: 9,
                        borderRadius: 9999,
                        backgroundColor: isUserOnline((comment as any).authorId, comment.author) ? '#10b981' : '#9ca3af',
                        border: '2px solid white',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      backgroundColor: isDark ? '#020617' : '#f3f4f6',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      flex: 1,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: '13px',
                        color: isDark ? '#e5e7eb' : '#111827',
                      }}
                    >
                      {comment.author}
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '14px',
                        color: isDark ? '#e5e7eb' : '#111827',
                      }}
                    >
                      {comment.text}
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '11px',
                        color: isDark ? '#9ca3af' : '#6b7280',
                      }}
                    >
                      {formatRelativeTime(comment.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  style={{
                    flex: 1,
                    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                    borderRadius: 9999,
                    padding: '8px 16px',
                    outline: 'none',
                    fontSize: '14px',
                    backgroundColor: isDark ? '#020617' : 'white',
                    color: isDark ? '#e5e7eb' : '#111827',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && activeCommentPost) {
                      e.preventDefault();
                      handleComment(activeCommentPost.id);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (activeCommentPost) {
                      handleComment(activeCommentPost.id);
                    }
                  }}
                  style={{
                    backgroundColor: isDark ? '#1d4ed8' : '#3b82f6',
                    color: 'white',
                    padding: '8px 24px',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer removed */}
    </div>
  );
};

export default CommunityFeedPage;
