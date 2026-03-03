import { describe, it, expect } from 'vitest';
import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('Health Check Endpoint', () => {
  it('should return health status with timestamp', async () => {
    const response = await request(API_URL).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('services');
  });

  it('should include database service status', async () => {
    const response = await request(API_URL).get('/health');
    
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services.database).toHaveProperty('status');
    expect(response.body.services.database).toHaveProperty('latency_ms');
  });

  it('should include skinchef service status', async () => {
    const response = await request(API_URL).get('/health');
    
    expect(response.body.services).toHaveProperty('skinchef');
    expect(response.body.services.skinchef).toHaveProperty('status');
  });
});
