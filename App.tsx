import React, { useState, lazy, Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import UpdateNotification from './components/UpdateNotification';
import { SermonsIcon, ArrowRightIcon } from './constants/icons';
import HomePage from './pages/HomePage';
import SermonsPage from './pages/SermonsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import EventsPage from './pages/EventsPage';
import GivingPage from './pages/GivingPage';
import ContactPage from './pages/ContactPage';
import MembersPage from './pages/MembersPage';
import AdminPage from './pages/AdminPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoLivePage from './pages/GoLivePage';
import ProfilePage from './pages/ProfilePage';
import PastorAiPage from './pages/PastorAiPage';
import JsonConverterPage from './pages/JsonConverterPage';
import VideoCallPage from './pages/VideoCallPage';
import CameraClientPage from './pages/CameraClientPage';
import ProStreamApp from './pages/ProStreamApp';
import CommunityFeedPage from './pages/CommunityFeedPage';
import CreatePostPage from './pages/CreatePostPage';
import { useAuth } from './hooks/useAuth';
import { LoadingScreen } from './components/LoadingScreen';
import { localNotificationService } from './services/localNotificationService';
import { websocketService } from './services/websocketService';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { keepAwakeService } from './services/keepAwakeService';
import { backgroundDownloadService } from './services/backgroundDownloadService';

// Lazy load the Bible page because of its large data dependency
const BiblePage = lazy(() => import('./pages/BiblePage'));
const BibleStudyPage = lazy(() => import('./pages/BibleStudyPage'));

const LoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10rem)] bg-accent dark:bg-gray-900">
        <p className="text-white text-lg animate-pulse">Loading Page...</p>
    </div>
);


const HeaderLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const hideHeaderOn = [
        '/sermons',
        '/chat',
        '/chat-room',
        '/bible',
        '/pastor-ai',
        '/video-call',
        '/golive',
        '/prostream',
        '/create-post',
        '/login',
        '/register',
        '/verify-email',
        '/forgot-password',
    ];
    const hashPath = (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string' && window.location.hash.startsWith('#/'))
        ? window.location.hash.slice(1)
        : (location.pathname || '/');
    const pathOnly = (hashPath || '/').split('?')[0];
    const path = pathOnly.toLowerCase().replace(/\/$/, '');
    const showHeader = path === '' || !hideHeaderOn.some((r) => {
        const base = r.toLowerCase().replace(/\/$/, '');
        return path === base || path.startsWith(base + '/');
    });
    return (
        <>
            {showHeader && <Header />}
            <div style={{ paddingTop: showHeader ? 'calc(env(safe-area-inset-top) + 3.5rem)' : 0 }}>
                {children}
            </div>
        </>
    );
};

