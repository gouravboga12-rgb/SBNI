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

      const secret =
        process.env.JWT_ACCESS_SECRET ||
        process.env.JWT_SECRET ||
        'sbni_jwt_access_super_secret_key_2026';
      const decoded = jwt.verify(token as string, secret) as any;

      socket.data.user = {
        userId: decoded.userId || decoded.id,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
      };
      return next();
    } catch (err) {
      console.warn('Socket handshake authentication token invalid or not provided, proceeding with dynamic room registration.');
      return next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUserPayload | undefined = socket.data?.user;

    if (user && user.userId) {
      // 1. Join user-specific private room
      const userRoom = `user_${user.userId}`;
      socket.join(userRoom);
      socket.join(`user_${user.userId.toLowerCase()}`);

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
      console.log(`🔌 [Socket.IO] Connection established: ${socket.id}`);
    }

    // Dynamic join:user listener for mobile and web clients
    socket.on('join:user', (data: { userId?: string; role?: string; token?: string }) => {
      if (data && data.userId) {
        const userRoom = `user_${data.userId}`;
        socket.join(userRoom);
        socket.join(`user_${data.userId.toLowerCase()}`);
        if (data.role) {
          socket.join(`role_${data.role.toLowerCase()}`);
          if (data.role.toUpperCase() === 'ADMIN') socket.join('role_admin');
        }
        console.log(`🔌 [Socket.IO] Client ${socket.id} joined ${userRoom} (Role: ${data.role || 'USER'}) via join:user`);
        socket.emit('joined', { userId: data.userId, status: 'connected', room: userRoom });
      }
    });

    socket.on('join_user', (data: { userId?: string; role?: string; token?: string }) => {
      if (data && data.userId) {
        const userRoom = `user_${data.userId}`;
        socket.join(userRoom);
        socket.join(`user_${data.userId.toLowerCase()}`);
        if (data.role) {
          socket.join(`role_${data.role.toLowerCase()}`);
        }
        console.log(`🔌 [Socket.IO] Client ${socket.id} joined ${userRoom} via join_user`);
        socket.emit('joined', { userId: data.userId, status: 'connected', room: userRoom });
      }
    });

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
