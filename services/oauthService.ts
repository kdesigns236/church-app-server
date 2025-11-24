// OAuth Service for Facebook and YouTube Live Authentication
export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

class OAuthService {
  private readonly FACEBOOK_CONFIG: OAuthConfig = {
    clientId: (import.meta as any).env?.VITE_FACEBOOK_APP_ID || '',
    redirectUri: `${window.location.origin}/auth/facebook/callback`,
    scope: 'public_profile'
  };

  private readonly YOUTUBE_CONFIG: OAuthConfig = {
    clientId: (import.meta as any).env?.VITE_YOUTUBE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/youtube/callback`,
    scope: 'https://www.googleapis.com/auth/youtube.force-ssl'
  };

  // Initiate Facebook OAuth flow
  async authenticateFacebook(): Promise<OAuthToken> {
    return new Promise((resolve, reject) => {
      const state = this.generateState();
      const authUrl = this.buildFacebookAuthUrl(state);
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'facebook-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Listen for popup messages
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(event.data.token);
        } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);
    });
  }

  // Initiate YouTube OAuth flow
  async authenticateYouTube(): Promise<OAuthToken> {
    return new Promise((resolve, reject) => {
      const state = this.generateState();
      const authUrl = this.buildYouTubeAuthUrl(state);
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'youtube-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Listen for popup messages
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(event.data.token);
        } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);
    });
  }

  // Build Facebook OAuth URL
  private buildFacebookAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.FACEBOOK_CONFIG.clientId,
      redirect_uri: this.FACEBOOK_CONFIG.redirectUri,
      scope: this.FACEBOOK_CONFIG.scope,
      response_type: 'code',
      state: state
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  // Build YouTube OAuth URL
  private buildYouTubeAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.YOUTUBE_CONFIG.clientId,
      redirect_uri: this.YOUTUBE_CONFIG.redirectUri,
      scope: this.YOUTUBE_CONFIG.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  // Generate secure state parameter
  private generateState(): string {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(16)).join('');
  }

  // Exchange authorization code for access token (Facebook)
  async exchangeFacebookCode(code: string, state: string): Promise<OAuthToken> {
    try {
      // First try the backend endpoint if available
      try {
        const response = await fetch('/api/auth/facebook/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            redirectUri: this.FACEBOOK_CONFIG.redirectUri,
          }),
        });

        if (response.ok) {
          const tokenData = await response.json();
          this.storeToken('facebook', tokenData);
          return tokenData;
        } else {
          let body: string | undefined;
          try {
            body = await response.text();
          } catch {
            body = undefined;
          }
          console.warn('[OAuth] Backend Facebook token endpoint failed', response.status, body);
        }
      } catch (serverError) {
        console.warn('[OAuth] Backend Facebook token request error, falling back to direct Facebook exchange', serverError);
      }

      // Fallback: exchange code directly with Facebook OAuth token endpoint (useful for local dev)
      const fbAppId = (import.meta as any).env?.VITE_FACEBOOK_APP_ID || '';
      const fbAppSecret = (import.meta as any).env?.VITE_FACEBOOK_APP_SECRET || '';
      if (!fbAppId || !fbAppSecret) {
        throw new Error('Facebook app credentials not configured (VITE_FACEBOOK_APP_ID / VITE_FACEBOOK_APP_SECRET).');
      }

      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: fbAppId,
          client_secret: fbAppSecret,
          redirect_uri: this.FACEBOOK_CONFIG.redirectUri,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error('[OAuth] Direct Facebook token exchange failed', tokenResponse.status, errorBody);
        throw new Error('Failed to exchange Facebook code for token');
      }

      const data = await tokenResponse.json();
      const tokenData: OAuthToken = {
        accessToken: data.access_token,
        // Facebook short-lived tokens do not always include refresh_token
        refreshToken: undefined,
        expiresIn: data.expires_in ?? 60 * 60 * 2, // default 2 hours if missing
        tokenType: data.token_type || 'Bearer',
      };

      this.storeToken('facebook', tokenData);
      return tokenData;
    } catch (error) {
      console.error('[OAuth] Facebook token exchange error:', error);
      throw error;
    }
  }

  // Exchange authorization code for access token (YouTube)
  async exchangeYouTubeCode(code: string, state: string): Promise<OAuthToken> {
    try {
      // First try the backend endpoint if available
      try {
        const response = await fetch('/api/auth/youtube/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            redirectUri: this.YOUTUBE_CONFIG.redirectUri,
          }),
        });

        if (response.ok) {
          const tokenData = await response.json();
          this.storeToken('youtube', tokenData);
          return tokenData;
        } else {
          // Log response for debugging but fall through to direct exchange
          let body: string | undefined;
          try {
            body = await response.text();
          } catch {
            body = undefined;
          }
          console.warn('[OAuth] Backend YouTube token endpoint failed', response.status, body);
        }
      } catch (serverError) {
        console.warn('[OAuth] Backend YouTube token request error; direct Google exchange is disabled for security.', serverError);
      }

      // Fallback disabled: we do not perform direct token exchange from the browser
      // to avoid embedding OAuth client secrets in the frontend bundle.
      throw new Error('YouTube token exchange must be handled by the server. Please check /api/auth/youtube/token configuration.');
    } catch (error) {
      console.error('[OAuth] YouTube token exchange error:', error);
      throw error;
    }
  }

  // Store token securely (encrypted in localStorage)
  private storeToken(platform: 'facebook' | 'youtube', token: OAuthToken): void {
    try {
      const encryptedToken = this.encryptToken(token);
      localStorage.setItem(`${platform}_token`, encryptedToken);
      localStorage.setItem(`${platform}_token_expires`, (Date.now() + (token.expiresIn * 1000)).toString());
    } catch (error) {
      console.error(`[OAuth] Error storing ${platform} token:`, error);
    }
  }

  // Retrieve stored token
  getStoredToken(platform: 'facebook' | 'youtube'): OAuthToken | null {
    try {
      const encryptedToken = localStorage.getItem(`${platform}_token`);
      const expiresAt = localStorage.getItem(`${platform}_token_expires`);

      if (!encryptedToken || !expiresAt) {
        return null;
      }

      // Check if token is expired
      if (Date.now() > parseInt(expiresAt)) {
        this.clearStoredToken(platform);
        return null;
      }

      return this.decryptToken(encryptedToken);
    } catch (error) {
      console.error(`[OAuth] Error retrieving ${platform} token:`, error);
      return null;
    }
  }

  // Clear stored token
  clearStoredToken(platform: 'facebook' | 'youtube'): void {
    localStorage.removeItem(`${platform}_token`);
    localStorage.removeItem(`${platform}_token_expires`);
  }

  // Simple token encryption (base64 + obfuscation)
  private encryptToken(token: OAuthToken): string {
    const tokenString = JSON.stringify(token);
    const encoded = btoa(tokenString);
    // Simple obfuscation - in production, use proper encryption
    return encoded.split('').reverse().join('');
  }

  // Simple token decryption
  private decryptToken(encryptedToken: string): OAuthToken {
    const reversed = encryptedToken.split('').reverse().join('');
    const decoded = atob(reversed);
    return JSON.parse(decoded);
  }

  // Refresh access token (for platforms that support it)
  async refreshToken(platform: 'facebook' | 'youtube'): Promise<OAuthToken | null> {
    const storedToken = this.getStoredToken(platform);
    
    if (!storedToken || !storedToken.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`/api/auth/${platform}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: storedToken.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh ${platform} token`);
      }

      const newToken = await response.json();
      this.storeToken(platform, newToken);
      
      return newToken;
    } catch (error) {
      console.error(`[OAuth] Error refreshing ${platform} token:`, error);
      this.clearStoredToken(platform);
      return null;
    }
  }

  // Check if platform is authenticated
  isAuthenticated(platform: 'facebook' | 'youtube'): boolean {
    return this.getStoredToken(platform) !== null;
  }

  // Revoke access token
  async revokeAccess(platform: 'facebook' | 'youtube'): Promise<void> {
    const token = this.getStoredToken(platform);
    
    if (!token) {
      return;
    }

    try {
      if (platform === 'facebook') {
        await fetch(`https://graph.facebook.com/me/permissions?access_token=${token.accessToken}`, {
          method: 'DELETE'
        });
      } else if (platform === 'youtube') {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token.accessToken}`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error(`[OAuth] Error revoking ${platform} access:`, error);
    } finally {
      this.clearStoredToken(platform);
    }
  }

  // Get platform connection status
  getConnectionStatus(): { facebook: boolean; youtube: boolean } {
    return {
      facebook: this.isAuthenticated('facebook'),
      youtube: this.isAuthenticated('youtube')
    };
  }
}

// Create singleton instance
export const oauthService = new OAuthService();
