import React, { useEffect, useState } from 'react';
import { safeBackgroundFetchService } from '../services/safeBackgroundFetchService';

export const BackgroundFetchSettings: React.FC = () => {
  const [stats, setStats] = useState({ downloaded: 0, failed: 0, enabled: false });
  const [loading, setLoading] = useState(false);

  const update = () => setStats(safeBackgroundFetchService.getStats());

  useEffect(() => { update(); }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (stats.enabled) safeBackgroundFetchService.disable();
      else safeBackgroundFetchService.enable();
      update();
    } finally { setLoading(false); }
  };

  const clear = () => {
    if (confirm('Clear download records?')) {
      safeBackgroundFetchService.clearDownloadedRecords();
      update();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Background Download</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Automatically download sermon videos in the background for offline viewing.</p>

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Background Downloads</span>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stats.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Downloaded:</span>
          <span className="font-medium text-green-600 dark:text-green-400">{stats.downloaded} sermons</span>
        </div>
        {stats.failed > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Failed:</span>
            <span className="font-medium text-red-600 dark:text-red-400">{stats.failed} sermons</span>
          </div>
        )}
      </div>

      {(stats.downloaded > 0 || stats.failed > 0) && (
        <button onClick={clear} className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Clear Download Records</button>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-700 dark:text-blue-300">💡 Background downloads occur automatically every 6 hours when enabled. Videos are stored locally for offline viewing.</p>
      </div>
    </div>
  );
};
