import React, { useEffect, useState } from 'react';
import { updateService } from '../services/updateService';
import { FiDownload } from 'react-icons/fi';

interface AppVersion {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<AppVersion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check for updates on app startup
    checkForUpdates();

    // Check every 6 hours
    const interval = setInterval(checkForUpdates, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    const update = await updateService.checkForUpdate();
    if (update) {
      setUpdateAvailable(update);
      setDismissed(false);
    }
  };

  const handleUpdate = () => {
    if (updateAvailable) {
      updateService.openDownloadLink(updateAvailable.downloadUrl);
    }
  };

  const handleDismiss = () => {
    if (!updateAvailable?.forceUpdate) {
      setDismissed(true);
    }
  };

  // Don't show if no update or dismissed (and not forced)
  if (!updateAvailable || (dismissed && !updateAvailable.forceUpdate)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-secondary rounded-full p-3">
            <FiDownload className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-primary dark:text-secondary mb-2">
          {updateAvailable.forceUpdate ? 'Update Required' : 'Update Available'}
        </h2>

        {/* Version */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          Version {updateAvailable.version} is now available!
        </p>

        {/* Release Notes */}
        {updateAvailable.releaseNotes && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-primary dark:text-secondary mb-2">
              What's New:
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {updateAvailable.releaseNotes}
            </p>
          </div>
        )}

        {/* Current Version */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6">
          Current version: {updateService.getCurrentVersion()}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          {!updateAvailable.forceUpdate && (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Later
            </button>
          )}
          <button
            onClick={handleUpdate}
            className={`${updateAvailable.forceUpdate ? 'flex-1' : 'flex-1'} px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-navy-light transition-colors flex items-center justify-center gap-2`}
          >
            <FiDownload className="w-5 h-5" />
            Update Now
          </button>
        </div>

        {/* Force update message */}
        {updateAvailable.forceUpdate && (
          <p className="text-xs text-center text-error mt-4">
            This update is required to continue using the app
          </p>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;
