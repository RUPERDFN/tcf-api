import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { pool } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import menusRoutes from './routes/menus.routes.js';
import shoppingRoutes from './routes/shopping.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';

const app = express();

app.use(morgan('combined'));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de autenticación' }
});
app.use('/api/auth/', authLimiter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      ok: true,
      db: true,
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      ok: false,
      db: false,
      error: 'Database connection failed'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/gamification', gamificationRoutes);

app.use(errorHandler);

const port = env.PORT;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 TCF-API running on port ${port}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 CORS origins: ${env.CORS_ORIGINS.join(', ')}`);
});
