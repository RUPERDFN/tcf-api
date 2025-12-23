import type { Express } from "express";
import type { Server } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { pool } from "./db";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { authLimiter, generalLimiter } from "./middleware/rateLimiter";

import authRoutes from "./api/auth";
import profileRoutes from "./api/profile";
import menusRoutes from "./api/menus";
import shoppingRoutes from "./api/shopping";
import subscriptionsRoutes from "./api/subscriptions";
import achievementsRoutes from "./api/achievements";
import statsRoutes from "./api/stats";
import eventsRoutes from "./api/events";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  app.use(compression());
  
  app.use(cors({
    origin: CORS_ORIGINS.length > 0 ? CORS_ORIGINS : true,
    credentials: true
  }));

  // Rate limiting
  app.use('/api/', generalLimiter);
  app.use('/api/auth/', authLimiter);

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        ok: true,
        db: true,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      logger.error({ error }, 'Health check failed');
      res.status(500).json({
        ok: false,
        db: false,
        error: 'Database connection failed'
      });
    }
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/menus', menusRoutes);
  app.use('/api/shopping', shoppingRoutes);
  app.use('/api/subscriptions', subscriptionsRoutes);
  app.use('/api/achievements', achievementsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/events', eventsRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return httpServer;
}
