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
  async fetch(url: string, options: any = {}): Promise<Response> {
    const headers = this.getHeaders(options.headers as Record<string, string>);
    const { timeoutMs, ...rest } = options || {};
    const ms = typeof timeoutMs === 'number' ? timeoutMs : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, {
        ...rest,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.status === 426) {
        const data = await response.json();
        if (data.error === 'UPDATE_REQUIRED') {
          alert(`${data.message}\n\nDownload Link: ${data.downloadUrl}`);
          window.open(data.downloadUrl, '_blank');
        }
        throw new Error(data.message || 'Update required');
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }
      throw error;
    }
  },

  // Get current app version
  getVersion(): string {
    return APP_VERSION;
  }
};
