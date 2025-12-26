import 'dotenv/config';

export const env = {
  PORT: parseInt(process.env.PORT || '5000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').filter(Boolean),
  SKINCHEF_URL: process.env.SKINCHEF_URL || 'http://localhost:3002',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
};

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
