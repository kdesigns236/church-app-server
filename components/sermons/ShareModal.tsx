
import React, { useState } from 'react';
import { CloseIcon, LinkIcon, CheckIcon, FacebookIcon, TwitterIcon, WhatsAppIcon } from '../../constants/icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, title }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const socialShares = [
    { name: 'Facebook', icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Twitter', icon: TwitterIcon, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { name: 'WhatsApp', icon: WhatsAppIcon, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}` },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-accent dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-serif font-bold text-primary dark:text-white">Share Sermon</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <CloseIcon className="w-6 h-6 text-text-main dark:text-gray-300" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-text-main dark:text-gray-300 mb-4">Share this message with others:</p>
          <div className="flex items-center justify-around mb-6">
            {socialShares.map(({ name, icon: Icon, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-text-main dark:text-gray-300 hover:text-primary dark:hover:text-secondary transition-colors"
                aria-label={`Share on ${name}`}
              >
                <Icon className="w-10 h-10" />
                <span className="text-xs">{name}</span>
              </a>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={url}
              readOnly
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-24 py-2 text-sm"
            />
            <button
              onClick={handleCopy}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-secondary text-primary font-semibold px-3 py-1 rounded-md text-sm hover:bg-gold-light"
            >
              {isCopied ? <CheckIcon className="w-4 h-4"/> : <LinkIcon className="w-4 h-4" />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};