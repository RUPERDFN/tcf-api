import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { signToken } from '../utils/jwt.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    
    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hash]
    );
    
    const user = result.rows[0];
    
    await query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id]);
    
    const token = signToken({ userId: user.id, email: user.email });
    
    logger.info(`Usuario registrado: ${email}`);
    
    res.status(201).json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const result = await query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = signToken({ userId: user.id, email: user.email });
    
    logger.info(`Usuario login: ${email}`);
    
    res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    next(error);
  }
});

export default router;
