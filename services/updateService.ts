// Update notification service
// Checks for new app versions and prompts users to update

const CURRENT_APP_VERSION = '2.1.0'; // Update this when you release new version
const UPDATE_CHECK_URL = `${import.meta.env.VITE_API_URL || 'https://church-app-server.onrender.com/api'}/app-version`;

interface AppVersion {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean; // If true, app won't work until updated
}

export const updateService = {
  // Check if update is available
  async checkForUpdate(): Promise<AppVersion | null> {
    try {
      const response = await fetch(UPDATE_CHECK_URL);
      const data: AppVersion = await response.json();
      
      // Compare versions
      if (this.isNewerVersion(data.version, CURRENT_APP_VERSION)) {
        console.log('[Update] New version available:', data.version);
        return data;
      }
      
      console.log('[Update] App is up to date');
      return null;
    } catch (error) {
      console.error('[Update] Failed to check for updates:', error);
      return null;
    }
  },

  // Compare version strings (e.g., "2.1.0" vs "2.0.0")
  isNewerVersion(serverVersion: string, currentVersion: string): boolean {
    const server = serverVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (server[i] > current[i]) return true;
      if (server[i] < current[i]) return false;
    }
    
    return false;
  },

  // Get current app version
  getCurrentVersion(): string {
    return CURRENT_APP_VERSION;
  },

  // Open download link in browser
  openDownloadLink(url: string) {
    window.open(url, '_blank');
  }
};
