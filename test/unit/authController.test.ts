import request from 'supertest';
import express from 'express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock the SolidOidcService module
const mockSolidOidcService = {
    authenticate: jest.fn(),
    verifyToken: jest.fn(),
    verifyTokenAsync: jest.fn(),
    discoverPodFromWebId: jest.fn()
};

jest.mock('../../src/backend/services/solidOidcService', () => {
    return {
        SolidOidcService: jest.fn().mockImplementation(() => mockSolidOidcService)
    };
});

// Import AFTER mocking
import authRoutes from '../../src/backend/controllers/authController';

describe('Auth Controller Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create Express app
        app = express();
        app.use(json());
        app.use(cookieParser());

        // Set up environment
        process.env.JWT_SECRET = 'test-secret';

        // Set up the routes
        app.use('/api/auth', authRoutes);
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if username or password is missing', async () => {
            // Act & Assert
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser' }); // Missing password

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toMatch(/required/);
        });

        it('should return 401 if authentication fails', async () => {
            // Arrange
            mockSolidOidcService.authenticate.mockResolvedValueOnce({
                success: false,
                error: 'Invalid credentials'
            });

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrong-password'
                });

            // Assert
            expect(mockSolidOidcService.authenticate).toHaveBeenCalled();
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        it('should set cookie and return success on successful login', async () => {
            // Arrange
            mockSolidOidcService.authenticate.mockResolvedValueOnce({
                success: true,
                token: 'jwt-token',
                webid: 'https://testuser.example.org/profile/card#me',
                expiresIn: 3600
            });

            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'correct-password'
                });

            // Assert
            expect(mockSolidOidcService.authenticate).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.webid).toBe('https://testuser.example.org/profile/card#me');
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.headers['set-cookie'][0]).toContain('auth_token=jwt-token');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should clear auth cookie and return success', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/logout');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.headers['set-cookie'][0]).toContain('auth_token=;');
            // Check for Expires header instead of Max-Age since Express may use different formats
            expect(response.headers['set-cookie'][0]).toContain('Expires=');
        });
    });

    describe('GET /api/auth/session', () => {
        it('should return 401 if no token is present', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/session');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('No active session');
        });

        it('should return 401 if token is invalid', async () => {
            // Arrange
            mockSolidOidcService.verifyToken.mockReturnValueOnce({
                valid: false,
                error: 'Invalid token'
            });

            // Act
            const response = await request(app)
                .get('/api/auth/session')
                .set('Authorization', 'Bearer invalid.token');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid session');
        });

        it('should return session info if token is valid', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = jwt.sign({ webid, exp }, 'test-secret');

            mockSolidOidcService.verifyToken.mockReturnValueOnce({
                valid: true,
                webid: webid
            });

            // Act
            const response = await request(app)
                .get('/api/auth/session')
                .set('Cookie', [`auth_token=${token}`]);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.webid).toBe(webid);
            expect(response.body.expiresAt).toBeDefined();
        });
    });
});
