import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pool, query } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter, generalLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import menusRoutes from './routes/menus.js';
import shoppingRoutes from './routes/shopping.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import achievementsRoutes from './routes/achievements.js';
import statsRoutes from './routes/stats.js';
import eventsRoutes from './routes/events.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
  credentials: true
}));

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      ok: true,
      db: true,
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV
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

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/events', eventsRoutes);

app.use(errorHandler);

const port = env.PORT;
app.listen(port, '0.0.0.0', () => {
  logger.info(`TCF-API listening on port ${port}`);
});
