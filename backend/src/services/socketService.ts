import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

interface SocketUserPayload {
  userId: string;
  role: string;
  email?: string;
  name?: string;
}

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // Socket Authentication & Room Joining Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        // Allow unauthenticated connection with guest scope
        return next();
      }

      const secret = process.env.JWT_SECRET || 'sbni_jwt_super_secret_production_key_2026';
      const decoded = jwt.verify(token as string, secret) as SocketUserPayload;

      socket.data.user = decoded;
      return next();
    } catch (err) {
      console.warn('Socket authentication token invalid or expired, proceeding as guest.');
      return next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUserPayload | undefined = socket.data?.user;

    if (user && user.userId) {
      // 1. Join user-specific private room
      const userRoom = `user_${user.userId}`;
      socket.join(userRoom);

      // 2. Join role-specific room
      if (user.role) {
        const roleRoom = `role_${user.role.toLowerCase()}`;
        socket.join(roleRoom);

        if (user.role.toUpperCase() === 'ADMIN') {
          socket.join('role_admin');
        }
      }

      console.log(`🔌 [Socket.IO] Authenticated connection: ${user.email || user.userId} (${user.role}) joined ${userRoom}`);
    } else {
      console.log(`🔌 [Socket.IO] Guest connection established: ${socket.id}`);
    }

    // Allow client to join custom room dynamically if needed
    socket.on('join_room', (roomName: string) => {
      if (typeof roomName === 'string' && roomName.trim()) {
        socket.join(roomName);
      }
    });

    socket.on('leave_room', (roomName: string) => {
      if (typeof roomName === 'string' && roomName.trim()) {
        socket.leave(roomName);
      }
    });

    socket.on('disconnect', (reason) => {
      // Log subtle disconnect
    });
  });

  console.log('⚡ [Socket.IO] Real-time engine initialized successfully.');
  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Emit event to a specific user's private socket room
 */
export const emitToUser = (userId: string, event: string, payload: any) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
};

/**
 * Emit event to all users in a specific role (e.g. 'VENDOR', 'LENDER', 'ADMIN')
 */
export const emitToRole = (role: 'VENDOR' | 'LENDER' | 'ADMIN' | string, event: string, payload: any) => {
  if (!io) return;
  io.to(`role_${role.toLowerCase()}`).emit(event, payload);
};

/**
 * Emit event to all Admins
 */
export const emitToAdmin = (event: string, payload: any) => {
  if (!io) return;
  io.to('role_admin').emit(event, payload);
};

/**
 * Emit event globally to all connected clients
 */
export const emitGlobal = (event: string, payload: any) => {
  if (!io) return;
  io.emit(event, payload);
};
