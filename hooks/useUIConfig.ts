/**
 * React Hook for UI Configuration
 * Easy access to server-driven UI configs in components
 */

import { useState, useEffect } from 'react';
import { uiConfigService, ThemeConfig, FeaturesConfig, HomeLayoutConfig, BannerConfig, NavigationConfig } from '../services/uiConfigService';

/**
 * Hook to get theme configuration
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uiConfigService.getTheme()
      .then(setTheme)
      .finally(() => setLoading(false));
  }, []);

  return { theme, loading };
}

/**
 * Hook to get feature flags
 */
export function useFeatures() {
  const [features, setFeatures] = useState<FeaturesConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uiConfigService.getFeatures()
      .then(setFeatures)
      .finally(() => setLoading(false));
  }, []);

  return { features, loading };
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(featureName: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    uiConfigService.isFeatureEnabled(featureName)
      .then(setEnabled);
  }, [featureName]);

  return enabled;
}

/**
 * Hook to get home layout configuration
 */
export function useHomeLayout() {
  const [layout, setLayout] = useState<HomeLayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uiConfigService.getHomeLayout()
      .then(setLayout)
      .finally(() => setLoading(false));
  }, []);

  return { layout, loading };
}

/**
 * Hook to get banner messages
 */
export function useBanners() {
  const [banners, setBanners] = useState<BannerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uiConfigService.getBanners()
      .then(setBanners)
      .finally(() => setLoading(false));
  }, []);

  return { banners, loading };
}

/**
 * Hook to get navigation configuration
 */
export function useNavigation() {
  const [navigation, setNavigation] = useState<NavigationConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uiConfigService.getNavigation()
      .then(setNavigation)
      .finally(() => setLoading(false));
  }, []);

  return { navigation, loading };
}

/**
 * Hook to get all UI configurations at once
 */
export function useUIConfig() {
  const theme = useTheme();
  const features = useFeatures();
  const layout = useHomeLayout();
  const banners = useBanners();
  const navigation = useNavigation();

  const loading = theme.loading || features.loading || layout.loading || banners.loading || navigation.loading;

  return {
    theme: theme.theme,
    features: features.features,
    layout: layout.layout,
    banners: banners.banners,
    navigation: navigation.navigation,
    loading
  };
}
