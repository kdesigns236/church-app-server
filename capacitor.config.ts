import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.churchofgodeveninglight.app',
  appName: 'Church of God Evening Light',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Live reload - comment out for production builds
    // url: 'http://192.168.0.102:3000',
    // hostname: '192.168.0.102'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1B365D',
      showSpinner: true,
      spinnerColor: '#FFD700'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1B365D',
      overlaysWebView: false
    }
  }
};

export default config;
