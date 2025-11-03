import React from 'react';
import { Link } from 'react-router-dom';
import { CrossIcon, CogIcon } from '../constants/icons';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';

export const Footer: React.FC = () => {
  const { siteContent } = useAppContext();
  const { user } = useAuth();
  const contactInfo = siteContent?.contactInfo || { addressLine1: '', addressLine2: '', email: '', phone1: '', phone2: '' };
  const socialLinks = siteContent?.socialLinks || { facebook: '', youtube: '', tiktok: '' };
  
  return (
    <footer className="bg-primary text-gray-300 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Church Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CrossIcon className="h-8 w-8 text-secondary"/>
              <h2 className="text-xl font-serif font-bold text-white">Church of God Evening Light</h2>
            </div>
            <p className="text-sm">{contactInfo.addressLine1}, {contactInfo.addressLine2}</p>
            <p className="text-sm">{contactInfo.email}</p>
            <p className="text-sm">{contactInfo.phone1} / {contactInfo.phone2}</p>
            <p className="text-sm font-semibold">Service Times: Sundays at 10:00 AM</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/sermons" className="hover:text-secondary transition-colors">Sermons</Link></li>
              <li><Link to="/events" className="hover:text-secondary transition-colors">Events</Link></li>
              <li><Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link></li>
              <li><Link to="/giving" className="hover:text-secondary transition-colors">Give Online</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Facebook</a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">YouTube</a>
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">TikTok</a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Stay Updated</h3>
            <form>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="email" placeholder="Your email address" className="w-full px-4 py-2 rounded-md bg-navy-light text-white border-none focus:ring-2 focus:ring-secondary" />
                <button type="submit" className="bg-secondary text-primary font-bold px-4 py-2 rounded-md hover:bg-gold-light transition-colors">Subscribe</button>
              </div>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-navy-light text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Church of God Evening Light. All Rights Reserved.</p>
           {user?.role === 'admin' && (
             <div className="mt-2 mb-4">
              <Link to="/admin" className="inline-flex items-center gap-1 hover:text-secondary transition-colors">
                <CogIcon className="w-4 h-4"/> Admin
              </Link>
             </div>
           )}
           {/* Developer Credit */}
           <div className="border-t border-navy-light/40 pt-6 mt-6">
             <div className="flex flex-col items-center gap-3">
                <img 
                  src="/admin.png"
                  alt="Kevin" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-navy-light"
                />
                <div className="text-center">
                    <p className="font-semibold text-gray-300">Created by Kevin</p>
                    <p className="text-xs text-gray-400 mt-1">Click to follow me on TikTok</p>
                    <a 
                      href="https://www.tiktok.com/@codewithkevin02" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-2 inline-block bg-secondary text-primary font-bold px-4 py-1.5 rounded-md hover:bg-gold-light transition-colors text-sm"
                    >
                        Follow
                    </a>
                </div>
             </div>
           </div>
        </div>
      </div>
    </footer>
  );
};