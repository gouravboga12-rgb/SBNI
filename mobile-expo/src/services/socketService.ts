import { io, Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_SERVER_URL = 'https://justpaisa.in';

let socket: Socket | null = null;

export const initSocket = (userId?: string, role?: string): Socket => {
  const joinRooms = (sock: Socket, uId?: string, r?: string) => {
    if (uId) {
      sock.emit('join:user', { userId: uId, role: r });
      sock.emit('join_user', { userId: uId, role: r });
      sock.emit('join_room', `user_${uId}`);
      if (r) {
        sock.emit('join_room', `role_${r.toLowerCase()}`);
      }
      console.log(`🔌 [Socket.IO] Dispatched join events for user_${uId} (Role: ${r || 'USER'})`);
    }
  };

  if (socket?.connected) {
    if (userId) joinRooms(socket, userId, role);
    return socket;
  }

  // Retrieve token asynchronously for auth handshake
  AsyncStorage.getItem('sbni_token').then((token) => {
    if (socket && token) {
      (socket.auth as any) = { token };
    }
  }).catch(() => {});

  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 30,
    reconnectionDelay: 1500,
  });

  socket.on('connect', async () => {
    console.log('⚡ [React Native Socket] Connected to Live JustPaisa Gateway:', socket?.id);
    const storedToken = await AsyncStorage.getItem('sbni_token').catch(() => null);
    if (userId) {
      joinRooms(socket!, userId, role);
    }
    if (storedToken && socket) {
      socket.emit('authenticate', { token: storedToken });
    }
  });

  socket.on('joined', (ack) => {
    console.log('✅ [Socket.IO] Room join acknowledged by server:', ack);
  });

  // Generic in-app notification event
  socket.on('notification', async (data) => {
    console.log('🔔 [Socket Event] notification received:', data);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data?.title || 'JustPaisa Notification 🔔',
          body: data?.message || data?.body || 'You have a new update.',
          data: data?.data || data || {},
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Socket notification schedule error:', e);
    }
  });

  // Real-time alert when a new lender registers in vendor radius (50km / 70km)
  socket.on('lender:new_nearby', async (data) => {
    console.log('📍 [Socket Event] lender:new_nearby received:', data);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Financer in Your Area! 🚀',
          body: `${data?.financerName || data?.institutionName || 'A verified business financer'} is now lending within ${data?.radiusKm || data?.distanceKm || 50} km. Tap to inquire.`,
          data: { url: 'justpaisa://financers', lenderId: data?.lenderId },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  socket.on('new_lender_in_radius', async (data) => {
    console.log('📍 [Socket Event] new_lender_in_radius received:', data);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data?.title || 'New Financer in Your Area! 💰',
          body: data?.message || `${data?.institutionName || 'A new financer'} is now lending within ${data?.distanceKm || 50} km of your shop.`,
          data: { url: 'justpaisa://financers', lenderId: data?.lenderId },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  socket.on('lead:new', async (data) => {
    console.log('📝 [Socket Event] lead:new received:', data);
    try {
      const shopOrVendor = data?.vendorSnapshot?.shopName || data?.shopName || data?.vendor?.businessName || 'a verified vendor';
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Loan Enquiry Received 🔔',
          body: `New enquiry from ${shopOrVendor}. Tap to review KYC files and details.`,
          data: { url: 'justpaisa://reports', screen: 'Reports', leadId: data?.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  socket.on('lead:status_updated', async (data) => {
    console.log('📋 [Socket Event] lead:status_updated received:', data);
    try {
      const isAccepted = data?.status === 'Accepted' || data?.status === 'Verified' || data?.status === 'Approved' || data?.status === 'Completed';
      await Notifications.scheduleNotificationAsync({
        content: {
          title: isAccepted ? '🎉 Financing Request Approved!' : `Loan Enquiry ${data?.status || 'Updated'} 📋`,
          body: isAccepted
            ? 'Your financing application has been accepted! Tap to view details and office navigation.'
            : `Your financing application status has been updated to ${data?.status}.`,
          data: { url: 'justpaisa://requests', screen: 'Requests', leadId: data?.leadId },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  socket.on('lead:deleted', async (data) => {
    console.log('🗑️ [Socket Event] lead:deleted received:', data);
  });

  socket.on('subscription:updated', async (data) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Subscription Active 🎉',
          body: 'Your JustPaisa membership & contacts are now unlocked!',
          data: { url: 'justpaisa://subscription' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  socket.on('wallet:updated', async (data) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Wallet Updated 💰',
          body: `Referral reward received! Current balance: ₹${data?.balance || ''}`,
          data: { url: 'justpaisa://referrals' },
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  socket.on('vendor:kyc_updated', async (data) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'KYC Status Update 🛡️',
          body: `Your business verification status: ${data?.status || 'Updated'}.`,
          data: { url: 'justpaisa://profile' },
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {}
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
