import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { savePushTokenApi, testPushNotificationApi } from './api';

export const EAS_PROJECT_ID = 'cc531adf-480e-4deb-8f5d-bfa22156dcdb';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const getEasProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    EAS_PROJECT_ID
  );
};

/**
 * Configure Android notification channels
 */
export async function configureNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'JustPaisa Alerts & Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003893',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('leads', {
        name: 'JustPaisa Commercial Inquiries',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10b981',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    } catch (e) {
      console.warn('Could not set notification channels:', e);
    }
  }
}

/**
 * Register device for Expo Push Notifications and sync token with AWS backend
 */
export async function registerForPushNotificationsAsync(showPrompt = false): Promise<string | undefined> {
  let token: string | undefined;

  await configureNotificationChannels();

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted:', finalStatus);
      if (showPrompt) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notification permissions in your Android Settings to receive instant commercial inquiries and business lead alerts.'
        );
      }
      return undefined;
    }

    // Attempt to obtain Expo Push Token
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: getEasProjectId(),
      });
      token = pushTokenData.data;
    } catch (tokenErr: any) {
      console.warn('Failed with EAS project ID, trying default projectId:', tokenErr?.message);
      try {
        const fallbackData = await Notifications.getExpoPushTokenAsync();
        token = fallbackData.data;
      } catch (fallbackErr: any) {
        console.warn('Expo token acquisition fallback failed:', fallbackErr?.message);
      }
    }

    if (token) {
      console.log('📱 [Expo Push Token Registered]:', token);
      await AsyncStorage.setItem('sbni_push_token', token);

      // Check if user is logged in and sync with backend
      const authToken = await AsyncStorage.getItem('sbni_token');
      if (authToken) {
        const res = await savePushTokenApi(token);
        if (res?.success) {
          console.log('✅ Push token successfully synced with AWS server for current user.');
        }
      }
    }

    return token;
  } catch (err: any) {
    console.error('❌ Error during registerForPushNotificationsAsync:', err?.message || err);
    return undefined;
  }
}

/**
 * Dispatch an immediate in-app local notification banner
 */
export async function sendLocalNotification(title: string, body: string, data: Record<string, any> = {}) {
  try {
    await configureNotificationChannels();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // deliver immediately
    });
  } catch (e: any) {
    console.warn('Could not schedule local notification:', e?.message);
  }
}

/**
 * Test push notification pipeline end-to-end (calls AWS backend to send push via Expo)
 */
export async function triggerTestPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    let token: string | null | undefined = await AsyncStorage.getItem('sbni_push_token');
    if (!token) {
      token = await registerForPushNotificationsAsync(true);
    }

    if (!token) {
      return {
        success: false,
        message: 'Could not obtain push token. Please ensure notifications are allowed in Android Settings.',
      };
    }

    const res = await testPushNotificationApi(token);

    // Also trigger local banner for immediate user feedback
    sendLocalNotification(
      '🔔 JustPaisa Notification Test',
      '🎉 Push notifications are active and working on your device!'
    );

    return res;
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Error triggering test notification.',
    };
  }
}

/**
 * Setup notification listener subscriptions for foreground & interaction events
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 [Foreground Notification Received]:', notification.request.content.title);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 [Notification Pressed]:', response.notification.request.content.data);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
