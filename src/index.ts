import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import routes from './routes/index.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

const app = express();
const PORT = 5000;
const startTime = Date.now();

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://thecookflow.com',
  'https://app.thecookflow.com',
  'https://aplicacion.thecookflow.com'
];

const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  return [...defaultOrigins, ...env.CORS_ORIGINS];
};

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));

const isProduction = env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/health', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  const checkDatabase = async (): Promise<{ status: string; latency_ms: number }> => {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      return { status: 'healthy', latency_ms: Date.now() - start };
    } catch {
      return { status: 'unhealthy', latency_ms: Date.now() - start };
    }
  };

  const checkSkinchef = async (): Promise<{ status: string; latency_ms: number }> => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${env.SKINCHEF_URL}/health`, { 
        signal: controller.signal 
      });
      clearTimeout(timeout);
      return { 
        status: response.ok ? 'healthy' : 'degraded', 
        latency_ms: Date.now() - start 
      };
    } catch {
      return { status: 'unhealthy', latency_ms: Date.now() - start };
    }
  };

  const [database, skinchef] = await Promise.all([checkDatabase(), checkSkinchef()]);

  const overallStatus = 
    database.status === 'unhealthy' ? 'unhealthy' :
    skinchef.status === 'unhealthy' ? 'degraded' : 'healthy';

  res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime_seconds: uptimeSeconds,
    services: {
      database,
      skinchef
    }
  });
});

app.use('/api', routes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const ASCII_LOGO = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ████████╗ ██████╗███████╗       █████╗ ██████╗ ██╗       ║
║   ╚══██╔══╝██╔════╝██╔════╝      ██╔══██╗██╔══██╗██║       ║
║      ██║   ██║     █████╗  █████╗███████║██████╔╝██║       ║
║      ██║   ██║     ██╔══╝  ╚════╝██╔══██║██╔═══╝ ██║       ║
║      ██║   ╚██████╗██║           ██║  ██║██║     ██║       ║
║      ╚═╝    ╚═════╝╚═╝           ╚═╝  ╚═╝╚═╝     ╚═╝       ║
║                                                            ║
║            TheCookFlow Backend API v2.0.0                  ║
╚════════════════════════════════════════════════════════════╝`;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(ASCII_LOGO);
  console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📦 Entorno: ${env.NODE_ENV}`);
  console.log(`🔐 Rate limit: ${isProduction ? '100' : '1000'} req/15min`);
  console.log(`💾 Database: ${process.env.PGHOST || 'DATABASE_URL'}`);
  console.log(`🤖 SkinChef: ${env.SKINCHEF_URL}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   GET  /ping   - Load balancer health`);
  console.log(`   GET  /health - Detailed health check`);
  console.log(`   /api/*       - API routes\n`);
});

export default app;
