import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { globalErrorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*', // Production ready CORS configuration
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SBNI Money App - Enterprise FinTech Loan Marketplace API',
    timestamp: new Date().toISOString(),
  });
});

// API v1 Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 SBNI Money App API Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
