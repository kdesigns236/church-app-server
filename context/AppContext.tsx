import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { Sermon, Announcement, Event, SiteContent, PrayerRequest, BibleStudy, ChatMessage, User, SermonComment, Post, Comment } from '../types';
import { websocketService } from '../services/websocketService';
import { notificationService } from '../services/notificationService';
import { localNotificationService } from '../services/localNotificationService';
import { initialSiteContent } from '../constants/siteContent';
import { useAuth } from '../hooks/useAuth';
import { videoStorageService } from '../services/videoStorageService';
import { safeBackgroundFetchService } from '../services/safeBackgroundFetchService';

interface AppContextType {
    sermons: Sermon[];
    announcements: Announcement[];
    events: Event[];
    siteContent: SiteContent;
    prayerRequests: PrayerRequest[];
    bibleStudies: BibleStudy[];
    chatMessages: ChatMessage[];
    posts: Post[];
    updateSermon: (sermon: Sermon) => void;
    addSermon: (sermon: Omit<Sermon, 'id' | 'likes' | 'comments' | 'isLiked' | 'isSaved' | 'date'>) => void;
    deleteSermon: (id: string) => void;
    updateAnnouncement: (announcement: Announcement) => void;
    addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
    deleteAnnouncement: (id: number) => void;
    updateEvent: (event: Event) => void;
    addEvent: (event: Omit<Event, 'id'>) => void;
    deleteEvent: (id: string) => void;
    updateSiteContent: (newContent: SiteContent) => void;
    handleSermonInteraction: (sermonId: string, type: 'like' | 'save') => void;
    addSermonComment: (sermonId: string, commentContent: string, user: User) => void;
    addPrayerRequest: (request: Omit<PrayerRequest, 'id' | 'date' | 'isPrayedFor'>) => void;
    deletePrayerRequest: (id: string) => void;
    togglePrayerRequestPrayedFor: (id: string) => void;
    addBibleStudy: (study: Omit<BibleStudy, 'id' | 'date'>) => void;
    updateBibleStudy: (study: BibleStudy) => void;
    deleteBibleStudy: (id: string) => void;
    addChatMessage: (messageData: { content?: string; media?: { url: string; type: 'image' | 'video' | 'audio'; }; replyTo?: ChatMessage; }, user: User) => void;
    deleteChatMessage: (messageId: string) => void;
    createPost: (content: string, user: User, media?: { url: string; type: 'image' | 'video' }) => Post | undefined;
    updatePost: (post: Post) => void;
    handlePostInteraction: (postId: number, type: 'like' | 'share') => void;
    addPostComment: (postId: number, commentText: string, user: User) => void;
    deletePost: (postId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// App version for cache busting
const APP_VERSION = '2.0.0'; // Increment this to clear all localStorage
const SYNC_TTL_MS = 15 * 60 * 1000;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, users } = useAuth();

    // Clear old localStorage data if app version changed (but preserve user auth and community data)
    React.useEffect(() => {
      const storedVersion = localStorage.getItem('appVersion');
      if (storedVersion !== APP_VERSION) {
        console.log('[AppContext] 🔄 New app version detected, clearing old data...');

        // Preserve critical data
        const authUser = localStorage.getItem('authUser');
        const authToken = localStorage.getItem('authToken');
        const communityPosts = localStorage.getItem('communityPosts');
        const communityStories = localStorage.getItem('communityStories');
        const sermonsLS = localStorage.getItem('sermons');
        const announcementsLS = localStorage.getItem('announcements');
        const eventsLS = localStorage.getItem('events');
        const siteContentLS = localStorage.getItem('siteContent');
        const prayerRequestsLS = localStorage.getItem('prayerRequests');
        const bibleStudiesLS = localStorage.getItem('bibleStudies');
        const chatMessagesLS = localStorage.getItem('chatMessages');
        const communityCommentsLS = localStorage.getItem('communityComments');

        // Clear everything
        localStorage.clear();

        // Restore preserved data
        if (authUser) localStorage.setItem('authUser', authUser);
        if (authToken) localStorage.setItem('authToken', authToken);
        if (communityPosts) {
          try {
            const parsed = JSON.parse(communityPosts);
            if (Array.isArray(parsed)) {
              const safe = (parsed || []).slice(0, 200).map((p: any) => ({
                ...p,
                media: p?.media && typeof p.media.url === 'string' && (p.media.url.startsWith('data:') || p.media.url.startsWith('blob:')) ? undefined : p?.media,
              }));
              localStorage.setItem('communityPosts', JSON.stringify(safe));
            } else {
              localStorage.setItem('communityPosts', communityPosts);
            }
          } catch {
            localStorage.setItem('communityPosts', communityPosts);
          }
        }
        if (communityStories) {
          try {
            const parsed = JSON.parse(communityStories);
            if (Array.isArray(parsed)) {
              const safe = (parsed || []).slice(0, 100).map((s: any) => ({
                ...s,
                media: s?.media && typeof s.media.url === 'string' && (s.media.url.startsWith('data:') || s.media.url.startsWith('blob:')) ? undefined : s?.media,
              }));
              localStorage.setItem('communityStories', JSON.stringify(safe));
            } else {
              localStorage.setItem('communityStories', communityStories);
            }
          } catch {
            localStorage.setItem('communityStories', communityStories);
          }
        }
        if (sermonsLS) localStorage.setItem('sermons', sermonsLS);
        if (announcementsLS) localStorage.setItem('announcements', announcementsLS);
        if (eventsLS) localStorage.setItem('events', eventsLS);
        if (siteContentLS) localStorage.setItem('siteContent', siteContentLS);
        if (prayerRequestsLS) localStorage.setItem('prayerRequests', prayerRequestsLS);
        if (bibleStudiesLS) localStorage.setItem('bibleStudies', bibleStudiesLS);
        if (chatMessagesLS) localStorage.setItem('chatMessages', chatMessagesLS);
        if (communityCommentsLS) localStorage.setItem('communityComments', communityCommentsLS);

        localStorage.setItem('appVersion', APP_VERSION);
        console.log('[AppContext] ✅ Old data cleared, auth and community data preserved!');
      }
    }, []);

