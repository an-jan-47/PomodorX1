
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5d079f51e5944814ac39b8445ae49d21',
  appName: 'flow-focus-tracker',
  webDir: 'dist',
  server: {
    url: 'https://5d079f51-e594-4814-ac39-b8445ae49d21.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#1f1f1f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
