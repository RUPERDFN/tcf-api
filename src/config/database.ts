import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../../drizzle/schema.js';

const { Pool } = pg;

const connectionConfig = process.env.PGHOST 
  ? {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    }
  : { connectionString: process.env.DATABASE_URL };

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
