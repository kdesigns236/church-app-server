import React, { useState, lazy, Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import UpdateNotification from './components/UpdateNotification';
import HomePage from './pages/HomePage';
import SermonsPage from './pages/SermonsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import EventsPage from './pages/EventsPage';
import GivingPage from './pages/GivingPage';
import ContactPage from './pages/ContactPage';
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
import TenziPage from './pages/TenziPage';
import ProStreamApp from './pages/ProStreamApp';
import { useAuth } from './hooks/useAuth';
import { LoadingScreen } from './components/LoadingScreen';
import { localNotificationService } from './services/localNotificationService';
import { websocketService } from './services/websocketService';

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
    const showFooter = !['/sermons', '/admin', '/chat', '/bible', '/giving', '/pastor-ai', '/video-call', '/golive', '/prostream'].includes(location.pathname);
    
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

    const showHeader = !['/sermons', '/chat', '/pastor-ai', '/video-call', '/golive', '/prostream'].includes(location.pathname);

    return (
        <>
            <OfflineIndicator />
            {showHeader && <Header />}
            <PageLayout>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/sermons" element={<SermonsPage />} />
                        <Route path="/announcements" element={<AnnouncementsPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/bible" element={<BiblePage />} />
                        <Route path="/bible-study" element={<BibleStudyPage />} />
                        <Route path="/tenzi" element={<TenziPage />} />
                        <Route path="/giving" element={<GivingPage />} />
                        <Route path="/golive" element={<GoLivePage />} />
                        <Route path="/prostream" element={<ProStreamApp />} />
                        <Route path="/chat" element={<ChatPage />} />
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

        const handleMeetingNotification = (data: { userName: string; roomId: string; message: string }) => {
            console.log('[App] Meeting notification:', data);
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
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-down cursor-pointer"
          >
            <div className="bg-secondary text-primary rounded-lg shadow-2xl p-4 flex items-center gap-3 hover:bg-gold-light transition-colors">
              <svg className="w-10 h-10 text-primary animate-pulse flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-lg">{meetingNotification.userName} is in a meeting</p>
                <p className="text-sm opacity-90">Tap anywhere to join!</p>
              </div>
              <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        )}
        
        {isAuthenticated ? <ProtectedRoutes /> : <AuthRoutes />}
      </Router>
    );
};

export default App;