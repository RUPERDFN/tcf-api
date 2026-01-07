import { describe, it, expect } from 'vitest';
import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('API Basic Endpoints', () => {
  it('GET /ping should return pong', async () => {
    const response = await request(API_URL).get('/ping');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('pong');
  });

  it('GET /nonexistent should return 404', async () => {
    const response = await request(API_URL).get('/this-route-does-not-exist-12345');
    
    expect(response.status).toBe(404);
  });

  it('Protected route without token should return 401', async () => {
    const response = await request(API_URL).get('/api/users/profile');
    
    expect(response.status).toBe(401);
  });

  it('POST with invalid JSON should return 400', async () => {
    const response = await request(API_URL)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    
    expect(response.status).toBe(400);
  });
});
