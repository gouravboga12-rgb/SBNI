import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.justpaisa.app',
  appName: 'Just Paisa',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#003893',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    }
  }
};

export default config;
