import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sermon, Announcement, Event, SiteContent, PrayerRequest, BibleStudy, ChatMessage, User, SermonComment, Post, Comment } from '../types';
import { websocketService } from '../services/websocketService';
import { notificationService } from '../services/notificationService';
import { localNotificationService } from '../services/localNotificationService';
import { initialSiteContent } from '../constants/siteContent';
import { useAuth } from '../hooks/useAuth';
import { videoStorageService } from '../services/videoStorageService';

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
    createPost: (content: string, user: User, media?: { url: string; type: 'image' | 'video' }) => void;
    handlePostInteraction: (postId: number, type: 'like' | 'share') => void;
    addPostComment: (postId: number, commentText: string, user: User) => void;
    deletePost: (postId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// App version for cache busting
const APP_VERSION = '2.0.0'; // Increment this to clear all localStorage

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

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
        if (communityPosts) localStorage.setItem('communityPosts', communityPosts);
        if (communityStories) localStorage.setItem('communityStories', communityStories);
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
        return storedPosts ? JSON.parse(storedPosts) : [];
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
        if (!Array.isArray(prev) || prev.length === 0) {
          return prev;
        }

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

        if (filtered.length !== prev.length) {
          localStorage.setItem('communityPosts', JSON.stringify(filtered));
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
          localStorage.setItem('communityPosts', JSON.stringify(normalized));
        }
      } catch {}
    }, [posts]);

    // Helper function to save data and update sync timestamp
    const saveToLocalStorage = (key: string, data: any) => {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem('lastSyncTime', Date.now().toString());
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

    // Background prefetch: automatically download sermon videos into IndexedDB
    const prefetchSermonVideos = async (sermonsToPrefetch: Sermon[]) => {
      try {
        if (typeof window === 'undefined' || !navigator.onLine) {
          return;
        }

        for (const sermon of sermonsToPrefetch) {
          if (!sermon || !sermon.videoUrl) continue;
          if (typeof sermon.videoUrl !== 'string') continue;

          // Only prefetch http(s) videos; legacy indexed-db:// videos are already local
          if (!sermon.videoUrl.startsWith('http://') && !sermon.videoUrl.startsWith('https://')) {
            continue;
          }

          const sermonId = String(sermon.id || '');
          if (!sermonId) continue;

          try {
            const alreadyHas = await videoStorageService.hasVideo(sermonId);
            if (alreadyHas) continue;

            console.log('[AppContext] 🎥 Prefetching video for sermon', sermonId);
            const response = await fetch(sermon.videoUrl);
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
          } catch (error) {
            console.error('[AppContext] Error prefetching video for sermon', sermon.id, error);
          }
        }
      } catch (err) {
        console.error('[AppContext] Error in prefetchSermonVideos:', err);
      }
    };

    // Fetch initial data from server on app load
    useEffect(() => {
      const fetchInitialData = async () => {
        try {
          console.log('[AppContext] 🔄 Fetching fresh data from server...');
          const apiUrl = ((import.meta as any).env.VITE_API_URL || 'https://church-app-server.onrender.com/api') as string;
          
          // Check last sync time to avoid excessive fetching
          const lastSync = localStorage.getItem('lastSyncTime');
          const now = Date.now();
          const thirtySeconds = 30 * 1000; // Reduced from 5 minutes to 30 seconds
          
          // Always fetch if last sync was more than 30 seconds ago or doesn't exist
          const shouldFetch = !lastSync || (now - parseInt(lastSync)) > thirtySeconds;
          
          if (!shouldFetch) {
            console.log('[AppContext] ✅ Using recent cached data (synced less than 30 seconds ago)');
            return;
          }
          
          console.log('[AppContext] 📡 Fetching from server (last sync was more than 30 seconds ago)...');
          
          // Add 10-second timeout to prevent app from hanging
          const fetchWithTimeout = (url: string, timeout = 10000) => {
            return Promise.race([
              fetch(url),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
              )
            ]);
          };
          
          const [sermonsRes, announcementsRes, eventsRes, siteContentRes, prayerRequestsRes, bibleStudiesRes, chatMessagesRes, postsRes, commentsRes, storiesRes] = await Promise.all([
            fetchWithTimeout(`${apiUrl}/sermons`).catch(err => {
              console.error('[AppContext] Error fetching sermons:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/announcements`).catch(err => {
              console.error('[AppContext] Error fetching announcements:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/events`).catch(err => {
              console.error('[AppContext] Error fetching events:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/site-content`).catch(err => {
              console.error('[AppContext] Error fetching site content:', err);
              return { ok: false, json: () => Promise.resolve({}) };
            }),
            fetchWithTimeout(`${apiUrl}/prayer-requests`).catch(err => {
              console.error('[AppContext] Error fetching prayer requests:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/bible-studies`).catch(err => {
              console.error('[AppContext] Error fetching bible studies:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/chat-messages`).catch(err => {
              console.error('[AppContext] Error fetching chat messages:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/community-posts`).catch(err => {
              console.error('[AppContext] Error fetching community posts:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/community-comments`).catch(err => {
              console.error('[AppContext] Error fetching community comments:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
            fetchWithTimeout(`${apiUrl}/community-stories`).catch(err => {
              console.error('[AppContext] Error fetching community stories:', err);
              return { ok: false, json: () => Promise.resolve([]) };
            }),
          ]);

          const [sermonsData, announcementsData, eventsData, siteContentData, prayerRequestsData, bibleStudiesData, chatMessagesData, postsData, commentsData, storiesData] = await Promise.all([
            sermonsRes.json(),
            announcementsRes.json(),
            eventsRes.json(),
            siteContentRes.json(),
            prayerRequestsRes.json(),
            bibleStudiesRes.json(),
            chatMessagesRes.json(),
            postsRes.json(),
            commentsRes.json(),
            storiesRes.json(),
          ]);

          console.log('[AppContext] ✅ Fetched initial data:', {
            sermons: sermonsData.length,
            announcements: announcementsData.length,
            events: eventsData.length,
            prayerRequests: prayerRequestsData.length,
            chatMessages: chatMessagesData.length,
            posts: postsData.length,
            comments: commentsData.length,
            stories: Array.isArray(storiesData) ? storiesData.length : 0,
          });

          // Only update if we got valid data (not empty from failed fetch)
          // This prevents clearing localStorage when offline
          if ((sermonsRes as any)?.ok && Array.isArray(sermonsData)) {
            setSermons(sermonsData as Sermon[]);
            localStorage.setItem('sermons', JSON.stringify(sermonsData));
            prefetchSermonVideos(sermonsData);
          }
          
          if ((announcementsRes as any)?.ok && Array.isArray(announcementsData)) {
            setAnnouncements(announcementsData as Announcement[]);
            localStorage.setItem('announcements', JSON.stringify(announcementsData));
          }
          
          if ((eventsRes as any)?.ok && Array.isArray(eventsData)) {
            setEvents(eventsData as Event[]);
            localStorage.setItem('events', JSON.stringify(eventsData));
          }
          
          if ((siteContentRes as any)?.ok && siteContentData && typeof siteContentData === 'object') {
            setSiteContent(siteContentData as any);
            localStorage.setItem('siteContent', JSON.stringify(siteContentData));
          }
          
          if ((prayerRequestsRes as any)?.ok && Array.isArray(prayerRequestsData)) {
            setPrayerRequests(prayerRequestsData as PrayerRequest[]);
            localStorage.setItem('prayerRequests', JSON.stringify(prayerRequestsData));
          }
          
          if ((bibleStudiesRes as any)?.ok && Array.isArray(bibleStudiesData)) {
            setBibleStudies(bibleStudiesData as BibleStudy[]);
            localStorage.setItem('bibleStudies', JSON.stringify(bibleStudiesData));
          }
          
          if ((chatMessagesRes as any)?.ok && Array.isArray(chatMessagesData)) {
            setChatMessages(chatMessagesData as ChatMessage[]);
            localStorage.setItem('chatMessages', JSON.stringify(chatMessagesData));
          }
          
          if ((postsRes as any)?.ok && Array.isArray(postsData)) {
            const isIso = (s: any) => typeof s === 'string' && s.includes('T') && !isNaN(Date.parse(s));
            const normalizePosts = (arr: any[]) => (arr || []).map((p: any) => {
              const np: any = { ...p };
              if (!isIso(np.time)) {
                const fallback = typeof np.id === 'number' ? new Date(np.id).toISOString() : new Date().toISOString();
                np.time = fallback;
              }
              if (Array.isArray(np.comments)) {
                np.comments = np.comments.map((c: any) => {
                  if (!isIso(c.time)) {
                    const cfallback = typeof c.id === 'number' ? new Date(c.id).toISOString() : new Date().toISOString();
                    return { ...c, time: cfallback };
                  }
                  return c;
                });
              }
              return np;
            });
            const postsNormalized = normalizePosts(postsData as any[]);
            setPosts(postsNormalized as Post[]);
            localStorage.setItem('communityPosts', JSON.stringify(postsNormalized));
          }
          
          if ((commentsRes as any)?.ok && Array.isArray(commentsData)) {
            setComments(commentsData as Comment[]);
            localStorage.setItem('communityComments', JSON.stringify(commentsData));
          }
          
          // Update last sync timestamp only if we successfully fetched
          if (sermonsRes.ok || announcementsRes.ok || eventsRes.ok) {
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

      fetchInitialData();
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
      }, 2000); // Wait 2 seconds after app loads before connecting
      
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
                  if (prev.find(msg => msg.id === syncData.data.id)) {
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
                  const updated = prev.map(msg => msg.id === syncData.data.id ? syncData.data : msg);
                  localStorage.setItem('chatMessages', JSON.stringify(updated));
                  return updated;
                });
              } else if (syncData.action === 'delete') {
                setChatMessages(prev => {
                  const updated = prev.filter(msg => msg.id !== syncData.data.id);
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
        const messagesToStore = chatMessages.map(msg => {
          if (msg.media) {
            // Don't store the media URL in localStorage
            return { ...msg, media: { ...msg.media, url: '' } };
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
      localStorage.setItem('communityPosts', JSON.stringify(posts));
    }, [posts]);

    useEffect(() => {
      localStorage.setItem('communityComments', JSON.stringify(comments));
    }, [comments]);

    const createPost = (content: string, user: User, media?: { url: string; type: 'image' | 'video' }) => {
      if (!user) return;

      const basePost: Post = {
        id: Date.now(),
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
        localStorage.setItem('communityPosts', JSON.stringify(updated));
        return updated;
      });

      websocketService.pushUpdate({
        type: 'posts',
        action: 'add',
        data: newPost,
      });
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
      setPosts(prev => {
        const updated = prev.filter(post => post.id !== postId);
        localStorage.setItem('communityPosts', JSON.stringify(updated));
        return updated;
      });

      websocketService.pushUpdate({
        type: 'posts',
        action: 'delete',
        data: { id: postId },
      });
    };

    const addPostComment = (postId: number, commentText: string, user: User) => {
      const newComment: Comment = {
        id: Date.now(),
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

        const newMessage: ChatMessage = {
            id: new Date().getTime().toString(),
            userId: user.id,
            senderName: user.name,
            content: messageData.content,
            media: messageData.media,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            replyTo: messageData.replyTo,
        };
        setChatMessages(prev => [...prev, newMessage]);
        
        // Push to server for syncing
        websocketService.pushUpdate({
            type: 'chatMessages',
            action: 'add',
            data: newMessage
        });
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