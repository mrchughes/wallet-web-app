import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { json } from 'body-parser';
import authRoutes from '../../src/backend/controllers/authController';
import { SolidOidcService } from '../../src/backend/services/solidOidcService';

// Mock services
jest.mock('../../src/backend/services/solidOidcService');

describe('Auth API Integration Tests', () => {
    let app: express.Application;

    beforeAll(() => {
        // Set up test environment
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.MOCK_SERVICES = 'true';

        // Set up express app
        app = express();
        app.use(json());
        app.use(cookieParser());
        app.use('/api/auth', authRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if username or password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser' }); // Missing password

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 if credentials are invalid', async () => {
            // Mock SolidOidcService to fail authentication
            const mockSolidOidcService = SolidOidcService.prototype as jest.Mocked<SolidOidcService>;
            mockSolidOidcService.authenticate.mockResolvedValueOnce({
                success: false,
                error: 'Invalid credentials'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'wrong-password' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return success and set cookie for valid credentials', async () => {
            // Mock SolidOidcService to succeed authentication
            const mockSolidOidcService = SolidOidcService.prototype as jest.Mocked<SolidOidcService>;
            mockSolidOidcService.authenticate.mockResolvedValueOnce({
                success: true,
                token: 'test-jwt-token',
                webid: 'https://testuser.example.org/profile/card#me',
                expiresIn: 3600
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'correct-password' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.webid).toBe('https://testuser.example.org/profile/card#me');
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.headers['set-cookie'][0]).toContain('auth_token');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should clear the auth cookie', async () => {
            const response = await request(app)
                .post('/api/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.headers['set-cookie'][0]).toContain('auth_token=;');
        });
    });

    describe('GET /api/auth/session', () => {
        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/api/auth/session');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('No active session');
        });

        it('should return session info for valid token', async () => {
            // Create a valid token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { webid: 'https://testuser.example.org/profile/card#me' },
                'test-jwt-secret',
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/auth/session')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.webid).toBe('https://testuser.example.org/profile/card#me');
            expect(response.body.expiresAt).toBeDefined();
        });
    });
});
