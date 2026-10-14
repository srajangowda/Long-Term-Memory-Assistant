import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';

// Load environment variables
dotenv.config();

export const app = express();

// Security & Parsing Middlewares
const allowedOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
    if (!origin || origin === allowedOrigin || allowedOrigin === '*') {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev if needed
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Request body size limit
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api', chatRouter);

// Fallback 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[App] Uncaught middleware error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

