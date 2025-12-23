export const env = {
  PORT: parseInt(process.env.PORT || '5000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
};

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
