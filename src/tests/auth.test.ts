import { describe, it, expect } from 'vitest';
import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('Auth Endpoints', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  it('should reject registration without required fields', async () => {
    const response = await request(API_URL)
      .post('/api/auth/register')
      .send({});
    
    expect(response.status).toBe(400);
  });

  it('should reject registration with invalid email', async () => {
    const response = await request(API_URL)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: testPassword,
        name: 'Test User'
      });
    
    expect(response.status).toBe(400);
  });

  it('should reject login with non-existent user', async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(401);
  });

  it('should reject /me without token', async () => {
    const response = await request(API_URL)
      .get('/api/auth/me');
    
    expect(response.status).toBe(401);
  });

  it('should reject /me with invalid token', async () => {
    const response = await request(API_URL)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
});
