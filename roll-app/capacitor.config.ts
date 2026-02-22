import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'photos.roll.app',
  appName: 'Roll',
  webDir: 'out',
  server: {
    // Use localhost during development
    ...(process.env.NODE_ENV === 'development'
      ? { url: 'http://localhost:3000', cleartext: true }
      : {}),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF7F2',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FAF7F2',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'Roll',
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#FAF7F2',
  },
};

export default config;
