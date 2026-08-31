import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes';
import { globalErrorHandler } from './middlewares/errorHandler';
import { initSocketServer } from './services/socketService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.set('etag', false);

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SBNI Money App - Enterprise FinTech Loan Marketplace API',
    realtime: 'Socket.IO Real-Time Engine Active',
    timestamp: new Date().toISOString(),
  });
});

// Serve uploaded files statically from EC2 disk
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API v1 Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Create HTTP Server & Attach Socket.IO
const httpServer = http.createServer(app);
initSocketServer(httpServer);

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 SBNI Money App API Backend + Real-Time Engine running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, httpServer };
export default app;
