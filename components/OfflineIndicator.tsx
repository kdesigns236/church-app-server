import React, { useState, useEffect } from 'react';
import { CheckIcon } from '../constants/icons';
import { FiAlertCircle } from 'react-icons/fi';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div
      className={`fixed right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-gray-900'
      }`}
      style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <CheckIcon className="w-5 h-5" />
            <span className="font-semibold">Back Online</span>
          </>
        ) : (
          <>
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-semibold">You're Offline</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="text-sm mt-1">Some features may be limited</p>
      )}
    </div>
  );
};
