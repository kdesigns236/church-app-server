import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { SaveIcon, CheckIcon } from '../constants/icons';

interface StoragePermissionModalProps {
  onClose: () => void;
}

export const StoragePermissionModal: React.FC<StoragePermissionModalProps> = ({ onClose }) => {
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const info = await storageService.getStorageEstimate();
    setStorageInfo(info);
    setIsLoading(false);
  };

  const handleAllow = async () => {
    const granted = await storageService.requestPersistentStorage();
    if (granted) {
      alert('✅ Storage permission granted! Your data will be protected.');
    } else {
      alert('⚠️ Storage permission denied. Your data may be cleared if device runs low on space.');
    }
    onClose();
  };

  const handleDeny = () => {
    alert('You can enable storage permission later in your browser settings.');
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <p className="text-center">Loading storage information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <SaveIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Storage Permission
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Church of God Evening Light would like to store data on your device
          </p>
        </div>

        {storageInfo && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {storageInfo.usageFormatted}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Available:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {storageInfo.quotaFormatted}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storageInfo.usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              {storageInfo.usagePercent.toFixed(1)}% used
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Offline Access</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Access sermons and Bible without internet</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Faster Loading</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Content loads instantly from cache</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Protected Data</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Won't be automatically cleared by browser</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Allow
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          You can change this permission anytime in your browser settings
        </p>
      </div>
    </div>
  );
};