    const [sermons, setSermons] = useState<Sermon[]>(() => {
      try {
        const storedSermons = localStorage.getItem('sermons');
        return storedSermons ? JSON.parse(storedSermons) : [];
      } catch (error) {
        console.error('Error parsing sermons from localStorage', error);
        return [];
      }
    });
    const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
      try {
        const storedAnnouncements = localStorage.getItem('announcements');
        return storedAnnouncements ? JSON.parse(storedAnnouncements) : [];
      } catch (error) {
        console.error('Error parsing announcements from localStorage', error);
        return [];
      }
    });
    const [events, setEvents] = useState<Event[]>(() => {
      try {
        const storedEvents = localStorage.getItem('events');
        return storedEvents ? JSON.parse(storedEvents) : [];
      } catch (error) {
        console.error('Error parsing events from localStorage', error);
        return [];
      }
    });
    const [siteContent, setSiteContent] = useState<SiteContent>(() => {
      try {
        const storedSiteContent = localStorage.getItem('siteContent');
        return storedSiteContent ? JSON.parse(storedSiteContent) : initialSiteContent;
      } catch (error) {
        console.error('Error parsing siteContent from localStorage', error);
        return initialSiteContent;
      }
    });
    const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>(() => {
      try {
        const storedPrayerRequests = localStorage.getItem('prayerRequests');
        return storedPrayerRequests ? JSON.parse(storedPrayerRequests) : [];
      } catch (error) {
        console.error('Error parsing prayerRequests from localStorage', error);
        return [];
      }
    });
    const [bibleStudies, setBibleStudies] = useState<BibleStudy[]>(() => {
      try {
        const storedBibleStudies = localStorage.getItem('bibleStudies');
        return storedBibleStudies ? JSON.parse(storedBibleStudies) : [];
      } catch (error) {
        console.error('Error parsing bibleStudies from localStorage', error);
        return [];
      }
    });
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
      try {
        const storedChatMessages = localStorage.getItem('chatMessages');
        if (storedChatMessages) {
          const parsed = JSON.parse(storedChatMessages);
          // Ensure it's an array - if it's an object, wrap it in an array
          if (Array.isArray(parsed)) {
            return parsed;
          } else if (parsed && typeof parsed === 'object') {
            console.warn('[AppContext] chatMessages was an object, converting to array and fixing localStorage');
            const fixedArray = [parsed];
            // Fix localStorage immediately
            localStorage.setItem('chatMessages', JSON.stringify(fixedArray));
            return fixedArray;
          } else {
            console.warn('[AppContext] chatMessages had invalid format, resetting to empty array');
            localStorage.setItem('chatMessages', JSON.stringify([]));
            return [];
          }
        }
        return [];
      } catch (error) {
        console.error('[AppContext] Error parsing chatMessages from localStorage, resetting:', error);
        localStorage.setItem('chatMessages', JSON.stringify([]));
        return [];
      }
    });

    const [posts, setPosts] = useState<Post[]>(() => {
      try {
        const storedPosts = localStorage.getItem('communityPosts');
        const parsed = storedPosts ? JSON.parse(storedPosts) : [];
        const sanitized = Array.isArray(parsed)
          ? parsed.map((p: any) => ({
              ...p,
              media:
                p?.media && typeof p.media.url === 'string' && p.media.url.startsWith('data:')
                  ? undefined
                  : p?.media,
            }))
          : [];
        return sanitized;
      } catch (error) {
        console.error('Error parsing posts from localStorage', error);
        return [];
      }
    });

    const [comments, setComments] = useState<Comment[]>(() => {
      try {
        const storedComments = localStorage.getItem('communityComments');
        return storedComments ? JSON.parse(storedComments) : [];
      } catch (error) {
        console.error('Error parsing comments from localStorage', error);
        return [];
      }
    });

    // Clean up any legacy demo community posts that may be in localStorage
    useEffect(() => {
      setPosts(prev => {
        const filtered = prev.filter(post => {
          if (!post || typeof post !== 'object') {
            return true;
          }
          const anyPost: any = post;
          const content: string = anyPost.content || '';
          const author: string = anyPost.author || '';

          const isDemo =
            (author === 'Media Team' && content.includes('(Image demo)')) ||
            (author === 'Livestream Team' && content.includes('(Video demo)')) ||
            content.includes('Blessed Sunday service today! Thank you all for joining us in worship.') ||
            content.includes('Prayer request: Please pray for my grandmother who is recovering from surgery');

          return !isDemo;
        });

      // Direct socket handlers for low-latency chat
      try {
        const sock = websocketService.getSocket();
        // simple beep on incoming
        const playBeep = () => {
          try {
            const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.03;
            o.connect(g); g.connect(ctx.destination); o.start();
            setTimeout(() => { try { o.stop(); ctx.close(); } catch {} }, 90);
          } catch {}
        };

        sock.on('chat:new', (msg: any) => {
          if (!msg || !msg.id) return;
          setChatMessages(prev => {
            const exists = (prev || []).some((m) => String(m.id) === String(msg.id));
            if (exists) return prev;
            const updated = [...(prev || []), msg];
            try {
              let shouldNotify = true;
              const auRaw = localStorage.getItem('authUser');
              if (auRaw) { const au = JSON.parse(auRaw); if (au && au.id === msg.userId) shouldNotify = false; }
              if (window.location.hash.includes('/chat')) shouldNotify = false;
              if (shouldNotify) localNotificationService.showChatNotification(msg.senderName, msg.content || '📷 Sent a photo');
            } catch {}
            playBeep();
            return updated;
          });
          // delivery ack back to sender
          try { const token = localStorage.getItem('authToken'); if (token) sock.emit('chat:delivered', { token, id: msg.id }); } catch {}
        });

        sock.on('chat:ack', ({ id }: any) => {
          if (!id) return;
          const rt = pendingChatRestTimersRef.current.get(String(id));
          if (typeof rt === 'number') { try { window.clearTimeout(rt); } catch {} pendingChatRestTimersRef.current.delete(String(id)); }
          const t = pendingChatTimersRef.current.get(String(id));
          if (typeof t === 'number') { try { window.clearTimeout(t); } catch {} pendingChatTimersRef.current.delete(String(id)); }
          setChatMessages(prev => (prev || []).map(m => String(m.id) === String(id) ? { ...m, status: 'sent' } : m));
        });

        sock.on('chat:status', ({ id, status }: any) => {
          if (!id || !status) return;
          setChatMessages(prev => (prev || []).map(m => String(m.id) === String(id) ? { ...m, status } : m));
        });
      } catch {}

        if (filtered.length !== prev.length) {
          safeSetItem('communityPosts', filtered);
          console.log('[AppContext] Removed legacy community demo posts from localStorage');
        }

        return filtered;
      });
    }, []);

    // Normalize any legacy/non-ISO post/comment times to ISO whenever posts change
    useEffect(() => {
      try {
        const isIso = (s: any) => typeof s === 'string' && s.includes('T') && !isNaN(Date.parse(s));
        let changed = false;
        const normalized = (Array.isArray(posts) ? posts : []).map(p => {
          let updated = p;
          const pt: any = (p as any).time;
          if (!isIso(pt)) {
            const fallback = typeof p.id === 'number' ? new Date(p.id).toISOString() : new Date().toISOString();
            updated = { ...updated, time: fallback };
            changed = true;
          }
          if (Array.isArray(p.comments)) {
            const updatedComments = p.comments.map(c => {
              if (!isIso((c as any).time)) {
                const cfallback = typeof c.id === 'number' ? new Date(c.id).toISOString() : new Date().toISOString();
                changed = true;
                return { ...c, time: cfallback };
              }
              return c;
            });
            // Replace only if any changed
            if (updatedComments.some((c, idx) => c.time !== p.comments[idx].time)) {
              updated = { ...updated, comments: updatedComments };
            }
          }
          return updated;
        });
        if (changed) {
          setPosts(normalized as Post[]);
          safeSetItem('communityPosts', normalized);
        }
      } catch {}
    }, [posts]);

    // Migrate posts/comments to include authorId by matching user name -> id
    useEffect(() => {
      try {
        const list = Array.isArray(posts) ? posts : [];
        const userList = Array.isArray(users) ? users : [];
        let changed = false;
        const withIds = list.map((p) => {
          let np = p as any;
          if (!np.authorId) {
            const match = userList.find(u => u.name === np.author);
            if (match) {
              np = { ...np, authorId: match.id };
              changed = true;
            }
          }
          if (Array.isArray(np.comments)) {
            const newComments = np.comments.map((c: any) => {
              if (!c.authorId) {
                const cm = userList.find(u => u.name === c.author);
                if (cm) {
                  return { ...c, authorId: cm.id };
                }
              }
              return c;
            });
            // Replace only if any comment changed (cheap compare by pointer inequality)
            if (newComments.some((c: any, i: number) => c !== np.comments[i])) {
              np = { ...np, comments: newComments };
              changed = true;
            }
          }
          return np;
        });
        if (changed) {
          setPosts(withIds as Post[]);
          safeSetItem('communityPosts', withIds);
        }
      } catch {}
    }, [users, posts]);

    // Helper function to save data and update sync timestamp
    const saveToLocalStorage = (key: string, data: any) => {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
      try { localStorage.setItem('lastSyncTime', Date.now().toString()); } catch {}
    };

    const slimPosts = (arr: any[]) => {
      const limit = 200;
      const sanitized = (arr || []).map((p: any) => ({
        ...p,
        media: p?.media && typeof p.media.url === 'string' && (p.media.url.startsWith('data:') || p.media.url.startsWith('blob:')) ? undefined : p?.media,
      }));
      return sanitized.slice(0, limit);
    };

    const slimStories = (arr: any[]) => {
      const limit = 100;
      const sanitized = (arr || []).map((s: any) => ({
        ...s,
        media: s?.media && typeof s.media.url === 'string' && (s.media.url.startsWith('data:') || s.media.url.startsWith('blob:')) ? undefined : s?.media,
      }));
      return sanitized.slice(0, limit);
    };

    const safeSetItem = (key: string, value: any) => {
      const toStore = key === 'communityPosts'
        ? slimPosts(Array.isArray(value) ? value : [])
        : key === 'communityStories'
          ? slimStories(Array.isArray(value) ? value : [])
          : value;
      try {
        localStorage.setItem(key, JSON.stringify(toStore));
      } catch (_e) {
        try {
          if (key === 'communityPosts') {
            localStorage.setItem(key, JSON.stringify(slimPosts(value)));
          } else if (key === 'communityStories') {
            localStorage.setItem(key, JSON.stringify(slimStories(value)));
          }
        } catch {}
      }
      try { localStorage.setItem('lastSyncTime', Date.now().toString()); } catch {}
    };

    // Merge-add: keep existing local items; add any new items from server by id
    const mergeAddOnly = <T extends { id: any }>(prev: T[], incoming: T[]) => {
      try {
        const existing = new Set((prev || []).map((i: any) => i && i.id));
        const toAdd = (incoming || []).filter((i: any) => i && !existing.has(i.id));
        return Array.isArray(prev) ? [...prev, ...toAdd] : toAdd;
      } catch (_) {
        return Array.isArray(prev) ? prev : [];
      }
    };

    const prefetchInFlightRef = useRef<Set<string>>(new Set());
    const pendingChatTimersRef = useRef<Map<string, number>>(new Map());
    const pendingChatRestTimersRef = useRef<Map<string, number>>(new Map());

    // Background prefetch: automatically download sermon videos into IndexedDB
    const prefetchSermonVideos = async (sermonsToPrefetch: Sermon[]) => {
      try {
        const resolveApiUrlForPrefetch = (): string => {
          try {
            const w: any = (typeof window !== 'undefined') ? window : {};
            const fromWindow = w.__APP_RUNTIME_CONFIG__?.apiUrl;
            const fromStorage = (typeof localStorage !== 'undefined') ? localStorage.getItem('apiBaseUrl') : null;
            const fromEnv = (import.meta as any).env?.VITE_API_URL;
            const fallback = 'https://church-app-server.onrender.com/api';
            const url = (fromStorage || fromWindow || fromEnv || fallback) as string;
            return url.endsWith('/') ? url.replace(/\/$/, '') : url;
          } catch {
            return 'https://church-app-server.onrender.com/api';
          }
        };

        const isTokenizedFirebaseUrl = (u: string): boolean => {
          try {
            if (!u || !u.includes('firebasestorage.googleapis.com')) return false;
            const url = new URL(u);
            return !!url.searchParams.get('token');
          } catch {
            return false;
          }
        };

        const resolveFirebaseDownloadUrlFromServer = async (storagePath: string, bucket?: string): Promise<string | null> => {
          try {
            const base = resolveApiUrlForPrefetch();
            const qs = new URLSearchParams();
            qs.set('path', storagePath);
            if (bucket) qs.set('bucket', bucket);
            const resp = await fetch(`${base}/firebase-storage/download-url?${qs.toString()}`);
            if (!resp.ok) return null;
            const data: any = await resp.json();
            const url = data && typeof data.url === 'string' ? data.url : '';
            return url || null;
          } catch {
            return null;
          }
        };

        if (typeof window === 'undefined' || !navigator.onLine) {
          return;
        }
        if (document.readyState !== 'complete') {
          return;
        }
        // If offline cache is unavailable (e.g., private mode or restricted env), skip prefetch entirely
        try {
          if (videoStorageService && typeof (videoStorageService as any).isEnabled === 'function' && !(videoStorageService as any).isEnabled()) {
            return;
          }
        } catch {}

        let prefetched = 0;
        for (const sermon of sermonsToPrefetch) {
          if (!sermon || !sermon.videoUrl) continue;
          if (typeof sermon.videoUrl !== 'string') continue;

          let effectiveUrl: string = sermon.videoUrl;
          let resolvedFresh = false;
          try {
            const p: any = (sermon as any)?.firebaseStoragePath;
            const bucket: any = (sermon as any)?.firebaseBucket;
            if (typeof p === 'string' && p) {
              const r = await resolveFirebaseDownloadUrlFromServer(p, (typeof bucket === 'string' ? bucket : undefined));
              if (r) { effectiveUrl = r; resolvedFresh = true; }
              else if (isTokenizedFirebaseUrl(effectiveUrl)) { resolvedFresh = true; }
            } else if (!resolvedFresh && effectiveUrl.includes('firebasestorage.googleapis.com') && effectiveUrl.includes('/o/')) {
              const enc = effectiveUrl.split('/o/')[1]?.split('?')[0] || '';
              const path = decodeURIComponent(enc);
              if (path) {
                const r = await resolveFirebaseDownloadUrlFromServer(path, (typeof bucket === 'string' ? bucket : undefined));
                if (r) { effectiveUrl = r; resolvedFresh = true; }
                else if (isTokenizedFirebaseUrl(effectiveUrl)) {
                  resolvedFresh = true;
                }
              }
            }
          } catch {}

          if (!resolvedFresh && isTokenizedFirebaseUrl(effectiveUrl)) {
            resolvedFresh = true;
          }

          // If this is a Firebase Storage URL but we could not resolve a fresh signed URL, skip prefetch
          if (!resolvedFresh && effectiveUrl.includes('firebasestorage.googleapis.com') && effectiveUrl.includes('/o/')) {
            continue;
          }

          // Sanitize any legacy Firebase URL params to avoid malformed requests
          try {
            if (effectiveUrl.includes('firebasestorage.googleapis.com')) {
              const u = new URL(effectiveUrl);
              u.searchParams.delete('cors');
              const token = u.searchParams.get('token');
              if (token) { u.searchParams.delete('token'); u.searchParams.append('token', token); }
              u.searchParams.set('alt', 'media');
              effectiveUrl = u.toString();
            }
          } catch {}

          if (!effectiveUrl.startsWith('http://') && !effectiveUrl.startsWith('https://')) {
            continue;
          }

          const sermonId = String(sermon.id || '');
          if (!sermonId) continue;
          if (prefetchInFlightRef.current.has(sermonId)) continue;

          try {
            const alreadyHas = await videoStorageService.hasVideo(sermonId);
            if (alreadyHas) continue;

            prefetchInFlightRef.current.add(sermonId);
            console.log('[AppContext] 🎥 Prefetching video for sermon', sermonId);
            try {
              let size: number | null = null;
              // Try HEAD first
              try {
                const head = await fetch(effectiveUrl, { method: 'HEAD' as any });
                if (head.ok) {
                  const len = head.headers?.get('content-length');
                  if (len) size = parseInt(len, 10);
                }
              } catch {}

              // If HEAD failed or missing length, try Range GET (first byte)
              if (size === null || !isFinite(size)) {
                try {
                  const probe = await fetch(effectiveUrl, { headers: { Range: 'bytes=0-0' } });
                  if (probe.ok) {
                    const cr = probe.headers?.get('content-range') || '';
                    // Content-Range: bytes 0-0/1234567
                    const m = cr.match(/\/(\d+)$/);
                    if (m && m[1]) size = parseInt(m[1], 10);
                    if (!size || !isFinite(size)) {
                      const blob = await probe.blob();
                      size = blob.size || null;
                    }
                  }
                } catch {}
              }

              if (!size || !isFinite(size)) {
                continue;
              }
              const max = 120 * 1024 * 1024;
              if (size > max) {
                console.warn('[AppContext] Skipping prefetch (too large):', sermonId, Math.round(size/1024/1024), 'MB');
                continue;
              }
            } catch {
              continue;
            }

            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(effectiveUrl, { signal: controller.signal, cache: 'default' as any });
            clearTimeout(to);
            if (!response.ok) {
              console.warn('[AppContext] Failed to prefetch video for sermon', sermonId, response.status);
              continue;
            }

            const blob = await response.blob();
            const mimeType = blob.type || 'video/mp4';
            const extension = mimeType.split('/')[1] || 'mp4';
            const file = new File([blob], `sermon-${sermonId}.${extension}`, { type: mimeType });

            await videoStorageService.saveVideo(sermonId, file);
            console.log('[AppContext] ✅ Prefetched video for sermon', sermonId);
            try { window.dispatchEvent(new CustomEvent('sermon-prefetched', { detail: { id: sermonId } })); } catch {}
            prefetched += 1;
            if (prefetched >= 2) break;
            await new Promise((r) => setTimeout(r, 1500));
          } catch (error) {
            console.error('[AppContext] Error prefetching video for sermon', sermon.id, error);
          } finally {
            prefetchInFlightRef.current.delete(sermonId);
          }
        }
      } catch (err) {
        console.error('[AppContext] Error in prefetchSermonVideos:', err);
      }
    };

    // Request persistent storage so downloaded videos are not evicted by the browser
    useEffect(() => {
      (async () => {
        try {
          if ((navigator as any)?.storage?.persist) {
            const persisted = await (navigator as any).storage.persisted?.();
            if (!persisted) {
              await (navigator as any).storage.persist();
              console.log('[AppContext] Requested persistent storage for offline videos');
            }
          }
        } catch (e) {
          console.warn('[AppContext] Could not request persistent storage', e);
        }
      })();
    }, []);

    // Keep prefetching when we come online / periodically while the app is open
    useEffect(() => {
      const kick = () => {
        try { if (Array.isArray(sermons) && sermons.length > 0) safeBackgroundFetchService.scheduleBackgroundFetch(sermons); } catch {}
      };

      // Prefetch immediately if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        kick();
      }

      // When network comes back, prefetch missing videos
      window.addEventListener('online', kick);

      // Light periodic check while app is open (every 30 minutes)
      const interval = window.setInterval(() => {
        if (navigator.onLine) kick();
      }, 30 * 60 * 1000);

      // If user backgrounds the app and returns, attempt a prefetch shortly after
      const onVis = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          setTimeout(kick, 1500);
        }
      };
      document.addEventListener('visibilitychange', onVis);

      return () => {
        window.removeEventListener('online', kick);
        window.clearInterval(interval);
        document.removeEventListener('visibilitychange', onVis);
      };
    }, [sermons]);

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          if (!Array.isArray(sermons) || sermons.length === 0) return;
          if (document.readyState !== 'complete') {
            await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
          }
          await new Promise((r) => setTimeout(r, 5000));
          const ok = await safeBackgroundFetchService.initialize();
          if (!ok || cancelled) return;
          if (safeBackgroundFetchService.shouldFetch()) {
            await safeBackgroundFetchService.scheduleBackgroundFetch(sermons);
          }
        } catch {}
      })();
      return () => { cancelled = true; };
    }, [sermons]);

    // Periodically pull fresh data from server so app stays up-to-date without manual reopen
    useEffect(() => {
      let cancelled = false;
      const pull = async () => {
        try {
          const data = await websocketService.pullFromServer();
          if (cancelled || !data || typeof data !== 'object') return;
          if (Array.isArray(data.sermons) && data.sermons.length > 0) { setSermons(data.sermons as Sermon[]); localStorage.setItem('sermons', JSON.stringify(data.sermons)); }
          if (Array.isArray(data.announcements) && data.announcements.length > 0) { setAnnouncements(data.announcements as Announcement[]); localStorage.setItem('announcements', JSON.stringify(data.announcements)); }
          if (Array.isArray(data.events) && data.events.length > 0) { setEvents(data.events as Event[]); localStorage.setItem('events', JSON.stringify(data.events)); }
          if (data.siteContent && typeof data.siteContent === 'object' && Object.keys(data.siteContent).length > 0) { setSiteContent(data.siteContent as SiteContent); localStorage.setItem('siteContent', JSON.stringify(data.siteContent)); }
        } catch {}
      };

      const interval = window.setInterval(() => {
        if (navigator.onLine) pull();
      }, 10 * 60 * 1000); // every 10 minutes

      // Also run one minute after start if online
      const startTimer = window.setTimeout(() => { if (navigator.onLine) pull(); }, 60 * 1000);
      return () => { cancelled = true; window.clearInterval(interval); window.clearTimeout(startTimer); };
    }, []);

    // Helper: resolve API URL at runtime (no rebuild needed)
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

    // Fetch initial data from server on app load
    useEffect(() => {
      const fetchInitialData = async () => {
        try {
          console.log('[AppContext] 🔄 Fetching fresh data from server...');
          const fallbackApi = 'https://church-app-server.onrender.com/api';
          let apiUrl = resolveApiUrl();
          console.log('[AppContext] Resolved API URL:', apiUrl);
          
          // Always fetch fresh data on app start; rely on localStorage as initial render only
          console.log('[AppContext] 📡 Fetching fresh data from server (no-cache)...');
          
          // Add 10-second timeout to prevent app from hanging
          const fetchWithTimeout = (url: string, timeout = 6000) => {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(new Error('Request timeout') as any), timeout);
            return fetch(url, { cache: 'no-store' as RequestCache, signal: controller.signal }).finally(() => clearTimeout(t));
          };
          
          // Prefer a single round-trip for first-load speed
          let syncOk = false;
          let anyFetchOk = false;
          try {
            const syncRes = await fetchWithTimeout(`${apiUrl}/sync/data`);
            if ((syncRes as any)?.ok) {
              const full = await syncRes.json();
              if (full && typeof full === 'object') {
                if (Array.isArray(full.sermons)) { setSermons(full.sermons as Sermon[]); localStorage.setItem('sermons', JSON.stringify(full.sermons)); setTimeout(() => { try { safeBackgroundFetchService.scheduleBackgroundFetch(full.sermons); } catch {} }, 1200); }
                if (Array.isArray(full.announcements)) { setAnnouncements(full.announcements as Announcement[]); localStorage.setItem('announcements', JSON.stringify(full.announcements)); }
                if (Array.isArray(full.events)) { setEvents(full.events as Event[]); localStorage.setItem('events', JSON.stringify(full.events)); }
                if (full.siteContent && typeof full.siteContent === 'object') { setSiteContent(full.siteContent as any); localStorage.setItem('siteContent', JSON.stringify(full.siteContent)); }
                if (Array.isArray(full.prayerRequests)) { setPrayerRequests(full.prayerRequests as PrayerRequest[]); localStorage.setItem('prayerRequests', JSON.stringify(full.prayerRequests)); }
                if (Array.isArray(full.bibleStudies)) { setBibleStudies(full.bibleStudies as BibleStudy[]); localStorage.setItem('bibleStudies', JSON.stringify(full.bibleStudies)); }
                if (Array.isArray(full.chatMessages)) { setChatMessages(full.chatMessages as ChatMessage[]); localStorage.setItem('chatMessages', JSON.stringify(full.chatMessages)); }
                if (Array.isArray(full.posts) && (full.posts.length > 0 || posts.length === 0)) {
                  setPosts(prev => {
                    try {
                      const existing = Array.isArray(prev) ? prev : [];
                      const incoming = full.posts as Post[];
                      const byId = new Map<any, any>();
                      for (const p of existing) { if (p && (p as any).id != null) byId.set((p as any).id, p); }
                      for (const p of incoming) { if (p && (p as any).id != null && !byId.has((p as any).id)) byId.set((p as any).id, p); }
                      const merged = Array.from(byId.values()).sort((a: any, b: any) => (Number(b?.id) || 0) - (Number(a?.id) || 0));
                      safeSetItem('communityPosts', merged);
                      return merged as Post[];
                    } catch {
                      safeSetItem('communityPosts', full.posts);
                      return full.posts as Post[];
                    }
                  });
                }
                if (Array.isArray(full.comments) && (full.comments.length > 0 || comments.length === 0)) { setComments(full.comments as Comment[]); saveToLocalStorage('communityComments', full.comments); }
                if (Array.isArray(full.communityStories)) {
                  try {
                    const localRaw = localStorage.getItem('communityStories');
                    const localParsed = localRaw ? JSON.parse(localRaw) : [];
                    const existing = Array.isArray(localParsed) ? localParsed : [];
                    const incoming = Array.isArray(full.communityStories) ? full.communityStories : [];
                    if (incoming.length > 0 || existing.length === 0) {
                      const byId = new Map<any, any>();
                      for (const s of existing) { if (s && (s as any).id != null) byId.set((s as any).id, s); }
                      for (const s of incoming) { if (s && (s as any).id != null && !byId.has((s as any).id)) byId.set((s as any).id, s); }
                      const merged = Array.from(byId.values()).sort((a: any, b: any) => {
                        const at = Number((a as any)?.createdAt || (a as any)?.id) || 0;
                        const bt = Number((b as any)?.createdAt || (b as any)?.id) || 0;
                        return bt - at;
                      });
                      safeSetItem('communityStories', merged);
                      try { window.dispatchEvent(new Event('communityStories-changed')); } catch {}
                    }
                  } catch {
                    try { if (full.communityStories.length > 0) { safeSetItem('communityStories', full.communityStories); try { window.dispatchEvent(new Event('communityStories-changed')); } catch {} } } catch {}
                  }
                }
                localStorage.setItem('lastSyncTime', Date.now().toString());
                syncOk = true;
                anyFetchOk = true;
              }
            }
          } catch (e) {
            console.warn('[AppContext] Primary sync/data fetch failed:', e);
          }

          // If sync failed and API URL was an override, try falling back to default API (may fix bad local override or QUIC issues)
          if (!syncOk && apiUrl !== fallbackApi) {
            try {
              console.log('[AppContext] Retrying with fallback API URL:', fallbackApi);
              const syncRes2 = await fetchWithTimeout(`${fallbackApi}/sync/data`);
              if ((syncRes2 as any)?.ok) {
                const full = await syncRes2.json();
                if (full && typeof full === 'object') {
                  if (Array.isArray(full.sermons)) { setSermons(full.sermons as Sermon[]); localStorage.setItem('sermons', JSON.stringify(full.sermons)); setTimeout(() => { try { safeBackgroundFetchService.scheduleBackgroundFetch(full.sermons); } catch {} }, 1200); }
                  if (Array.isArray(full.announcements)) { setAnnouncements(full.announcements as Announcement[]); localStorage.setItem('announcements', JSON.stringify(full.announcements)); }
                  if (Array.isArray(full.events)) { setEvents(full.events as Event[]); localStorage.setItem('events', JSON.stringify(full.events)); }
                  if (full.siteContent && typeof full.siteContent === 'object') { setSiteContent(full.siteContent as any); localStorage.setItem('siteContent', JSON.stringify(full.siteContent)); }
                  if (Array.isArray(full.prayerRequests)) { setPrayerRequests(full.prayerRequests as PrayerRequest[]); localStorage.setItem('prayerRequests', JSON.stringify(full.prayerRequests)); }
                  if (Array.isArray(full.bibleStudies)) { setBibleStudies(full.bibleStudies as BibleStudy[]); localStorage.setItem('bibleStudies', JSON.stringify(full.bibleStudies)); }
                  if (Array.isArray(full.chatMessages)) { setChatMessages(full.chatMessages as ChatMessage[]); localStorage.setItem('chatMessages', JSON.stringify(full.chatMessages)); }
                  if (Array.isArray(full.posts) && (full.posts.length > 0 || posts.length === 0)) {
                    setPosts(prev => {
                      try {
                        const existing = Array.isArray(prev) ? prev : [];
                        const incoming = full.posts as Post[];
                        const byId = new Map<any, any>();
                        for (const p of existing) { if (p && (p as any).id != null) byId.set((p as any).id, p); }
                        for (const p of incoming) { if (p && (p as any).id != null && !byId.has((p as any).id)) byId.set((p as any).id, p); }
                        const merged = Array.from(byId.values()).sort((a: any, b: any) => (Number(b?.id) || 0) - (Number(a?.id) || 0));
                        safeSetItem('communityPosts', merged);
                        return merged as Post[];
                      } catch {
                        safeSetItem('communityPosts', full.posts);
                        return full.posts as Post[];
                      }
                    });
                  }
                  if (Array.isArray(full.comments) && (full.comments.length > 0 || comments.length === 0)) { setComments(full.comments as Comment[]); saveToLocalStorage('communityComments', full.comments); }
                  if (Array.isArray(full.communityStories)) {
                    try {
                      const localRaw = localStorage.getItem('communityStories');
                      const localParsed = localRaw ? JSON.parse(localRaw) : [];
                      const existing = Array.isArray(localParsed) ? localParsed : [];
                      const incoming = Array.isArray(full.communityStories) ? full.communityStories : [];
                      if (incoming.length > 0 || existing.length === 0) {
                        const byId = new Map<any, any>();
                        for (const s of existing) { if (s && (s as any).id != null) byId.set((s as any).id, s); }
                        for (const s of incoming) { if (s && (s as any).id != null && !byId.has((s as any).id)) byId.set((s as any).id, s); }
                        const merged = Array.from(byId.values()).sort((a: any, b: any) => {
                          const at = Number((a as any)?.createdAt || (a as any)?.id) || 0;
                          const bt = Number((b as any)?.createdAt || (b as any)?.id) || 0;
                          return bt - at;
                        });
                        safeSetItem('communityStories', merged);
                        try { window.dispatchEvent(new Event('communityStories-changed')); } catch {}
                      }
                    } catch {
                      try { if (full.communityStories.length > 0) { safeSetItem('communityStories', full.communityStories); try { window.dispatchEvent(new Event('communityStories-changed')); } catch {} } } catch {}
                    }
                  }
                  localStorage.setItem('lastSyncTime', Date.now().toString());
                  syncOk = true;
                  anyFetchOk = true;
                  // Persist the working API URL to avoid future failures
                  try { localStorage.setItem('apiBaseUrl', fallbackApi); } catch {}
                  apiUrl = fallbackApi;
                }
              }
            } catch (e) {
              console.warn('[AppContext] Fallback sync/data fetch failed:', e);
            }
          }

          if (!syncOk) {
            console.log('[AppContext] Falling back to multi-endpoint fetch');
            // Minimal fallback: sermons + site content to render app; others can be filled by periodic pull
            const [sermonsRes, siteContentRes] = await Promise.all([
              fetchWithTimeout(`${apiUrl}/sermons`).catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
              fetchWithTimeout(`${apiUrl}/site-content`).catch(() => ({ ok: false, json: () => Promise.resolve({}) })),
            ]);
            const [sermonsData, siteContentData] = await Promise.all([sermonsRes.json(), siteContentRes.json()]);
            if ((sermonsRes as any)?.ok && Array.isArray(sermonsData)) {
              setSermons(sermonsData as Sermon[]);
              localStorage.setItem('sermons', JSON.stringify(sermonsData));
              setTimeout(() => { try { safeBackgroundFetchService.scheduleBackgroundFetch(sermonsData); } catch {} }, 1200);
              anyFetchOk = true;
            }
            if ((siteContentRes as any)?.ok && siteContentData && typeof siteContentData === 'object') {
              setSiteContent(siteContentData as any);
              localStorage.setItem('siteContent', JSON.stringify(siteContentData));
              anyFetchOk = true;
            }
          }
          
          // Pull full snapshot as a consistency check
          try {
            const full = await websocketService.pullFromServer();
            if (full && typeof full === 'object') {
              if (Array.isArray(full.sermons) && (full.sermons.length > 0 || sermons.length === 0)) { setSermons(full.sermons as Sermon[]); localStorage.setItem('sermons', JSON.stringify(full.sermons)); }
              if (Array.isArray(full.announcements) && (full.announcements.length > 0 || announcements.length === 0)) { setAnnouncements(full.announcements as Announcement[]); localStorage.setItem('announcements', JSON.stringify(full.announcements)); }
              if (Array.isArray(full.events) && (full.events.length > 0 || events.length === 0)) { setEvents(full.events as Event[]); localStorage.setItem('events', JSON.stringify(full.events)); }
              if (full.siteContent && typeof full.siteContent === 'object') { setSiteContent(full.siteContent as any); localStorage.setItem('siteContent', JSON.stringify(full.siteContent)); }
              if (Array.isArray(full.prayerRequests) && (full.prayerRequests.length > 0 || prayerRequests.length === 0)) { setPrayerRequests(full.prayerRequests as PrayerRequest[]); localStorage.setItem('prayerRequests', JSON.stringify(full.prayerRequests)); }
              if (Array.isArray(full.bibleStudies) && (full.bibleStudies.length > 0 || bibleStudies.length === 0)) { setBibleStudies(full.bibleStudies as BibleStudy[]); localStorage.setItem('bibleStudies', JSON.stringify(full.bibleStudies)); }
              if (Array.isArray(full.chatMessages) && (full.chatMessages.length > 0 || chatMessages.length === 0)) { setChatMessages(full.chatMessages as ChatMessage[]); localStorage.setItem('chatMessages', JSON.stringify(full.chatMessages)); }
              if (Array.isArray(full.posts) && (full.posts.length > 0 || posts.length === 0)) { setPosts(full.posts as Post[]); safeSetItem('communityPosts', full.posts); }
              if (Array.isArray(full.comments) && (full.comments.length > 0 || comments.length === 0)) { setComments(full.comments as Comment[]); saveToLocalStorage('communityComments', full.comments); }
              if (Array.isArray(full.communityStories)) {
                try {
                  const localRaw = localStorage.getItem('communityStories');
                  const localParsed = localRaw ? JSON.parse(localRaw) : [];
                  const localLen = Array.isArray(localParsed) ? localParsed.length : 0;
                  if (full.communityStories.length > 0 || localLen === 0) {
                    safeSetItem('communityStories', full.communityStories);
                    try { window.dispatchEvent(new Event('communityStories-changed')); } catch {}
                  }
                } catch {
                  try { if (full.communityStories.length > 0) { safeSetItem('communityStories', full.communityStories); try { window.dispatchEvent(new Event('communityStories-changed')); } catch {} } } catch {}
                }
              }
            }
          } catch {}

          // Update last sync timestamp
          if (anyFetchOk) {
            localStorage.setItem('lastSyncTime', Date.now().toString());
            console.log('[AppContext] ✅ Data synced successfully from server');
          } else {
            console.log('[AppContext] ⚠️ No successful fetches, keeping cached data');
          }
          
        } catch (error) {
          console.error('[AppContext] ❌ Error fetching initial data:', error);
          console.log('[AppContext] Falling back to localStorage data');
          // Data is already loaded from localStorage in useState initializers
        }
      };

      try {
        const lastTsRaw = localStorage.getItem('lastSyncTime') || '0';
        const lastTs = parseInt(lastTsRaw, 10);
        const fresh = Number.isFinite(lastTs) && lastTs > 0 && (Date.now() - lastTs) < SYNC_TTL_MS;
        console.log('[Sync] LastSync:', lastTs ? new Date(lastTs).toISOString() : 'none', 'Fresh:', fresh);
        if (fresh) {
          console.log('[AppContext] ⏸️ Recent sync exists; skipping initial network fetch');
        } else {
          fetchInitialData();
        }
      } catch (err) {
        console.error('[Sync] TTL check failed:', err);
        fetchInitialData();
        try { localStorage.setItem('lastSyncTime', Date.now().toString()); } catch {}
      }
    }, []); // Run once on mount

    // Refresh data when app comes to foreground (removed - causing issues with localStorage reload)
    // The 30-second cache timeout is sufficient for keeping data fresh

    // Initialize notifications
    useEffect(() => {
      notificationService.initialize().then(success => {
        if (success) {
          console.log('[AppContext] ✅ Notifications initialized');
        }
      });
    }, []);

    // Initialize WebSocket service and listen for updates
    useEffect(() => {
      // Connect to WebSocket server (non-blocking, with delay)
      setTimeout(() => {
        try {
          console.log('[AppContext] Attempting WebSocket connection...');
          websocketService.connect();
        } catch (error) {
          console.error('[AppContext] WebSocket connection failed:', error);
          // App continues to work without real-time sync
        }
      }, 200); // Wait 2 seconds after app loads before connecting
      
      // Start listening for server updates
      websocketService.addListener('sync_update', (syncData: any) => {
        console.log('[AppContext] Received sync update:', syncData.type, syncData.action);
        
        // Handle individual sync actions for real-time updates
        if (syncData.type && syncData.action && syncData.data) {
          switch (syncData.type) {
            case 'chatMessages':
              if (syncData.action === 'add') {
                setChatMessages(prev => {
                  // Prevent duplicates
                  if (prev.find(msg => String(msg?.id) === String((syncData as any)?.data?.id))) {
                    return prev;
                  }

                  let shouldNotify = true;

                  try {
                    const authUserRaw = localStorage.getItem('authUser');
                    if (authUserRaw) {
                      const authUser = JSON.parse(authUserRaw);
                      if (authUser && authUser.id === syncData.data.userId) {
                        shouldNotify = false;
                      }
                    }
                  } catch (error) {
                    console.error('[AppContext] Failed to determine current user for chat notification:', error);
                  }

                  if (window.location.hash.includes('/chat')) {
                    shouldNotify = false;
                  }

                  // Send notification for new chat message
                  if (shouldNotify) {
                    localNotificationService.showChatNotification(
                      syncData.data.senderName,
                      syncData.data.content || '📷 Sent a photo'
                    );
                  }
                  const updated = [...prev, syncData.data];
                  localStorage.setItem('chatMessages', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'update') {
                setChatMessages(prev => {
                  const updated = prev.map(msg => String(msg?.id) === String((syncData as any)?.data?.id) ? syncData.data : msg);
                  localStorage.setItem('chatMessages', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'delete') {
                setChatMessages(prev => {
                  const updated = prev.filter(msg => String(msg?.id) !== String((syncData as any)?.data?.id));
                  localStorage.setItem('chatMessages', JSON.stringify(updated));
                  return updated;
                });
              }
              break;
            case 'sermons':
              if (syncData.action === 'add') {
                setSermons(prev => {
                  // Prevent duplicates
                  if (prev.find(s => s.id === syncData.data.id)) {
                    return prev;
                  }
                  // Send notification for new sermon
                  notificationService.notifyNewSermon(
                    syncData.data.title,
                    syncData.data.pastor
                  );
                  const updated = [syncData.data, ...prev];
                  localStorage.setItem('sermons', JSON.stringify(updated));
                  return updated;
                });
                prefetchSermonVideos([syncData.data]);
              } else if (syncData.action === 'update') {
                setSermons(prev => {
                  const updated = prev.map(s => s.id === syncData.data.id ? syncData.data : s);
                  localStorage.setItem('sermons', JSON.stringify(updated));
                  return updated;
                });
                prefetchSermonVideos([syncData.data]);
              } else if (syncData.action === 'delete') {
                setSermons(prev => {
                  const updated = prev.filter(s => s.id !== syncData.data.id);
                  localStorage.setItem('sermons', JSON.stringify(updated));
                  return updated;
                });
              }
              break;
            case 'announcements':
              if (syncData.action === 'add') {
                setAnnouncements(prev => {
                  // Prevent duplicates
                  if (prev.find(a => a.id === syncData.data.id)) {
                    return prev;
                  }
                  // Send notification for new announcement
                  notificationService.notifyNewAnnouncement(
                    syncData.data.title,
                    syncData.data.category
                  );
                  const updated = [syncData.data, ...prev];
                  localStorage.setItem('announcements', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'update') {
                setAnnouncements(prev => {
                  const updated = prev.map(a => a.id === syncData.data.id ? syncData.data : a);
                  localStorage.setItem('announcements', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'delete') {
                setAnnouncements(prev => {
                  const updated = prev.filter(a => a.id !== syncData.data.id);
                  localStorage.setItem('announcements', JSON.stringify(updated));
                  return updated;
                });
              }
              break;
            case 'events':
              if (syncData.action === 'add') {
                setEvents(prev => {
                  // Prevent duplicates
                  if (prev.find(e => e.id === syncData.data.id)) {
                    return prev;
                  }
                  // Send notification for new event
                  notificationService.notifyNewEvent(
                    syncData.data.title,
                    syncData.data.date
                  );
                  const updated = [syncData.data, ...prev];
                  localStorage.setItem('events', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'update') {
                setEvents(prev => {
                  const updated = prev.map(e => e.id === syncData.data.id ? syncData.data : e);
                  localStorage.setItem('events', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'delete') {
                setEvents(prev => {
                  const updated = prev.filter(e => e.id !== syncData.data.id);
                  localStorage.setItem('events', JSON.stringify(updated));
                  return updated;
                });
              }
              break;
            case 'prayerRequests':
              if (syncData.action === 'add') {
                setPrayerRequests(prev => {
                  // Prevent duplicates
                  if (prev.find(p => p.id === syncData.data.id)) {
                    return prev;
                  }
                  return [syncData.data, ...prev];
                });
              } else if (syncData.action === 'update') {
                setPrayerRequests(prev => prev.map(p => p.id === syncData.data.id ? syncData.data : p));
              } else if (syncData.action === 'delete') {
                setPrayerRequests(prev => prev.filter(p => p.id !== syncData.data.id));
              }
              break;
            case 'bibleStudies':
              if (syncData.action === 'add') {
                setBibleStudies(prev => {
                  // Prevent duplicates
                  if (prev.find(b => b.id === syncData.data.id)) {
                    return prev;
                  }
                  // Send notification for new Bible study
                  notificationService.notifyNewBibleStudy(
                    syncData.data.title,
                    syncData.data.topic
                  );
                  const updated = [syncData.data, ...prev];
                  localStorage.setItem('bibleStudies', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'update') {
                setBibleStudies(prev => {
                  const updated = prev.map(b => b.id === syncData.data.id ? syncData.data : b);
                  localStorage.setItem('bibleStudies', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'delete') {
                setBibleStudies(prev => {
                  const updated = prev.filter(b => b.id !== syncData.data.id);
                  localStorage.setItem('bibleStudies', JSON.stringify(updated));
                  return updated;
                });
              }
              break;
            case 'siteContent':
              if (syncData.action === 'update') {
                setSiteContent(syncData.data);
              }
              break;
            case 'posts':
              if (syncData.action === 'add') {
                setPosts(prev => {
                  // Prevent duplicates
                  if (prev.find(p => p.id === syncData.data.id)) {
                    return prev;
                  }
                  return [syncData.data, ...prev];
                });
              } else if (syncData.action === 'update') {
                setPosts(prev => prev.map(p => p.id === syncData.data.id ? syncData.data : p));
              } else if (syncData.action === 'delete') {
                setPosts(prev => prev.filter(p => p.id !== syncData.data.id));
              }
              break;
            case 'comments':
              if (syncData.action === 'add') {
                setComments(prev => {
                  // Prevent duplicates
                  if (prev.find(c => c.id === syncData.data.id)) {
                    return prev;
                  }
                  return [syncData.data, ...prev];
                });
              } else if (syncData.action === 'update') {
                setComments(prev => prev.map(c => c.id === syncData.data.id ? syncData.data : c));
              } else if (syncData.action === 'delete') {
                setComments(prev => prev.filter(c => c.id !== syncData.data.id));
              }
              break;
          }
        }
        
        // Handle full data sync (for initial load or reconnection)
        if (syncData.sermons && Array.isArray(syncData.sermons)) {
          setSermons(syncData.sermons);
          prefetchSermonVideos(syncData.sermons as Sermon[]);
        }
        if (syncData.announcements && Array.isArray(syncData.announcements)) {
          setAnnouncements(syncData.announcements);
        }
        if (syncData.events && Array.isArray(syncData.events)) {
          setEvents(syncData.events);
        }
        if (syncData.siteContent && typeof syncData.siteContent === 'object') {
          setSiteContent(syncData.siteContent);
        }
        if (syncData.chatMessages) {
          // Ensure chatMessages is always an array
          const messages = Array.isArray(syncData.chatMessages) 
            ? syncData.chatMessages 
            : (syncData.chatMessages ? [syncData.chatMessages] : []);
          setChatMessages(messages);
        }
        // For now, keep community posts local/demo-only and do not
        // overwrite them with full WebSocket sync payloads.
        if (syncData.posts && Array.isArray(syncData.posts) && syncData.posts.length > 0) {
          // Only apply server posts when there are no existing local posts
          setPosts(prevPosts => {
            if (Array.isArray(prevPosts) && prevPosts.length > 0) {
              return prevPosts;
            }
            return syncData.posts as Post[];
          });
        }
        if (syncData.comments && Array.isArray(syncData.comments)) {
          setComments(syncData.comments);
        }
      });

      return () => {
        websocketService.disconnect();
      };
    }, []);

    useEffect(() => {
      localStorage.setItem('sermons', JSON.stringify(sermons));
    }, [sermons]);

    useEffect(() => {
      localStorage.setItem('announcements', JSON.stringify(announcements));
    }, [announcements]);

    useEffect(() => {
      localStorage.setItem('events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
      // Ensure chatMessages is an array before mapping
      if (Array.isArray(chatMessages)) {
        const isTransientMediaUrl = (u: any): boolean => {
          try {
            return typeof u === 'string' && (u.startsWith('blob:') || u.startsWith('data:'));
          } catch {
            return false;
          }
        };
        const messagesToStore = chatMessages.map(msg => {
          if (msg.media) {
            const u: any = (msg.media as any)?.url;
            // Never persist transient local preview URLs
            if (isTransientMediaUrl(u)) {
              return { ...msg, media: { ...msg.media, url: '' } };
            }
            return msg;
          }
          return msg;
        });
        localStorage.setItem('chatMessages', JSON.stringify(messagesToStore));
      } else {
        console.error('[AppContext] chatMessages is not an array:', chatMessages);
        localStorage.setItem('chatMessages', JSON.stringify([]));
      }
    }, [chatMessages]);

    useEffect(() => {
      localStorage.setItem('siteContent', JSON.stringify(siteContent));
    }, [siteContent]);

    useEffect(() => {
      localStorage.setItem('prayerRequests', JSON.stringify(prayerRequests));
    }, [prayerRequests]);

    useEffect(() => {
      safeSetItem('communityPosts', posts);
    }, [posts]);

    useEffect(() => {
      localStorage.setItem('communityComments', JSON.stringify(comments));
    }, [comments]);

    const createPost = (content: string, user: User, media?: { url: string; type: 'image' | 'video' }): Post | undefined => {
      if (!user) return;

      const basePost: Post = {
        id: Date.now(),
        authorId: user.id,
        author: user.name,
        avatar: user.name.trim().charAt(0).toUpperCase(),
        time: new Date().toISOString(),
        content,
        likes: 0,
        comments: [],
        shares: 0,
        liked: false,
      };

      const newPost: Post = media ? { ...basePost, media } : basePost;

      setPosts(prev => {
        const updated = [newPost, ...prev];
        safeSetItem('communityPosts', updated);
        return updated;
      });

      websocketService.pushUpdate({
        type: 'posts',
        action: 'add',
        data: newPost,
      });

      return newPost;
    };

    const canModifyPost = (p: Post): boolean => {
      try {
        if (!user) return false;
        if ((user as any)?.role === 'admin') return true;
        if ((p as any)?.authorId && user.id) return (p as any).authorId === user.id;
        return p.author === user.name;
      } catch { return false; }
    };

    const updatePost = (post: Post) => {
      let permitted = false;
      setPosts(prev => {
        const existing = prev.find(p => p.id === post.id);
        if (existing && canModifyPost(existing)) {
          permitted = true;
          const updated = prev.map(p => (p.id === post.id ? post : p));
          safeSetItem('communityPosts', updated);
          return updated;
        }
        console.warn('[AppContext] Blocked updatePost: not author/admin');
        return prev;
      });
      if (permitted) {
        websocketService.pushUpdate({ type: 'posts', action: 'update', data: post });
      }
    };

    const handlePostInteraction = (postId: number, type: 'like' | 'share') => {
      let updatedPost: Post | null = null;

      setPosts(prev =>
        prev.map(post => {
          if (post.id === postId) {
            if (type === 'like') {
              const liked = !post.liked;
              const likes = liked ? post.likes + 1 : Math.max(0, post.likes - 1);
              updatedPost = { ...post, liked, likes };
              return updatedPost;
            }
            if (type === 'share') {
              updatedPost = { ...post, shares: post.shares + 1 };
              return updatedPost;
            }
          }
          return post;
        }),
      );

      if (updatedPost) {
        websocketService.pushUpdate({
          type: 'posts',
          action: 'update',
          data: updatedPost,
        });
      }
    };

    const deletePost = (postId: number) => {
      let permitted = false;
      setPosts(prev => {
        const target = prev.find(p => p.id === postId);
        if (target && canModifyPost(target)) {
          permitted = true;
          const updated = prev.filter(post => post.id !== postId);
          safeSetItem('communityPosts', updated);
          return updated;
        }
        console.warn('[AppContext] Blocked deletePost: not author/admin');
        return prev;
      });

      if (permitted) {
        websocketService.pushUpdate({
          type: 'posts',
          action: 'delete',
          data: { id: postId },
        });
      }
    };

    const addPostComment = (postId: number, commentText: string, user: User) => {
      const newComment: Comment = {
        id: Date.now(),
        authorId: user.id,
        author: user.name,
        text: commentText,
        time: new Date().toISOString(),
      };

      let updatedPost: Post | null = null;

      setPosts(prev =>
        prev.map(post => {
          if (post.id === postId) {
            updatedPost = {
              ...post,
              comments: [...post.comments, newComment],
            };
            return updatedPost;
          }
          return post;
        }),
      );

      if (updatedPost) {
        websocketService.pushUpdate({
          type: 'posts',
          action: 'update',
          data: updatedPost,
        });
      }
    };

    const updateSermon = (updatedSermon: Sermon) => {
        setSermons(sermons.map(s => s.id === updatedSermon.id ? updatedSermon : s));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'sermons',
            action: 'update',
            data: updatedSermon
        });
    };
    const addSermon = (newSermonData: Omit<Sermon, 'id' | 'likes' | 'comments' | 'isLiked' | 'isSaved'| 'date'>) => {
        const newSermon: Sermon = {
            ...newSermonData,
            id: new Date().getTime().toString(),
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            comments: [],
            isLiked: false,
            isSaved: false,
        };
        setSermons([newSermon, ...sermons]);
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'sermons',
            action: 'add',
            data: newSermon
        });
    };
    const deleteSermon = (id: string) => {
        setSermons(sermons.filter(s => s.id !== id));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'sermons',
            action: 'delete',
            data: { id }
        });
    };
    
    const handleSermonInteraction = (sermonId: string, type: 'like' | 'save') => {
        let updatedSermon: Sermon | null = null;
        
        setSermons(currentSermons =>
          currentSermons.map(s => {
            if (s.id === sermonId) {
              if (type === 'like') {
                const isLiked = !s.isLiked;
                const currentLikes = typeof s.likes === 'number' ? s.likes : 0;
                const likes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                updatedSermon = { ...s, isLiked, likes };
                return updatedSermon;
              }
              if (type === 'save') {
                updatedSermon = { ...s, isSaved: !s.isSaved };
                return updatedSermon;
              }
            }
            return s;
          })
        );
        
        // Push to server for syncing
        if (updatedSermon) {
            websocketService.pushUpdate({
                type: 'sermons',
                action: 'update',
                data: updatedSermon
            });
        }
      };
    
    const addSermonComment = (sermonId: string, commentContent: string, user: User) => {
        const newComment: SermonComment = {
            id: `c${new Date().getTime()}`,
            user: {
                id: user.id,
                name: user.name,
                profilePictureUrl: user.profilePictureUrl,
            },
            content: commentContent,
            timestamp: new Date().toISOString(),
        };

        let updatedSermon: Sermon | null = null;
        setSermons(sermons.map(s => {
            if (s.id === sermonId) {
                updatedSermon = { ...s, comments: [...s.comments, newComment] };
                return updatedSermon;
            }
            return s;
        }));
        
        // Push to server for syncing
        if (updatedSermon) {
            websocketService.pushUpdate({
                type: 'sermons',
                action: 'update',
                data: updatedSermon
            });
        }
    };

    const updateAnnouncement = (updated: Announcement) => {
        setAnnouncements(announcements.map(a => a.id === updated.id ? updated : a));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'announcements',
            action: 'update',
            data: updated
        });
    };
    const addAnnouncement = (newData: Omit<Announcement, 'id' | 'date'>) => {
        const newAnnouncement: Announcement = {
            ...newData,
            id: Math.max(0, ...announcements.map(a => a.id)) + 1,
            date: new Date().toISOString().split('T')[0],
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'announcements',
            action: 'add',
            data: newAnnouncement
        });
    };
    const deleteAnnouncement = (id: number) => {
        setAnnouncements(announcements.filter(a => a.id !== id));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'announcements',
            action: 'delete',
            data: { id }
        });
    };

    const updateEvent = (updated: Event) => {
        setEvents(events.map(e => e.id === updated.id ? updated : e));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'events',
            action: 'update',
            data: updated
        });
    };
    const addEvent = (newData: Omit<Event, 'id'>) => {
        const newEvent: Event = { ...newData, id: new Date().getTime().toString() };
        setEvents([newEvent, ...events]);
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'events',
            action: 'add',
            data: newEvent
        });
    };
    const deleteEvent = (id: string) => {
        setEvents(events.filter(e => e.id !== id));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'events',
            action: 'delete',
            data: { id }
        });
    };

    const updateSiteContent = (newContent: SiteContent) => {
        setSiteContent(newContent);
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'siteContent',
            action: 'update',
            data: newContent
        });
    };

    const addPrayerRequest = (requestData: Omit<PrayerRequest, 'id' | 'date' | 'isPrayedFor'>) => {
        const newRequest: PrayerRequest = {
            ...requestData,
            id: new Date().getTime().toString(),
            date: new Date().toISOString(),
            isPrayedFor: false,
        };
        setPrayerRequests(prev => [newRequest, ...prev]);
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'prayerRequests',
            action: 'add',
            data: newRequest
        });
    };
    const deletePrayerRequest = (id: string) => {
        setPrayerRequests(prev => prev.filter(r => r.id !== id));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'prayerRequests',
            action: 'delete',
            data: { id }
        });
    };
    const togglePrayerRequestPrayedFor = (id: string) => {
        let updatedRequest: PrayerRequest | null = null;
        
        setPrayerRequests(prev => 
            prev.map(r => {
                if (r.id === id) {
                    updatedRequest = { ...r, isPrayedFor: !r.isPrayedFor };
                    return updatedRequest;
                }
                return r;
            })
        );
        
        // Push to server for syncing
        if (updatedRequest) {
            websocketService.pushUpdate({
                type: 'prayerRequests',
                action: 'update',
                data: updatedRequest
            });
        }
    };

    // Bible Study CRUD functions
    const addBibleStudy = (study: Omit<BibleStudy, 'id' | 'date'>) => {
        const newStudy: BibleStudy = {
            ...study,
            id: new Date().getTime().toString(),
            date: new Date().toISOString()
        };
        setBibleStudies(prev => {
            const updated = [newStudy, ...prev];
            localStorage.setItem('bibleStudies', JSON.stringify(updated));
            return updated;
        });
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'bibleStudies',
            action: 'add',
            data: newStudy
        });
    };

    const updateBibleStudy = (study: BibleStudy) => {
        setBibleStudies(prev => {
            const updated = prev.map(s => s.id === study.id ? study : s);
            localStorage.setItem('bibleStudies', JSON.stringify(updated));
            return updated;
        });
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'bibleStudies',
            action: 'update',
            data: study
        });
    };

    const deleteBibleStudy = (id: string) => {
        setBibleStudies(prev => {
            const updated = prev.filter(s => s.id !== id);
            localStorage.setItem('bibleStudies', JSON.stringify(updated));
            return updated;
        });
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'bibleStudies',
            action: 'delete',
            data: { id }
        });
    };

    const addChatMessage = (messageData: { content?: string; media?: { url: string; type: 'image' | 'video' | 'audio'; }; replyTo?: ChatMessage; }, user: User) => {
        if (!messageData.content && !messageData.media) return;
        const clientId = new Date().getTime().toString();
        const newMessage: ChatMessage = {
            id: clientId,
            userId: user.id,
            senderName: user.name,
            content: messageData.content,
            media: messageData.media,
            timestamp: new Date().toISOString(),
            replyTo: messageData.replyTo,
            status: 'sending',
        };
        // Optimistic update
        setChatMessages(prev => [...prev, newMessage]);
        try {
          const token = localStorage.getItem('authToken');
          const sock = websocketService.getSocket();
          if (token && sock && (sock as any).connected) {
            sock.emit('chat:send', { token, content: newMessage.content, media: newMessage.media, replyTo: newMessage.replyTo, clientId });
            // Fallback: if no ack in 2s, push via REST; mark failed after 8s
            try {
              const restTimer = window.setTimeout(() => {
                try {
                  try { pendingChatRestTimersRef.current.delete(String(clientId)); } catch {}
                  websocketService.pushUpdate({ type: 'chatMessages', action: 'add', data: newMessage })
                    .then(() => {
                      const t = pendingChatTimersRef.current.get(String(clientId));
                      if (typeof t === 'number') { try { window.clearTimeout(t); } catch {} pendingChatTimersRef.current.delete(String(clientId)); }
                      setChatMessages(prev => (prev || []).map(m => String(m.id) === String(clientId) ? { ...m, status: 'sent' } : m));
                    })
                    .catch(() => {});
                } catch {}
              }, 4000);
              const failTimer = window.setTimeout(() => {
                try { pendingChatTimersRef.current.delete(String(clientId)); } catch {}
                setChatMessages(prev => (prev || []).map(m => {
                  if (String(m.id) !== String(clientId)) return m;
                  if (m.status && m.status !== 'sending') return m;
                  return { ...m, status: 'failed' };
                }));
              }, 30000);
              pendingChatRestTimersRef.current.set(clientId, restTimer);
              pendingChatTimersRef.current.set(clientId, failTimer);
              // clear restTimer on ack via socket handler does not know restTimer; acceptable to let it fire safely (idempotent)
            } catch {}
            return;
          }
        } catch {}
        // Fallback to sync push if socket not ready
        try {
          const failTimer = window.setTimeout(() => {
            try { pendingChatTimersRef.current.delete(String(clientId)); } catch {}
            setChatMessages(prev => (prev || []).map(m => {
              if (String(m.id) !== String(clientId)) return m;
              if (m.status && m.status !== 'sending') return m;
              return { ...m, status: 'failed' };
            }));
          }, 30000);
          pendingChatTimersRef.current.set(clientId, failTimer);
        } catch {}
        try {
          websocketService.pushUpdate({ type: 'chatMessages', action: 'add', data: newMessage })
            .then(() => {
              const t = pendingChatTimersRef.current.get(String(clientId));
              if (typeof t === 'number') { try { window.clearTimeout(t); } catch {} pendingChatTimersRef.current.delete(String(clientId)); }
              setChatMessages(prev => (prev || []).map(m => String(m.id) === String(clientId) ? { ...m, status: 'sent' } : m));
            })
            .catch(() => {});
        } catch {}
    };

    const deleteChatMessage = (messageId: string) => {
        setChatMessages(prev => prev.filter(message => message.id !== messageId));
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'chatMessages',
            action: 'delete',
            data: { id: messageId }
        });
    };

    const value = {
        sermons,
        announcements,
        events,
        siteContent,
        prayerRequests,
        bibleStudies,
        chatMessages,
        posts,
        comments,
        updateSermon,
        addSermon,
        deleteSermon,
        updateAnnouncement,
        addAnnouncement,
        deleteAnnouncement,
        updateEvent,
        addEvent,
        deleteEvent,
        updateSiteContent,
        handleSermonInteraction,
        addSermonComment,
        addPrayerRequest,
        deletePrayerRequest,
        togglePrayerRequestPrayedFor,
        addBibleStudy,
        updateBibleStudy,
        deleteBibleStudy,
        addChatMessage,
        deleteChatMessage,
        createPost,
        updatePost,
        handlePostInteraction,
        addPostComment,
        deletePost,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};