const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const hashPath = (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string' && window.location.hash.startsWith('#/'))
        ? window.location.hash.slice(1)
        : (location.pathname || '/');
    const showFooter = hashPath === '/';
    
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

const ProtectedRoutes: React.FC = () => {
    const location = useLocation();
    const [visitedPaths, setVisitedPaths] = useState<string[]>([]);

    const hideHeaderOn = [
        '/sermons',
        '/chat',
        '/chat-room',
        '/bible',
        '/pastor-ai',
        '/video-call',
        '/golive',
        '/prostream',
        '/create-post',
    ];
    const hashPath2 = (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string' && window.location.hash.startsWith('#/'))
        ? window.location.hash.slice(1)
        : (location.pathname || '/');
    const pathOnly2 = (hashPath2 || '/').split('?')[0];
    const path = pathOnly2.toLowerCase().replace(/\/$/, '');
    const showHeader = !hideHeaderOn.some((r) => {
        const base = r.toLowerCase().replace(/\/$/, '');
        return path === base || path.startsWith(base + '/');
    });
    try {
        console.log('[HeaderVisibility]', {
            locationPathname: location.pathname,
            computedPath: path,
            hideHeaderOn,
            showHeader,
            hash: typeof window !== 'undefined' ? window.location.hash : undefined,
            href: typeof window !== 'undefined' ? window.location.href : undefined,
        });
    } catch {}

    // Ensure screen sleep unless on allowed pages
    useEffect(() => {
        const keepAwakePaths = ['/sermons', '/video-call'];
        const onAllowedPage = keepAwakePaths.includes(location.pathname);
        if (!onAllowedPage) {
            keepAwakeService.releaseAll().catch(() => {});
        }
        const visHandler = () => {
            if (document.visibilityState !== 'visible') {
                keepAwakeService.releaseAll().catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', visHandler);
        return () => document.removeEventListener('visibilitychange', visHandler);
    }, [location.pathname]);

    // Failsafe: every 15s drop wake lock if no active video is playing or on disallowed page
    useEffect(() => {
        const keepAwakePaths = ['/sermons', '/video-call'];
        const interval = setInterval(() => {
            const onAllowedPage = keepAwakePaths.includes(location.pathname);
            if (!onAllowedPage) {
                keepAwakeService.releaseAll().catch(() => {});
                return;
            }
            const anyPlaying = Array.from(document.querySelectorAll('video'))
                .some((v) => !(v as HTMLVideoElement).paused && !(v as HTMLVideoElement).ended);
            if (!anyPlaying) {
                keepAwakeService.releaseAll().catch(() => {});
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    // Track visited paths to enable keep-alive only after first visit
    useEffect(() => {
        const p = (location.pathname || '/').toLowerCase().replace(/\/$/, '');
        setVisitedPaths(prev => (prev.includes(p) ? prev : [...prev, p]));
    }, [location.pathname]);

    useEffect(() => {
        let cancelled = false;
        const getApiBase = (): string => {
            try {
                const w: any = (typeof window !== 'undefined') ? window : {};
                const fromWindow = w.__APP_RUNTIME_CONFIG__?.apiUrl;
                const fromStorage = (typeof localStorage !== 'undefined') ? localStorage.getItem('apiBaseUrl') : null;
                const fromEnv = (import.meta as any).env?.VITE_API_URL;
                const fallback = 'https://church-app-server.onrender.com/api';
                const apiUrl = (fromStorage || fromWindow || fromEnv || fallback) as string;
                return String(apiUrl || fallback).replace(/\/api\/?$/, '');
            } catch {
                return 'https://church-app-server.onrender.com';
            }
        };
        const ping = async () => {
            try {
                if (cancelled) return;
                if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
                const base = getApiBase();
                await fetch(`${base}/api/health`, { method: 'GET', cache: 'no-store' });
            } catch {}
        };
        const onVis = () => { if (document.visibilityState === 'visible') { ping().catch(() => {}); } };
        try { document.addEventListener('visibilitychange', onVis); } catch {}
        ping().catch(() => {});
        const id = window.setInterval(() => { ping().catch(() => {}); }, 240000);
        return () => {
            cancelled = true;
            try { document.removeEventListener('visibilitychange', onVis); } catch {}
            try { window.clearInterval(id); } catch {}
        };
    }, []);

    return (
        <>
            <PageLayout>
                {/* Keep-alive pages: always mounted, simply shown/hidden by CSS */}
                {(path === '/sermons' || visitedPaths.includes('/sermons')) && (
                    <div style={{ display: path === '/sermons' ? 'block' : 'none' }}>
                        <SermonsPage />
                    </div>
                )}
                {(path === '/chat' || visitedPaths.includes('/chat')) && (
                    <div style={{ display: path === '/chat' ? 'block' : 'none' }}>
                        <CommunityFeedPage />
                    </div>
                )}
                {(path === '/bible' || visitedPaths.includes('/bible')) && (
                    <div style={{ display: path === '/bible' ? 'block' : 'none' }}>
                        <Suspense fallback={<LoadingFallback />}>
                            <BiblePage />
                        </Suspense>
                    </div>
                )}
                {(path === '/bible-study' || visitedPaths.includes('/bible-study')) && (
                    <div style={{ display: path === '/bible-study' ? 'block' : 'none' }}>
                        <Suspense fallback={<LoadingFallback />}>
                            <BibleStudyPage />
                        </Suspense>
                    </div>
                )}
                {/* Pro Stream (no keep-alive) */}
                <div style={{ display: path === '' ? 'block' : 'none' }}>
                    <HomePage />
                </div>
                <div style={{ display: path === '/announcements' ? 'block' : 'none' }}>
                    <AnnouncementsPage />
                </div>
                <div style={{ display: path === '/events' ? 'block' : 'none' }}>
                    <EventsPage />
                </div>
                <div style={{ display: path === '/giving' ? 'block' : 'none' }}>
                    <GivingPage />
                </div>
                <div style={{ display: path === '/members' ? 'block' : 'none' }}>
                    <MembersPage />
                </div>
                {/* Go Live (no keep-alive) */}
                <div style={{ display: path === '/chat-room' ? 'block' : 'none' }}>
                    <ChatPage />
                </div>
                <div style={{ display: path === '/create-post' ? 'block' : 'none' }}>
                    <CreatePostPage />
                </div>
                <div style={{ display: path === '/contact' ? 'block' : 'none' }}>
                    <ContactPage />
                </div>
                <div style={{ display: path === '/profile' ? 'block' : 'none' }}>
                    <ProfilePage />
                </div>
                <div style={{ display: path === '/pastor-ai' ? 'block' : 'none' }}>
                    <PastorAiPage />
                </div>
                {/* Video Call (no keep-alive) */}
                {/* Camera Client (no keep-alive) */}
                <Routes>
                    <Route path="/" element={<></>} />
                    <Route path="/sermons" element={<></>} />
                    <Route path="/announcements" element={<></>} />
                    <Route path="/events" element={<></>} />
                    <Route path="/bible" element={<></>} />
                    <Route path="/bible-study" element={<></>} />
                    <Route path="/giving" element={<></>} />
                    <Route path="/members" element={<></>} />
                    <Route path="/golive" element={<GoLivePage />} />
                    <Route path="/prostream" element={<ProStreamApp />} />
                    <Route path="/chat" element={<></>} />
                    <Route path="/chat-room" element={<></>} />
                    <Route path="/create-post" element={<></>} />
                    <Route path="/contact" element={<></>} />
                    <Route path="/profile" element={<></>} />
                    <Route path="/pastor-ai" element={<></>} />
                    <Route path="/video-call" element={<VideoCallPage />} />
                    <Route path="/camera-client" element={<CameraClientPage />} />
                    <Route path="/admin/json-converter" element={<AdminRoute><JsonConverterPage /></AdminRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </PageLayout>
        </>
    );
};

const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

const AuthRoutes: React.FC = () => (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
);


const App: React.FC = () => {
    const { isLoading, isAuthenticated, user } = useAuth();
    const [meetingNotification, setMeetingNotification] = useState<{ userName: string; roomId: string; message: string } | null>(null);
    
    // Ensure the webview is not under the Android status bar
    useEffect(() => {
        (async () => {
            try {
                await StatusBar.setOverlaysWebView({ overlay: false });
                await StatusBar.setBackgroundColor({ color: '#1B365D' });
                await StatusBar.setStyle({ style: Style.Light });
            } catch {}
        })();
    }, []);

    useEffect(() => {
        try {
            if (!isAuthenticated) {
                const hash = window.location.hash || '';
                if (!hash || hash === '#' || hash === '#/' || hash === '#') {
                    window.location.replace('#/login');
                }
            }
        } catch {}
    }, [isAuthenticated]);

    useEffect(() => {
        (async () => {
            try {
                const plat = (Capacitor as any)?.getPlatform?.() || 'web';
                const isNative = (Capacitor as any)?.isNativePlatform?.() || false;
                if (!(isNative && plat === 'android')) return;
                let effective = false;
                try {
                    const override = localStorage.getItem('nativeBgFetchOverride');
                    if (override !== null) {
                        effective = override === '1';
                    } else {
                        const eff = localStorage.getItem('enableNativeBgFetch');
                        if (eff !== null) {
                            effective = eff === '1';
                        } else {
                            // Check site content feature flag persisted locally
                            let fromSite = false;
                            try {
                                const scRaw = localStorage.getItem('siteContent');
                                if (scRaw) {
                                    const sc = JSON.parse(scRaw);
                                    fromSite = !!(sc?.featureFlags?.enableNativeBgFetch);
                                }
                            } catch {}
                            if (fromSite) {
                                effective = true;
                                try { localStorage.setItem('enableNativeBgFetch', '1'); } catch {}
                            } else {
                                const fromEnv = ((import.meta as any)?.env?.VITE_ENABLE_NATIVE_BG_FETCH === 'true');
                                effective = !!fromEnv;
                                try { localStorage.setItem('enableNativeBgFetch', fromEnv ? '1' : '0'); } catch {}
                            }
                        }
                    }
                } catch {}
                if (!effective) {
                    console.log('[App] Native background fetch disabled');
                    return;
                }
                if (document.readyState !== 'complete') {
                    await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
                }
                await new Promise((r) => setTimeout(r, 5000));
                await backgroundDownloadService.init({ intervalMinutes: 60, wifiOnly: false });
            } catch (e) {
                console.warn('[App] Background download init failed (plugin not available on this platform):', e);
            }
        })();
    }, []);

    // Runtime API switcher: allow setting base API via ?api=... in hash URL, persist to localStorage
    useEffect(() => {
        try {
            const href = window.location.href;
            const hash = window.location.hash || '';
            const query = hash.includes('?') ? hash.split('?')[1] : '';
            if (!query) return;
            const params = new URLSearchParams(query);
            const api = params.get('api');
            if (api) {
                const decoded = decodeURIComponent(api);
                localStorage.setItem('apiBaseUrl', decoded);
                console.log('[App] Runtime API base set to:', decoded);
                // remove api param from URL to avoid repeated handling
                params.delete('api');
                const baseHash = hash.split('?')[0];
                const newHash = baseHash + (params.toString() ? '?' + params.toString() : '');
                window.history.replaceState(null, '', href.replace(hash, newHash));
                // Reconnect websocket with new URL
                try { websocketService.disconnect(); } catch {}
                try { websocketService.connect(); } catch {}
                return;
            }

            // Background fetch toggle via ?bg=1 or ?bg=0 (device override)
            const bg = params.get('bg');
            if (bg !== null) {
                const enable = bg === '1' || bg === 'true';
                try {
                    if (enable) {
                        localStorage.setItem('nativeBgFetchOverride', '1');
                        localStorage.setItem('enableNativeBgFetch', '1');
                        console.log('[App] Native background fetch ENABLED via URL param');
                    } else {
                        localStorage.setItem('nativeBgFetchOverride', '0');
                        localStorage.setItem('enableNativeBgFetch', '0');
                        console.log('[App] Native background fetch DISABLED via URL param');
                    }
                } catch {}
                params.delete('bg');
                const baseHash = hash.split('?')[0];
                const newHash = baseHash + (params.toString() ? '?' + params.toString() : '');
                window.history.replaceState(null, '', href.replace(hash, newHash));
                return;
            }

            // Prefer direct upload toggle via ?preferDirect=1 or 0
            const pd = params.get('preferDirect');
            if (pd !== null) {
                const enable = pd === '1' || pd === 'true';
                try {
                    localStorage.setItem('preferDirectUpload', enable ? '1' : '0');
                    console.log('[App] PreferDirectUpload set via URL param:', enable);
                } catch {}
                params.delete('preferDirect');
                const baseHash = hash.split('?')[0];
                const newHash = baseHash + (params.toString() ? '?' + params.toString() : '');
                window.history.replaceState(null, '', href.replace(hash, newHash));
                return;
            }
        } catch {}
    }, []);

    // (moved wake-lock page/visibility watchers into ProtectedRoutes below)
    
    // Always ask for local notification permission when the app starts
    useEffect(() => {
        localNotificationService.initialize();
        localNotificationService.setupNotificationHandlers();
    }, []);

    // Initialize Local Notifications when user logs in
    useEffect(() => {
        if (user) {
            localNotificationService.initialize();
            localNotificationService.setupNotificationHandlers();
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;
        const urls = ['/bible/en.json', '/bible/sw.json'];
        const run = async () => {
            let cache: Cache | null = null;
            try {
                const hasCaches = typeof caches !== 'undefined' && caches.open;
                if (hasCaches) {
                    cache = await caches.open('bible-data-v1');
                }
            } catch {
                cache = null;
            }
            const tasks: Promise<any>[] = [];
            urls.forEach((u) => {
                tasks.push((async () => {
                    try {
                        if (cancelled) return;
                        if (cache) {
                            try {
                                const match = await cache.match(u);
                                if (match) return;
                            } catch {}
                        }
                        const res = await fetch(u);
                        if (cancelled) return;
                        if (cache && res && res.ok) {
                            try { await cache.put(u, res.clone()); } catch {}
                        }
                    } catch {}
                })());
            });
            try { await Promise.all(tasks); } catch {}
        };

        // Restore immediate prefetch at startup and after SW is ready
        (async () => { try { await run(); } catch {} try { await prepare('en'); await prepare('sw'); } catch {} })();
        try {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(() => {
                    if (!cancelled) {
                        run().then(() => { try { prepare('en'); prepare('sw'); } catch {} }).catch(() => {});
                    }
                }).catch(() => {});
            }
        } catch {}

        const parseWithWorker = (text: string): Promise<any> => {
            return new Promise((resolve, reject) => {
                try {
                    if (typeof Worker !== 'undefined') {
                        const w = new Worker(new URL('./workers/jsonParseWorker.js', import.meta.url));
                        const timer = window.setTimeout(() => { try { w.terminate(); } catch {} reject(new Error('Worker parse timeout')); }, 15000);
                        w.onmessage = (e: MessageEvent) => { window.clearTimeout(timer); try { w.terminate(); } catch {} const msg: any = e.data || {}; if (msg.ok) resolve(msg.data); else reject(new Error(msg.error || 'Worker parse failed')); };
                        w.onerror = () => { window.clearTimeout(timer); try { w.terminate(); } catch {} reject(new Error('Worker error')); };
                        w.postMessage({ text });
                    } else {
                        const data = JSON.parse(text);
                        resolve(data);
                    }
                } catch (err) { reject(err as any); }
            });
        };

        const prepare = async (lang: 'en' | 'sw') => {
            try {
                if (cancelled) return;
                let txt: string | null = null;
                try {
                    const match = await caches.match(`/bible/${lang}.json`).catch(() => null);
                    if (match) txt = await match.text();
                } catch {}
                if (!txt) {
                    try {
                        const res = await fetch(`/bible/${lang}.json`);
                        if (res && res.ok) {
                            const clone = res.clone();
                            txt = await res.text();
                            try { const cache = await caches.open('bible-data-v1'); await cache.put(`/bible/${lang}.json`, clone); } catch {}
                        }
                    } catch {}
                }
                if (!txt) return;
                
                const data = await parseWithWorker(txt);
                if (!data) return;
                let payload: any = null;
                if ((data as any).BIBLEBOOK && Array.isArray((data as any).BIBLEBOOK)) {
                    const books = (data as any).BIBLEBOOK.map((b: any, idx: number) => ({ name: b.book_name, number: b.book_number || String(idx + 1) }));
                    if (books.length > 0) {
                        const firstBook = (data as any).BIBLEBOOK[0];
                        const chapters = (firstBook.CHAPTER || []).map((ch: any) => ch.chapter_number);
                        const verses = (firstBook.CHAPTER?.[0]?.VERSES || []).map((v: any) => ({ number: v.verse_number, text: v.verse_text }));
                        payload = { books, selectedBook: books[0], chapters, selectedChapter: chapters[0] || '1', verses };
                    }
                } else {
                    const bookNames = Object.keys(data || {});
                    const books = bookNames.map((name: string, idx: number) => ({ name, number: String(idx + 1) }));
                    if (books.length > 0) {
                        const firstName = books[0].name;
                        const chapters = Object.keys((data as any)[firstName] || {});
                        const firstChapter = chapters[0];
                        const verseObj = ((data as any)[firstName] || {})[firstChapter] || {};
                        const verses = Object.entries(verseObj).map(([num, text]) => ({ number: num as string, text: String(text) }));
                        payload = { books, selectedBook: books[0], chapters, selectedChapter: firstChapter || '1', verses };
                    }
                }
                if (payload) {
                    try { localStorage.setItem(`bible_first_view_${lang}`, JSON.stringify(payload)); } catch {}
                }
            } catch {}
        };

        // initial prepare is triggered after first run above

        return () => { cancelled = true; };
    }, []);

    // Listen for meeting notifications
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleMeetingNotification = async (data: { userName: string; roomId: string; message: string }) => {
            console.log('[App] Meeting notification:', data);

            // Show native/local notification on the device
            try {
                await localNotificationService.showMeetingNotification(data.userName, data.roomId);
            } catch (err) {
                console.error('[App] Failed to show meeting local notification:', err);
            }

            // Also show in-app banner while app is open
            setMeetingNotification(data);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                setMeetingNotification(null);
            }, 10000);
        };

        // Subscribe to meeting notifications via websocket
        const socket = websocketService.getSocket();
        socket.on('meeting-notification', handleMeetingNotification);
        
        return () => {
            socket.off('meeting-notification', handleMeetingNotification);
        };
    }, [isAuthenticated]);

    // Let server know when this user is online
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const socket = websocketService.getSocket();
        const token = localStorage.getItem('authToken');
        if (!token) return;

        socket.emit('user-online', { token });

        const handleBeforeUnload = () => {
            socket.emit('user-offline', { token });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isAuthenticated, user]);

    // Presence pings and visibility handling for more accurate lastSeen/online
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const socket = websocketService.getSocket();
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const pingId = window.setInterval(() => {
            try {
                if (document.visibilityState === 'visible') {
                    socket.emit('presence:ping', { token });
                }
            } catch {}
        }, 30000);

        const onVis = () => {
            try {
                if (document.visibilityState === 'visible') {
                    socket.emit('user-online', { token });
                } else {
                    socket.emit('user-offline', { token });
                }
            } catch {}
        };
        document.addEventListener('visibilitychange', onVis);

        return () => {
            try { window.clearInterval(pingId); } catch {}
            try { document.removeEventListener('visibilitychange', onVis); } catch {}
            try { socket.emit('user-offline', { token }); } catch {}
        };
    }, [isAuthenticated, user]);
    
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
      <Router>
        <UpdateNotification />
        <OfflineIndicator />

        {/* Centralized header manager to ensure visibility across app */}
        <HeaderLayout>
          {/* Meeting Notification Banner */}
          {meetingNotification && (
            <a
              href="/#/video-call"
              onClick={() => setMeetingNotification(null)}
              className="fixed left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-down cursor-pointer"
              style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
            >
              <div className="bg-secondary text-primary rounded-lg shadow-2xl p-4 flex items-center gap-3 hover:bg-gold-light transition-colors">
                <SermonsIcon className="w-10 h-10 text-primary animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-lg">{meetingNotification.userName} is in a meeting</p>
                  <p className="text-sm opacity-90">Tap anywhere to join!</p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
            </a>
          )}

          {isAuthenticated ? <ProtectedRoutes /> : <AuthRoutes />}
        </HeaderLayout>
      </Router>
    );
};

export default App;