import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { CrossIcon, HomeIcon, SermonsIcon, AnnouncementsIcon, EventsIcon, BibleIcon, BookIcon, GivingIcon, BroadcastIcon, ChatBubbleIcon, MailIcon, UsersIcon } from '../constants/icons';
import { useAuth } from '../hooks/useAuth';
import {
  FiMenu,
  FiX,
  FiMoon,
  FiZap,
} from 'react-icons/fi';

const navLinks = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Sermons', path: '/sermons', icon: SermonsIcon },
  { name: 'Announcements', path: '/announcements', icon: AnnouncementsIcon },
  { name: 'Events', path: '/events', icon: EventsIcon },
  { name: 'Bible', path: '/bible', icon: BibleIcon },
  { name: 'Bible Study', path: '/bible-study', icon: BibleIcon },
  { name: 'Giving', path: '/giving', icon: GivingIcon },
  // Go Live route remains available internally but is hidden from the main navigation for now
  { name: 'Church Community', path: '/chat', icon: ChatBubbleIcon },
  { name: 'Members', path: '/members', icon: UsersIcon },
  { name: 'Contact', path: '/contact', icon: MailIcon },
];

const UserAvatar: React.FC<{ user: NonNullable<ReturnType<typeof useAuth>['user']> }> = ({ user }) => {
    // Support both profilePictureUrl and profilePicture field names
    const profilePic = user.profilePictureUrl || (user as any).profilePicture;
    
    return (
        <>
            {profilePic ? (
                <img src={profilePic} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
                <span className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                </span>
            )}
        </>
    );
};


export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const baseClasses = "fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-safe";
  const scrolledClasses = "bg-primary dark:bg-gray-900 shadow-md";
  const topClasses = "bg-primary dark:bg-gray-900";

  return (
    <header className={`${baseClasses} ${isScrolled ? scrolledClasses : topClasses}`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center text-white">
              <span className="font-serif text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap">Church of God Evening Light</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-secondary text-primary'
                      : 'text-gray-300 hover:bg-navy-light hover:text-white'
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/10 dark:bg-white/5 shadow-sm">
                    <link.icon className="h-4 w-4" />
                  </span>
                  <span>{link.name}</span>
                </Link>
              ))}
              <span className="text-gray-300 text-sm">|</span>
               {user && (
                    <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <Link to="/profile" className="text-white font-medium text-sm hidden lg:block hover:text-secondary transition-colors">Welcome, {user.name}</Link>
                        <button
                            onClick={logout}
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
                            aria-label="Logout"
                        >
                            Logout
                        </button>
                    </div>
               )}
              <Link
                to="/pastor-ai"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-navy-light hover:text-white transition-colors"
                aria-label="Open AI Assistant"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/10 dark:bg-white/5 shadow-sm">
                  <FiZap className="h-4 w-4" />
                </span>
                <span>Pastor AI</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-navy-light focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <FiX className="block h-6 w-6" /> : <FiMenu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="md:hidden bg-primary dark:bg-gray-900 border-t border-navy-light max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-secondary text-primary'
                    : 'text-gray-300 hover:bg-navy-light hover:text-white'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 via-white/10 to-black/40 border border-white/25 shadow-lg shadow-black/40 backdrop-blur-md transform transition-all duration-200 group-hover:shadow-2xl group-hover:scale-110 group-hover:-translate-y-0.5">
                  <link.icon className="h-5 w-5" />
                </div>
                <span>{link.name}</span>
              </Link>
            ))}
             <div className="border-t border-navy-light my-2"></div>
              <Link
                to="/pastor-ai"
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-navy-light hover:text-white transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 via-white/10 to-black/40 border border-white/25 shadow-lg shadow-black/40 backdrop-blur-md transform transition-all duration-200 group-hover:shadow-2xl group-hover:scale-110 group-hover:-translate-y-0.5">
                  <FiZap className="h-5 w-5" />
                </div>
                <span>Pastor AI</span>
              </Link>
              <div className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-300">
                <div className="flex items-center gap-3">
                    <FiMoon className="h-5 w-5" />
                    <span>Change Theme</span>
                </div>
                <ThemeToggle />
            </div>
             {user && (
                <>
                    <div className="border-t border-navy-light my-2"></div>
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <Link to="/profile" onClick={() => setIsOpen(false)} className="text-white font-medium text-base hover:text-secondary transition-colors">Welcome, {user.name}</Link>
                        </div>
                        <button
                            onClick={() => {
                            logout();
                            setIsOpen(false);
                            }}
                            className="mt-3 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
                            aria-label="Logout"
                        >
                            Logout
                        </button>
                    </div>
                </>
             )}
          </div>
        </div>
      )}
    </header>
  );
};