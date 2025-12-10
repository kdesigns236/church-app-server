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
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAppContext } from '../context/AppContext';
import { websocketService } from '../services/websocketService';
import { Post, Comment } from '../types';

interface Story {
  id: number;
  authorId?: string;
  author: string;
  avatar: string;
  content: string;
  media?: { url: string; type: 'image' | 'video' };
  viewed: boolean;
  // Optional type so we can give video stories longer duration
  type?: 'video' | 'photo' | 'text';
  createdAt?: number;
}

const CommunityFeedPage: React.FC = () => {
  const { user, users } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { posts, handlePostInteraction, addPostComment, deletePost } = useAppContext();
  // force periodic refresh for relative time labels
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const stored = localStorage.getItem('communityStories');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          const dayMs = 24 * 60 * 60 * 1000;
          const toTs = (s: any): number | undefined => {
            if (typeof s?.createdAt === 'number') return s.createdAt;
            if (typeof s?.createdAt === 'string') { const t = Date.parse(s.createdAt); if (!isNaN(t)) return t; }
            if (typeof s?.id === 'number') return s.id;
            if (typeof s?.id === 'string' && /^\d{10,}$/.test(s.id)) return parseInt(s.id, 10);
            return undefined;
          };
          const norm = parsed.map((s: any) => { const ts = toTs(s); return ts ? { ...s, createdAt: ts } : null; }).filter(Boolean);
          const filtered = (norm as any[]).filter((s: any) => now - s.createdAt <= dayMs);
          const byId = new Map<string, any>();
          for (const s of filtered) {
            const k = String((s as any).id);
            const prev = byId.get(k);
            if (!prev) byId.set(k, s); else {
              const prefer = ((s as any).media && !(prev as any).media) ? s : (((s as any).type === 'video' && (prev as any).type !== 'video') ? s : (s.createdAt > prev.createdAt ? s : prev));
              byId.set(k, prefer);
            }
          }
          const deduped = Array.from(byId.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
          try { localStorage.setItem('communityStories', JSON.stringify(deduped)); } catch {}
          return deduped as Story[];
        }
        console.warn('[CommunityFeed] communityStories in localStorage was not an array, resetting.');
        return [];
      }
      console.log('[CommunityFeed] No communityStories found in localStorage on init');
      return [];
    } catch (error) {
      console.error('Error parsing communityStories from localStorage', error);
      return [];
    }
  });

  // Migrate stories to include authorId when possible using users list
  useEffect(() => {
    try {
      const list = Array.isArray(stories) ? stories : [];
      const userList = Array.isArray(users) ? users : [];
      let changed = false;
      const withIds = list.map(s => {
        if (!s.authorId) {
          const match = userList.find(u => u.name === s.author);
          if (match) {
            changed = true;
            return { ...s, authorId: match.id } as Story;
          }
        }
        return s;
      });
      if (changed) {
        setStories(withIds);
        try { localStorage.setItem('communityStories', JSON.stringify(withIds)); } catch {}
      }
    } catch {}
  }, [users, stories]);
  const [activeComment, setActiveComment] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [currentStoryAuthor, setCurrentStoryAuthor] = useState<string | null>(null);
  const [currentStoryAuthorId, setCurrentStoryAuthorId] = useState<string | undefined>(undefined);
  const [activePostMenuId, setActivePostMenuId] = useState<number | null>(null);
  const [showSyncHint, setShowSyncHint] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);
  const [currentVideoDurationMs, setCurrentVideoDurationMs] = useState<number | null>(null);

  const getStoryDurationMs = (story: Story | null): number => {
    if (!story) return 5000;
    if (story.type === 'video') {
      // Use measured duration if available (cap at 30s), otherwise default 30s
      return (viewingStory && story.id === viewingStory.id && currentVideoDurationMs)
        ? currentVideoDurationMs
        : 30000;
    }
    return 5000;
  };

  // Autoplay story video with sound when story changes (no controls)
  useEffect(() => {
    const v = storyVideoRef.current;
    setCurrentVideoDurationMs(null);
    if (!v) return;
    try {
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => {});
    } catch {}
  }, [viewingStory]);

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
    return post.author === user.name;
  };

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

  const myStories = user ? stories.filter((s) => (s.authorId ? s.authorId === user.id : s.author === user.name)) : [];
  const otherStories = user ? stories.filter((s) => (s.authorId ? s.authorId !== user.id : s.author !== user.name)) : stories;
  const hasMyStories = myStories.length > 0;
  const latestMyStory = hasMyStories ? myStories[0] : null;

  const otherGroups = React.useMemo(() => {
    const map = new Map<string, { author: string; authorId?: string; stories: Story[]; latestTs: number }>();
    for (const s of otherStories) {
      const key = s.authorId ? `id:${s.authorId}` : `name:${s.author}`;
      const entry = map.get(key);
      if (entry) {
        entry.stories.push(s);
        const ts = s.createdAt || 0;
        if (ts > entry.latestTs) entry.latestTs = ts;
      } else {
        map.set(key, { author: s.author, authorId: s.authorId, stories: [s], latestTs: s.createdAt || 0 });
      }
    }
    const arr = Array.from(map.values());
    arr.forEach((g) => g.stories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    arr.sort((a, b) => b.latestTs - a.latestTs);
    return arr;
  }, [otherStories]);

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

  const viewStory = (story: Story) => {
    const authorStories = stories.filter((s) => (story.authorId ? s.authorId === story.authorId : s.author === story.author));
    const indexInAuthor = authorStories.findIndex((s) => s.id === story.id);
    if (indexInAuthor === -1) return;

    setCurrentStoryAuthor(story.author);
    setCurrentStoryAuthorId(story.authorId);
    setActiveStoryIndex(indexInAuthor);
    setViewingStory(story);
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, viewed: true } : s)),
    );
  };

  const closeStory = () => {
    setViewingStory(null);
    setActiveStoryIndex(null);
    setCurrentStoryAuthor(null);
    setCurrentStoryAuthorId(undefined);
  };

  const goToNextStory = () => {
    if (!currentStoryAuthor || activeStoryIndex === null) return;
    const authorStories = stories.filter((s) => (currentStoryAuthorId ? s.authorId === currentStoryAuthorId : s.author === currentStoryAuthor));
    if (authorStories.length === 0) return;

    const nextIndex = activeStoryIndex + 1;
    if (nextIndex >= authorStories.length) {
      closeStory();
    } else {
      const nextStory = authorStories[nextIndex];
      setActiveStoryIndex(nextIndex);
      setViewingStory(nextStory);
      setStories((prev) =>
        prev.map((s) => (s.id === nextStory.id ? { ...s, viewed: true } : s)),
      );
    }
  };

  const goToPreviousStory = () => {
    if (!currentStoryAuthor || activeStoryIndex === null) return;
    const authorStories = stories.filter((s) => (currentStoryAuthorId ? s.authorId === currentStoryAuthorId : s.author === currentStoryAuthor));
    if (authorStories.length === 0) return;

    const prevIndex = activeStoryIndex - 1;
    if (prevIndex < 0) {
      closeStory();
    } else {
      const prevStory = authorStories[prevIndex];
      setActiveStoryIndex(prevIndex);
      setViewingStory(prevStory);
      setStories((prev) =>
        prev.map((s) => (s.id === prevStory.id ? { ...s, viewed: true } : s)),
      );
    }
  };

  // Auto-advance stories within the current author's story list only
  useEffect(() => {
    if (activeStoryIndex === null || !viewingStory || !currentStoryAuthor) return;

    const authorStories = stories.filter((s) => (currentStoryAuthorId ? s.authorId === currentStoryAuthorId : s.author === currentStoryAuthor));
    if (authorStories.length === 0) return;

    const duration = getStoryDurationMs(viewingStory);
    const timer = window.setTimeout(() => {
      const nextIndex = activeStoryIndex + 1;
      if (nextIndex >= authorStories.length) {
        closeStory();
      } else {
        const nextStory = authorStories[nextIndex];
        setActiveStoryIndex(nextIndex);
        setViewingStory(nextStory);
        setStories((prev) =>
          prev.map((s) =>
            s.id === nextStory.id ? { ...s, viewed: true } : s,
          ),
        );
      }
    }, duration);

    return () => window.clearTimeout(timer);
  }, [activeStoryIndex, viewingStory, currentStoryAuthor, currentStoryAuthorId, stories, currentVideoDurationMs]);

  useEffect(() => {
    const handleSyncUpdate = (syncData: any) => {
      if (!syncData || syncData.type !== 'communityStories') return;

      if (syncData.action === 'add') {
        setStories(prev => {
          const now = Date.now();
          const dayMs = 24 * 60 * 60 * 1000;
          const incoming = syncData.data || {};
          let ts: number | undefined;
          if (typeof incoming.createdAt === 'number') ts = incoming.createdAt;
          else if (typeof incoming.createdAt === 'string') { const t = Date.parse(incoming.createdAt); if (!isNaN(t)) ts = t; }
          else if (typeof incoming.id === 'number') ts = incoming.id; else if (typeof incoming.id === 'string' && /^\d{10,}$/.test(incoming.id)) ts = parseInt(incoming.id, 10);
          ts = ts || now;
          if (now - ts > dayMs) return prev;
          const merged = [...prev];
          const idx = merged.findIndex((s) => String(s.id) === String(incoming.id));
          const next = { ...incoming, createdAt: ts } as Story;
          if (idx === -1) merged.unshift(next); else {
            const prevObj = merged[idx] as any;
            const nextTs = (next as any).createdAt || 0;
            const prevTs = (prevObj as any).createdAt || 0;
            const prefer = (next.media && !prevObj.media) ? next : ((next.type === 'video' && prevObj.type !== 'video') ? next : (nextTs > prevTs ? next : prevObj));
            merged[idx] = prefer;
          }
          return merged;
        });
      } else if (syncData.action === 'update') {
        setStories(prev => {
          const incoming = syncData.data || {};
          let ts: number | undefined;
          if (typeof incoming.createdAt === 'number') ts = incoming.createdAt;
          else if (typeof incoming.createdAt === 'string') { const t = Date.parse(incoming.createdAt); if (!isNaN(t)) ts = t; }
          else if (typeof incoming.id === 'number') ts = incoming.id; else if (typeof incoming.id === 'string' && /^\d{10,}$/.test(incoming.id)) ts = parseInt(incoming.id, 10);
          const next = { ...incoming, createdAt: ts || Date.now() } as Story;
          const arr = prev.map(s => String(s.id) === String(next.id) ? next : s);
          return arr;
        });
      } else if (syncData.action === 'delete') {
        setStories(prev => prev.filter((s) => s.id !== syncData.data.id));
      }
    };

    websocketService.addListener('sync_update', handleSyncUpdate);

    return () => {
      websocketService.removeListener('sync_update', handleSyncUpdate);
    };
  }, []);

  // On first load, if we have no stories cached, pull them from server
  useEffect(() => {
    if (stories.length > 0) return;
    let cancelled = false;
    const resolveApiUrl = (): string => {
      try {
        const w: any = (typeof window !== 'undefined') ? window : {};
        const fromWindow = w.__APP_RUNTIME_CONFIG__?.apiUrl;
        const fromStorage = (typeof localStorage !== 'undefined') ? localStorage.getItem('apiBaseUrl') : null;
        const fromEnv = (import.meta as any)?.env?.VITE_API_URL;
        const fallback = 'https://church-app-server.onrender.com/api';
        const url = (fromStorage || fromWindow || fromEnv || fallback) as string;
        return url.endsWith('/') ? url.replace(/\/$/, '') : url;
      } catch {
        return 'https://church-app-server.onrender.com/api';
      }
    };
    const apiUrl = resolveApiUrl();
    const fetchInitialStories = async () => {
      try {
        const controller = new AbortController();
        const id = window.setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${apiUrl}/community-stories`, { signal: controller.signal });
        window.clearTimeout(id);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          const now = Date.now();
          const dayMs = 24 * 60 * 60 * 1000;
          const norm = data.map((d: any) => {
            let ts: number | undefined;
            if (typeof d?.createdAt === 'number') ts = d.createdAt;
            else if (typeof d?.createdAt === 'string') { const t = Date.parse(d.createdAt); if (!isNaN(t)) ts = t; }
            else if (typeof d?.id === 'number') ts = d.id; else if (typeof d?.id === 'string' && /^\d{10,}$/.test(d.id)) ts = parseInt(d.id, 10);
            return { ...d, createdAt: ts || now } as Story;
          }).filter((s: Story) => now - (s.createdAt || now) <= dayMs);
          const byId = new Map<string, Story>();
          [...stories, ...norm].forEach((s: any) => {
            const k = String(s.id);
            const prev = byId.get(k);
            if (!prev) byId.set(k, s); else {
              const prefer = (s.media && !prev.media) ? s : ((s.type === 'video' && prev.type !== 'video') ? s : (s.createdAt > (prev.createdAt || 0) ? s : prev));
              byId.set(k, prefer);
            }
          });
          const merged = Array.from(byId.values()).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
          setStories(merged);
          try { localStorage.setItem('communityStories', JSON.stringify(merged)); } catch {}
        }
      } catch (e) {
        console.error('[CommunityFeed] Failed to fetch community stories from server', e);
      }
    };
    fetchInitialStories();
    return () => { cancelled = true; };
  }, []);

  // Persist stories when they change (e.g. when new stories are added or marked viewed)
  useEffect(() => {
    try {
      console.log('[CommunityFeed] Saving communityStories to localStorage:', stories.length);
      localStorage.setItem('communityStories', JSON.stringify(stories));
    } catch (error) {
      console.error('Error saving communityStories to localStorage', error);
    }
  }, [stories]);

  useEffect(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const tick = () => {
      const now = Date.now();
      setStories(prev => {
        const filtered = (prev || []).map((s: any) => {
          if (typeof s?.createdAt === 'number') return s;
          if (typeof s?.createdAt === 'string') { const t = Date.parse(s.createdAt); if (!isNaN(t)) return { ...s, createdAt: t }; }
          if (typeof s?.id === 'number') return { ...s, createdAt: s.id };
          if (typeof s?.id === 'string' && /^\d{10,}$/.test(s.id)) return { ...s, createdAt: parseInt(s.id, 10) };
          return s;
        }).filter((s: any) => typeof s.createdAt === 'number' ? (now - s.createdAt <= dayMs) : true);
        return filtered.length === prev.length ? prev : filtered;
      });
    };
    tick();
    const interval = window.setInterval(tick, 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Lightweight sync hint: if both posts and stories are empty, show a small message while
  // initial data is being pulled from the server. This never blocks rendering cached content.
  useEffect(() => {
    if (posts.length === 0 && stories.length === 0) {
      const id = window.setTimeout(() => setShowSyncHint(true), 1500);
      return () => window.clearTimeout(id);
    }
    setShowSyncHint(false);
  }, [posts.length, stories.length]);

  return (
    <div
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
        {/* Stories Section */}
        <div
          style={{
            backgroundColor: isDark ? '#020617' : 'white',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {/* Your Story - card style */}
            <div
              style={{
                minWidth: '110px',
                height: '190px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: isDark ? '#020617' : 'white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
              }}
              onClick={() =>
                hasMyStories && latestMyStory
                  ? viewStory(latestMyStory)
                  : navigate('/create-post?mode=story')
              }
            >
              <div
                style={{
                  height: '70%',
                  position: 'relative',
                  background:
                    !latestMyStory
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)'
                      : ((latestMyStory.media && latestMyStory.media.type === 'image') || latestMyStory.type === 'photo')
                        ? `url(${(latestMyStory.media as any)?.url || ''}) center/cover no-repeat`
                        : 'transparent',
                }}
              >
                {latestMyStory && ((latestMyStory.media && latestMyStory.media.type === 'video') || latestMyStory.type === 'video') && (
                  <>
                    <video
                      src={(latestMyStory.media as any)?.url || '' }
                      muted
                      playsInline
                      preload="metadata"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ▶
                    </div>
                  </>
                )}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  fontSize: 14,
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
                      color: '#3b82f6',
                      fontWeight: 'bold',
                      fontSize: 14,
                    }}
                  >
                    {currentUserAvatar}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/create-post?mode=story'); }}
                style={{
                  position: 'absolute',
                  bottom: 40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'white',
                  borderRadius: 9999,
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#1877f2',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
                <span>Create story</span>
              </button>
              <div
                style={{
                  padding: '8px',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Your story
              </div>
            </div>

            {otherGroups.map((g) => {
              const latest = g.stories[0];
              const isImage = !!(latest && (((latest as any).media && (latest as any).media.type === 'image') || latest.type === 'photo'));
              const isVideo = !!(latest && (((latest as any).media && (latest as any).media.type === 'video') || latest.type === 'video'));
              const anyViewed = g.stories.some(s => s.viewed);
              const avatarInitial = (g.author || '').trim().charAt(0).toUpperCase() || '?';
              return (
              <div
                key={g.authorId ? `id:${g.authorId}` : `name:${g.author}`}
                onClick={() => viewStory(latest)}
                style={{
                  minWidth: '110px',
                  height: '190px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  backgroundColor: '#000',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: anyViewed ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '8px',
                    background: !latest
                      ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                      : (isImage ? `url(${((latest as any).media as any)?.url || ''}) center/cover no-repeat` : 'transparent'),
                  }}
                >
                  {isVideo && (
                    <>
                      <video
                        src={(((latest as any).media as any)?.url || '')}
                        muted
                        playsInline
                        preload="metadata"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          width: 26,
                          height: 26,
                          borderRadius: 9999,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ▶
                      </div>
                    </>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <div style={{ position: 'relative', width: 32, height: 32 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(15,23,42,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 13,
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {getUserProfilePicture(g.authorId, g.author) ? (
                            <img
                              src={getUserProfilePicture(g.authorId, g.author) as string}
                              alt={g.author}
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
                                fontSize: 13,
                              }}
                            >
                              {avatarInitial}
                            </span>
                          )}
                        </div>
                        <span
                          aria-label={isUserOnline(g.authorId, g.author) ? 'Online' : 'Offline'}
                          style={{
                            position: 'absolute',
                            right: -2,
                            bottom: -2,
                            width: 9,
                            height: 9,
                            borderRadius: 9999,
                            backgroundColor: isUserOnline(g.authorId, g.author) ? '#10b981' : '#9ca3af',
                            border: '2px solid rgba(255,255,255,0.9)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                        }}
                      >
                        {g.author}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              ); })}
          </div>
        </div>

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
            onClick={() => setActiveComment(post.id)}
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
                  {getUserProfilePicture(post.author) ? (
                    <img
                      src={getUserProfilePicture(post.author) as string}
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

            {/* Post Content */}
            <div style={{ padding: '0 16px 12px' }}>
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
            </div>

            {post.media && (
              <div style={{ padding: '0 16px 12px' }}>
                {post.media.type === 'image' ? (
                  <img
                    src={post.media.url}
                    alt="Post media"
                    style={{
                      width: '100%',
                      maxHeight: '360px',
                      objectFit: 'cover',
                      borderRadius: 10,
                    }}
                  />
                ) : (
                  <video
                    controls
                    src={post.media.url}
                    style={{
                      width: '100%',
                      maxHeight: '360px',
                      borderRadius: 10,
                      backgroundColor: '#000',
                    }}
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
                onClick={() => handleLike(post.id)}
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
                onClick={() => setActiveComment(post.id)}
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
                onClick={() => handleShare(post.id)}
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

      {/* Story Viewer */}
      {viewingStory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'black',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '448px',
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 8px)',
                left: 8,
                right: 8,
                display: 'flex',
                gap: 4,
              }}
            >
              {(currentStoryAuthor
                ? stories.filter((s) => s.author === currentStoryAuthor)
                : stories
              ).map((story, index) => (
                <div
                  key={story.id}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 9999,
                    backgroundColor: 'rgba(148, 163, 184, 0.5)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width:
                        activeStoryIndex === null
                          ? '0%'
                          : index < activeStoryIndex
                          ? '100%'
                          : index === activeStoryIndex
                          ? '100%'
                          : '0%',
                      backgroundColor: '#f9fafb',
                      transition:
                        index === activeStoryIndex
                          ? `width ${getStoryDurationMs(story) / 1000}s linear`
                          : 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '16px',
                paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {getUserProfilePicture(viewingStory.author) ? (
                    <img
                      src={getUserProfilePicture(viewingStory.author) as string}
                      alt={viewingStory.author}
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
                        color: '#111827',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      {viewingStory.avatar}
                    </span>
                  )}
                </div>
                <span
                  aria-label={isUserOnline(viewingStory?.authorId, viewingStory?.author) ? 'Online' : 'Offline'}
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    backgroundColor: isUserOnline(viewingStory?.authorId, viewingStory?.author) ? '#10b981' : '#9ca3af',
                    border: '2px solid white',
                  }}
                />
                <span
                  style={{ color: 'white', fontWeight: 600 }}
                >
                  {viewingStory.author}
                </span>
              </div>
              <button
                onClick={closeStory}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <FiX size={24} />
              </button>
            </div>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80%',
              }}
            >
              {viewingStory.media ? (
                viewingStory.media.type === 'image' ? (
                  <img
                    src={viewingStory.media.url}
                    alt="Story media"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '80%',
                      borderRadius: 16,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <video
                    ref={storyVideoRef}
                    src={viewingStory.media.url}
                    autoPlay
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      try {
                        const v = e.currentTarget as HTMLVideoElement;
                        const durMs = Math.min(30000, Math.max(1000, (isFinite(v.duration) ? v.duration : 0) * 1000));
                        if (durMs && isFinite(durMs)) {
                          setCurrentVideoDurationMs(durMs);
                        }
                      } catch {}
                    }}
                    onEnded={() => {
                      // Advance immediately when the video ends, even if timer hasn't elapsed
                      goToNextStory();
                    }}
                    onTouchStart={() => storyVideoRef.current?.pause()}
                    onTouchEnd={() => storyVideoRef.current?.play()}
                    onPointerDown={() => storyVideoRef.current?.pause()}
                    onPointerUp={() => storyVideoRef.current?.play()}
                    style={{
                      width: '100%',
                      maxHeight: '80%',
                      borderRadius: 16,
                      backgroundColor: '#000',
                    }}
                  />
                )
              ) : (
                <p
                  style={{
                    color: 'white',
                    fontSize: '24px',
                    textAlign: 'center',
                    padding: '0 32px',
                  }}
                >
                  {viewingStory.content}
                </p>
              )}

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                  }}
                  onClick={goToPreviousStory}
                />
                <div
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                  }}
                  onClick={goToNextStory}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFeedPage;
