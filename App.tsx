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
import { keepAwakeService } from './services/keepAwakeService';

// Lazy load the Bible page because of its large data dependency
const BiblePage = lazy(() => import('./pages/BiblePage'));
const BibleStudyPage = lazy(() => import('./pages/BibleStudyPage'));

const LoadingFallback: React.FC = () => (
    <div className="flex items-center justify-center w-full h-[calc(100vh-10rem)] bg-accent dark:bg-gray-900">
        <p className="text-white text-lg animate-pulse">Loading Page...</p>
    </div>
);


const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const showFooter = location.pathname === '/';
    
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

    const hideHeaderOn = [
        '/sermons',
        '/chat',
        '/chat-room',
        '/pastor-ai',
        '/bible',
        '/video-call',
        '/golive',
        '/prostream',
    ];
    const showHeader = !hideHeaderOn.includes(location.pathname);

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

    return (
        <>
            <OfflineIndicator />
            {showHeader && <Header />}
            <div style={{ paddingTop: showHeader ? 'calc(env(safe-area-inset-top) + 3.5rem)' : 0 }}>
            <PageLayout>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/sermons" element={<SermonsPage />} />
                        <Route path="/announcements" element={<AnnouncementsPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/bible" element={<BiblePage />} />
                        <Route path="/bible-study" element={<BibleStudyPage />} />
                        <Route path="/giving" element={<GivingPage />} />
                        <Route path="/members" element={<MembersPage />} />
                        <Route path="/golive" element={<GoLivePage />} />
                        <Route path="/prostream" element={<ProStreamApp />} />
                        <Route path="/chat" element={<CommunityFeedPage />} />
                        <Route path="/chat-room" element={<ChatPage />} />
                        <Route path="/create-post" element={<CreatePostPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/pastor-ai" element={<PastorAiPage />} />
                        <Route path="/video-call" element={<VideoCallPage />} />
                        <Route path="/camera-client" element={<CameraClientPage />} />
                        <Route path="/admin/json-converter" element={
                            <AdminRoute>
                                <JsonConverterPage />
                            </AdminRoute>
                        } />
                        <Route path="/admin" element={
                            <AdminRoute>
                                <AdminPage />
                            </AdminRoute>
                        } />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </PageLayout>
            </div>
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
                await StatusBar.setStyle({ style: Style.Dark });
            } catch {}
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
            if (!api) return;
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
    
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
      <Router>
        <UpdateNotification />
        <OfflineIndicator />
        
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
      </Router>
    );
};

export default App;