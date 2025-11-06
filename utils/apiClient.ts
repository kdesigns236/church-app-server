// API Client with version header
// Ensures all API requests include the app version

const APP_VERSION = '2.1.0';

export const apiClient = {
  // Get API headers with version
  getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-App-Version': APP_VERSION,
      ...additionalHeaders
    };
  },

  // Fetch with version header
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.getHeaders(options.headers as Record<string, string>);
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Check for update required error
    if (response.status === 426) {
      const data = await response.json();
      if (data.error === 'UPDATE_REQUIRED') {
        // Show update alert
        alert(`${data.message}\n\nDownload Link: ${data.downloadUrl}`);
        // Open download link
        window.open(data.downloadUrl, '_blank');
      }
      throw new Error(data.message || 'Update required');
    }

    return response;
  },

  // Get current app version
  getVersion(): string {
    return APP_VERSION;
  }
};
