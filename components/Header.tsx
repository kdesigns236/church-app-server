import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { HomeIcon, SermonsIcon, AnnouncementsIcon, EventsIcon, BibleIcon, BookIcon, GivingIcon, MenuIcon, CloseIcon, CrossIcon, MailIcon, ChatBubbleIcon, MoonIcon, BroadcastIcon } from '../constants/icons';
import { AssistantIcon } from '../constants/icons';
import { useAuth } from '../hooks/useAuth';

const navLinks = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Sermons', path: '/sermons', icon: SermonsIcon },
  { name: 'Announcements', path: '/announcements', icon: AnnouncementsIcon },
  { name: 'Events', path: '/events', icon: EventsIcon },
  { name: 'Bible', path: '/bible', icon: BibleIcon },
  { name: 'Bible Study', path: '/bible-study', icon: BibleIcon },
  { name: 'Tenzi la Rohoni', path: '/tenzi', icon: BookIcon },
  { name: 'Giving', path: '/giving', icon: GivingIcon },
  { name: 'Go Live', path: '/golive', icon: BroadcastIcon },
  { name: 'Chat', path: '/chat', icon: ChatBubbleIcon },
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

  const baseClasses = "sticky top-0 z-50 transition-all duration-300 pt-safe";
  const scrolledClasses = "bg-primary/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg";
  const topClasses = "bg-primary dark:bg-gray-900";

  return (
    <header className={`${baseClasses} ${isScrolled ? scrolledClasses : topClasses}`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-white">
              <CrossIcon className="h-8 w-8 text-secondary"/>
              <span className="font-serif text-lg sm:text-xl md:text-2xl font-bold">Church of God Evening Light</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-secondary text-primary'
                      : 'text-gray-300 hover:bg-navy-light hover:text-white'
                  }`}
                >
                  {link.name}
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
                className="rounded-full bg-transparent hover:bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary dark:focus:ring-offset-gray-800 focus:ring-purple-500"
                aria-label="Open AI Assistant"
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary dark:bg-gray-900 p-1.5">
                    <AssistantIcon className="w-6 h-6 text-secondary" />
                </div>
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
              {isOpen ? <CloseIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="md:hidden bg-primary dark:bg-gray-900 border-t border-navy-light">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-secondary text-primary'
                    : 'text-gray-300 hover:bg-navy-light hover:text-white'
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            ))}
             <div className="border-t border-navy-light my-2"></div>
              <Link
                to="/pastor-ai"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-navy-light hover:text-white transition-colors"
              >
                <AssistantIcon className="h-5 w-5" />
                <span>Pastor AI</span>
              </Link>
              <div className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-300">
                <div className="flex items-center gap-3">
                    <MoonIcon className="h-5 w-5" />
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