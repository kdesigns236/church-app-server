import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.churchofgodeveninglight.app',
  appName: 'Church of God Evening Light',
  webDir: 'server/public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Live reload - DISABLED (use production build)
    // url: 'http://192.168.0.101:3000',
    // hostname: '192.168.0.101'
  },
  android: {
    buildOptions: {
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
    },
    LiveUpdate: {
      appId: 'church-app',
      autoDeleteBundles: true,
      readyTimeout: 10000
    }
  }
};

export default config;
