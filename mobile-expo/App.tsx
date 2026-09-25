import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#003893" />
          <AppNavigator />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
