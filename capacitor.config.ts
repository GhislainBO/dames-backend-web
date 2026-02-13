import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dameselite.app',
  appName: 'DAMESELITE',
  webDir: 'dist',

  // Configuration serveur
  server: {
    androidScheme: 'http',
    iosScheme: 'capacitor',
    cleartext: true,
  },

  // Configuration Android
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Mettre à true pour le debug
    buildOptions: {
      keystorePath: 'release-key.keystore',
      keystoreAlias: 'dames-key',
    },
  },

  // Configuration iOS
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    scheme: 'Dames',
  },

  // Plugins
  plugins: {
    // AdMob Configuration
    AdMob: {
      // IDs de test - REMPLACER PAR LES VRAIS IDs EN PRODUCTION
      appIdAndroid: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
      appIdIos: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',

      // Bannière
      bannerAdIdAndroid: 'ca-app-pub-3940256099942544/6300978111', // Test ID
      bannerAdIdIos: 'ca-app-pub-3940256099942544/2934735716', // Test ID

      // Interstitiel
      interstitialAdIdAndroid: 'ca-app-pub-3940256099942544/1033173712', // Test ID
      interstitialAdIdIos: 'ca-app-pub-3940256099942544/4411468910', // Test ID

      // Rewarded
      rewardedAdIdAndroid: 'ca-app-pub-3940256099942544/5224354917', // Test ID
      rewardedAdIdIos: 'ca-app-pub-3940256099942544/1712485313', // Test ID

      // Options
      isTesting: true, // METTRE À FALSE EN PRODUCTION
      npa: false, // Non-Personalized Ads (GDPR)
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#e94560',
      sound: 'notification.wav',
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#e94560',
      iosSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // Status Bar
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
  },
};

export default config;
