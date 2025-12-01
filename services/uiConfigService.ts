/**
 * UI Configuration Service
 * Fetches dynamic UI configurations from the server
 * Allows updating app theme, features, and layouts without rebuilding
 */

interface ThemeConfig {
  version: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    success: string;
    error: string;
    warning: string;
  };
  fonts: {
    heading: string;
    body: string;
    sizes: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}

interface FeaturesConfig {
  version: string;
  features: Record<string, boolean>;
  limits: {
    maxVideoUploadMB: number;
    maxImageUploadMB: number;
    maxMessageLength: number;
    maxParticipantsInCall: number;
  };
  experimental: Record<string, boolean>;
}

interface HomeLayoutConfig {
  version: string;
  sections: Array<{
    type: string;
    title?: string;
    subtitle?: string;
    image?: string;
    action?: any;
    items?: any[];
    limit?: number;
    [key: string]: any;
  }>;
  bottomNav: Array<{
    icon: string;
    label: string;
    route: string;
  }>;
}

interface BannerConfig {
  version: string;
  banners: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    dismissible: boolean;
    priority: number;
    startDate: string;
    endDate: string;
    action?: {
      label: string;
      route: string;
    };
  }>;
}

interface NavigationConfig {
  version: string;
  header: {
    logo: string;
    showSearch: boolean;
    showNotifications: boolean;
    showProfile: boolean;
  };
  mainMenu: Array<{
    label: string;
    route: string;
    icon: string;
  }>;
  footer: {
    showSocialLinks: boolean;
    socialLinks: Array<{
      platform: string;
      url: string;
    }>;
    copyright: string;
  };
}

class UIConfigService {
  private apiUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.cache = new Map();
  }

  /**
   * Generic fetch with caching and offline fallback
   */
  private async fetchConfig<T>(endpoint: string, cacheKey: string, defaultValue: T): Promise<T> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log(`[UIConfig] Using cached ${cacheKey}`);
      return cached.data;
    }

    // Try to fetch from server
    try {
      console.log(`[UIConfig] Fetching ${endpoint}...`);
      const response = await fetch(`${this.apiUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Update cache
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      // Save to localStorage for offline use
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      console.log(`[UIConfig] ✅ Fetched ${cacheKey}`);
      return data;
    } catch (error) {
      console.error(`[UIConfig] Error fetching ${cacheKey}:`, error);
      
      // Try localStorage fallback
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        console.log(`[UIConfig] Using stored ${cacheKey}`);
        return JSON.parse(stored);
      }
      
      // Return default value
      console.log(`[UIConfig] Using default ${cacheKey}`);
      return defaultValue;
    }
  }

  /**
   * Get theme configuration
   */
  async getTheme(): Promise<ThemeConfig> {
    const defaultTheme: ThemeConfig = {
      version: "1.0",
      colors: {
        primary: "#1a1a2e",
        secondary: "#d4af37",
        accent: "#16213e",
        background: "#0f3460",
        text: "#ffffff",
        textSecondary: "#b0b0b0",
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b"
      },
      fonts: {
        heading: "Playfair Display",
        body: "Inter",
        sizes: {
          xs: "12px",
          sm: "14px",
          base: "16px",
          lg: "18px",
          xl: "20px",
          "2xl": "24px",
          "3xl": "30px"
        }
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px"
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        full: "9999px"
      }
    };

    return this.fetchConfig('/ui/theme', 'ui-theme', defaultTheme);
  }

  /**
   * Get feature flags
   */
  async getFeatures(): Promise<FeaturesConfig> {
    const defaultFeatures: FeaturesConfig = {
      version: "1.0",
      features: {
        videoCall: true,
        liveStreaming: true,
        donations: true,
        chatEnabled: true,
        aiPastor: true,
        darkMode: true,
        notifications: true,
        offlineMode: true,
        socialSharing: true,
        comments: true,
        likes: true,
        prayerRequests: true,
        events: true,
        bibleStudy: true,
        giving: true
      },
      limits: {
        maxVideoUploadMB: 100,
        maxImageUploadMB: 10,
        maxMessageLength: 5000,
        maxParticipantsInCall: 10
      },
      experimental: {
        newVideoPlayer: false,
        enhancedSearch: false,
        voiceMessages: true
      }
    };

    return this.fetchConfig('/ui/features', 'ui-features', defaultFeatures);
  }

  /**
   * Get home layout configuration
   */
  async getHomeLayout(): Promise<HomeLayoutConfig> {
    const defaultLayout: HomeLayoutConfig = {
      version: "1.0",
      sections: [],
      bottomNav: [
        { icon: "home", label: "Home", route: "/" },
        { icon: "video", label: "Sermons", route: "/sermons" },
        { icon: "calendar", label: "Events", route: "/events" },
        { icon: "chat", label: "Church Community", route: "/chat" },
        { icon: "user", label: "Profile", route: "/profile" }
      ]
    };

    return this.fetchConfig('/ui/home-layout', 'ui-home-layout', defaultLayout);
  }

  /**
   * Get banner messages
   */
  async getBanners(): Promise<BannerConfig> {
    const defaultBanners: BannerConfig = {
      version: "1.0",
      banners: []
    };

    return this.fetchConfig('/ui/banners', 'ui-banners', defaultBanners);
  }

  /**
   * Get navigation configuration
   */
  async getNavigation(): Promise<NavigationConfig> {
    const defaultNav: NavigationConfig = {
      version: "1.0",
      header: {
        logo: "",
        showSearch: true,
        showNotifications: true,
        showProfile: true
      },
      mainMenu: [
        { label: "Home", route: "/", icon: "home" },
        { label: "Sermons", route: "/sermons", icon: "video" },
        { label: "Events", route: "/events", icon: "calendar" },
        { label: "Church Community", route: "/chat", icon: "chat" }
      ],
      footer: {
        showSocialLinks: false,
        socialLinks: [],
        copyright: "© 2024 Church of God Evening Light"
      }
    };

    return this.fetchConfig('/ui/navigation', 'ui-navigation', defaultNav);
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureName: string): Promise<boolean> {
    const features = await this.getFeatures();
    return features.features[featureName] ?? false;
  }

  /**
   * Get a feature limit value
   */
  async getLimit(limitName: keyof FeaturesConfig['limits']): Promise<number> {
    const features = await this.getFeatures();
    return features.limits[limitName];
  }

  /**
   * Clear all cached configurations
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[UIConfig] Cache cleared');
  }

  /**
   * Force refresh all configurations
   */
  async refreshAll(): Promise<void> {
    this.clearCache();
    await Promise.all([
      this.getTheme(),
      this.getFeatures(),
      this.getHomeLayout(),
      this.getBanners(),
      this.getNavigation()
    ]);
    console.log('[UIConfig] All configurations refreshed');
  }
}

// Create singleton instance
const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://church-app-server.onrender.com/api';
export const uiConfigService = new UIConfigService(apiUrl);

export type {
  ThemeConfig,
  FeaturesConfig,
  HomeLayoutConfig,
  BannerConfig,
  NavigationConfig
};
