import React, { useState, lazy, Suspense } from 'react';
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
import { useAuth } from './hooks/useAuth';
import { LoadingScreen } from './components/LoadingScreen';

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
    const showFooter = !['/sermons', '/admin', '/chat', '/bible', '/giving', '/pastor-ai'].includes(location.pathname);
    
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

    const showHeader = !['/sermons', '/chat', '/pastor-ai'].includes(location.pathname);

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
                        <Route path="/giving" element={<GivingPage />} />
                        <Route path="/golive" element={<GoLivePage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/pastor-ai" element={<PastorAiPage />} />
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
    const { isLoading, isAuthenticated } = useAuth();
    
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
      <Router>
        <UpdateNotification />
        <OfflineIndicator />
        {isAuthenticated ? <ProtectedRoutes /> : <AuthRoutes />}
      </Router>
    );
};

export default App;