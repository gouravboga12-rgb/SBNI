import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  // Use relative URL in production so NGINX proxies /socket.io/ seamlessly
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }
  return 'https://justpaisa.in';
};

/**
 * Initialize or retrieve the persistent Socket.IO connection
 */
export const initSocket = (): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('sbni_token') : null;
  const socketUrl = getSocketUrl();

  if (!socket) {
    socket = io(socketUrl, {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ [Real-Time Socket] Connected successfully to JustPaisa live stream:', socket?.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [Real-Time Socket] Connection error (retrying):', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Real-Time Socket] Disconnected:', reason);
    });
  } else if (!socket.connected) {
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
  }

  return socket;
};

/**
 * Get active socket instance
 */
export const getSocket = (): Socket | null => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

/**
 * Subscribe to a real-time event with automatic cleanup
 */
export const onSocketEvent = <T = any>(event: string, callback: (data: T) => void): (() => void) => {
  const s = getSocket();
  if (!s) return () => {};

  s.on(event, callback);
  return () => {
    s.off(event, callback);
  };
};

/**
 * Disconnect socket cleanly on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 [Real-Time Socket] Cleared on user logout.');
  }
};
