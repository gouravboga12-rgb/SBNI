import { io, Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';

const SOCKET_SERVER_URL = 'https://testcodtech.shop';

let socket: Socket | null = null;

export const initSocket = (userId?: string, role?: string): Socket => {
  if (socket?.connected) {
    if (userId) socket.emit('join:user', { userId, role });
    return socket;
  }

  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[React Native Socket] Connected to Live JustPaisa Gateway');
    if (userId) {
      socket?.emit('join:user', { userId, role });
    }
  });

  socket.on('lead:new', async (data) => {
    console.log('[Socket Event] lead:new received:', data);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Loan Enquiry Received 🔔',
          body: `New enquiry for ₹${data?.amount || ''} from ${data?.shopName || 'a verified vendor'}.`,
          data: { url: 'justpaisa://leads' },
        },
        trigger: null, // trigger immediately
      });
    } catch (e) {}
  });

  socket.on('subscription:updated', async (data) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Subscription Active 🎉',
          body: 'Your JustPaisa membership & contacts are now unlocked!',
          data: { url: 'justpaisa://subscription' },
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
