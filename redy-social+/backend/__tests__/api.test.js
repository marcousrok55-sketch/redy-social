import request from 'supertest';

// Mock the database module
jest.mock('../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

import app from '../src/index.js';
import { query } from '../config/database.js';

describe('Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      query.mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ 
          rows: [{ id: 'user-1', email: 'test@test.com', name: 'Test', role: 'user' }]
        }) // Create user
        .mockResolvedValueOnce({ 
          rows: [{ id: 'workspace-1', name: "Test's Workspace", plan: 'free' }]
        }); // Create workspace

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'password123', name: 'Test' });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'exists@test.com', password: 'password123', name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = '$2a$10$test'; // bcrypt hash of 'password123'
      
      query.mockResolvedValueOnce({ 
        rows: [{ id: 'user-1', email: 'test@test.com', password_hash: hashedPassword, name: 'Test', role: 'user' }]
      }) // Find user
        .mockResolvedValueOnce({ 
          rows: [{ id: 'workspace-1', name: 'Test Workspace', plan: 'free' }]
        }); // Get workspace

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});

describe('Posts Routes', () => {
  it('should require authentication for posts list', async () => {
    const response = await request(app).get('/api/posts');
    // Should redirect or return 401 without token
    expect([401, 403, 302]).toContain(response.status);
  });
});
