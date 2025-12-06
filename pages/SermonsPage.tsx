
import React, { useState, useRef, useEffect } from 'react';
import { SermonReel } from '../components/sermons/SermonReel';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { CommentModal } from '../components/sermons/CommentModal';
import { ShareModal } from '../components/sermons/ShareModal';
import { Sermon } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../constants/icons';

const SermonsPage: React.FC = () => {
  const { sermons, handleSermonInteraction, addSermonComment } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeSermonId, setActiveSermonId] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)); // Start unmuted as requested
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const chromeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track orientation to control page-level chrome visibility
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

      // Update CSS viewport variables for reliable mobile sizing
      try {
        const root = document.documentElement;
        root.style.setProperty('--app-vh', `${window.innerHeight}px`);
        root.style.setProperty('--app-vw', `${window.innerWidth}px`);
      } catch {}

      if (!landscape) {
        setShowChrome(true);
        if (chromeTimeoutRef.current) {
          clearTimeout(chromeTimeoutRef.current);
          chromeTimeoutRef.current = null;
        }
      } else {
        setShowChrome(false);
      }
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    try { (screen as any).orientation?.addEventListener?.('change', updateOrientation); } catch {}

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
      try { (screen as any).orientation?.removeEventListener?.('change', updateOrientation); } catch {}
      if (chromeTimeoutRef.current) {
        clearTimeout(chromeTimeoutRef.current);
      }
    };
  }, []);

  // Sort sermons by date - newest first
  const sortedSermons = [...sermons].sort((a, b) => {
    const orderA = typeof (a as any).order === 'number' ? (a as any).order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof (b as any).order === 'number' ? (b as any).order : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first when order is the same or not set
  });
  
  // Get active sermon from sermons array (always up-to-date)
  const activeSermon = activeSermonId ? sortedSermons.find(s => s.id === activeSermonId) || null : null;

  // Track current visible sermon
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = window.innerHeight;
      const index = Math.round(scrollTop / height);
      setCurrentIndex(Math.max(0, Math.min(index, sortedSermons.length - 1)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sortedSermons.length]); // Global mute state for all videos

  const handleUserInteraction = () => {
    if (!isLandscape) return;

    setShowChrome(true);
    if (chromeTimeoutRef.current) {
      clearTimeout(chromeTimeoutRef.current);
    }
    chromeTimeoutRef.current = setTimeout(() => {
      setShowChrome(false);
    }, 4000);
  };

  const handleOpenComments = (sermon: Sermon) => {
    setActiveSermonId(sermon.id);
    setIsCommentModalOpen(true);
  };
  
  const handleAddComment = (sermonId: string, content: string) => {
    if (user) {
        addSermonComment(sermonId, content, user);
    }
  };

  const handleShare = async (sermon: Sermon) => {
    setActiveSermonId(sermon.id);
    const shareData = {
      title: sermon.title,
      text: `Watch this sermon from Church of God Evening Light: "${sermon.title}" by ${sermon.pastor}.`,
      url: window.location.href, // In a real app, this would be a deep link to the sermon
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to modal if user cancels share
        setIsShareModalOpen(true);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setIsShareModalOpen(true);
    }
  };

  return (
    <>
      {/* Back Button */}
      {(!isLandscape || showChrome) && (
        <button
          onClick={() => navigate('/')}
          className="fixed left-3 z-50 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all duration-300 shadow-lg active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Sermon Counter */}
      {sortedSermons.length > 0 && (!isLandscape || showChrome) && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-bold shadow-lg" style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
          {currentIndex + 1} / {sortedSermons.length}
        </div>
      )}

      {/* Reels Container */}
      <div 
        ref={containerRef}
        className="reel-container h-screen w-screen bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide" 
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', height: 'var(--app-vh, 100vh)', width: 'var(--app-vw, 100vw)' }}
        onPointerDown={handleUserInteraction}
        onTouchStart={handleUserInteraction}
      >
        {sortedSermons.length > 0 ? (
          sortedSermons.map((sermon, index) => (
            <SermonReel
              key={sermon.id}
              sermon={sermon}
              onLike={() => handleSermonInteraction(sermon.id, 'like')}
              onComment={() => handleOpenComments(sermon)}
              onShare={() => handleShare(sermon)}
              onSave={() => handleSermonInteraction(sermon.id, 'save')}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              isActive={index === currentIndex}
              showChrome={showChrome}
              onUserInteraction={handleUserInteraction}
            />
          ))
        ) : (
          <div className="h-screen flex items-center justify-center text-white">
            <div className="text-center px-6">
              <div className="w-20 h-20 mx-auto mb-4 text-gray-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">No Sermons Yet</h3>
              <p className="text-gray-400 text-sm">Check back later for new content</p>
            </div>
          </div>
        )}
      </div>
      
      <CommentModal 
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        sermon={activeSermon}
        onAddComment={handleAddComment}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={window.location.href}
        title={activeSermon?.title || 'Check out this sermon'}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default SermonsPage;