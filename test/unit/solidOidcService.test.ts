import { SolidOidcService } from '../../src/backend/services/solidOidcService';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SolidOidcService', () => {
    let solidOidcService: SolidOidcService;
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset mocks before each test
        jest.resetAllMocks();

        // Mock environment variables
        process.env = {
            ...originalEnv,
            MOCK_SERVICES: 'true',
            SOLID_OIDC_ISSUER: 'https://oidc.test.org',
            SOLID_OIDC_CLIENT_ID: 'test-client',
            SOLID_OIDC_CLIENT_SECRET: 'test-secret',
            JWT_SECRET: 'test-jwt-secret'
        };

        solidOidcService = new SolidOidcService();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('authenticate', () => {
        it('should successfully authenticate a valid user in mock mode', async () => {
            // Arrange
            const loginRequest = {
                username: 'testuser',
                password: 'password'
            };

            // Act
            const result = await solidOidcService.authenticate(loginRequest);

            // Assert
            expect(result.success).toBe(true);
            expect(result.token).toBeDefined();
            expect(result.webid).toBeDefined();
            expect(result.expiresIn).toBeGreaterThan(0);
        });

        it('should fail authentication for invalid credentials in mock mode', async () => {
            // Arrange
            const loginRequest = {
                username: 'invalid',
                password: 'wrong'
            };

            // Override the mockAuthenticate method for this test
            const origMockAuth = (solidOidcService as any).mockAuthenticate;
            (solidOidcService as any).mockAuthenticate = jest.fn().mockReturnValue({
                success: false,
                error: 'Invalid credentials'
            });

            // Act
            const result = await solidOidcService.authenticate(loginRequest);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.token).toBeUndefined();

            // Restore original implementation
            (solidOidcService as any).mockAuthenticate = origMockAuth;
        });

        it('should use real OIDC authentication when mock mode is disabled', async () => {
            // Arrange
            process.env.MOCK_SERVICES = 'false';
            solidOidcService = new SolidOidcService();

            const loginRequest = {
                username: 'testuser',
                password: 'password'
            };

            // Mock the token exchange response
            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    access_token: 'test-token',
                    id_token: 'test-id-token',
                    expires_in: 3600
                }
            });

            // Mock the verifyTokenAsync method
            jest.spyOn(solidOidcService, 'verifyTokenAsync').mockResolvedValueOnce({
                webid: 'https://testuser.example.org/profile/card#me',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iss: 'https://oidc.test.org',
                sub: 'test-user',
                aud: 'test-client',
                scope: 'openid profile webid',
                iat: Math.floor(Date.now() / 1000)
            });

            // Act
            const result = await solidOidcService.authenticate(loginRequest);

            // Assert
            expect(mockedAxios.post).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.webid).toBe('https://testuser.example.org/profile/card#me');
        });
    });

    describe('discoverPodFromWebId', () => {
        it('should discover pod URL from WebID', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';

            // Mock the WebID document fetch
            mockedAxios.get.mockResolvedValueOnce({
                data: `
                    @prefix solid: <http://www.w3.org/ns/solid/terms#> .
                    <#me> solid:storage </storage/> .
                `
            });

            // Act
            const podUrl = await solidOidcService.discoverPodFromWebId(webid);

            // Assert
            expect(mockedAxios.get).toHaveBeenCalledWith('https://testuser.example.org/profile/card#me', expect.anything());
            expect(podUrl).toBe('https://testuser.example.org/storage/');
        });

        it('should fall back to WebID base URL if storage predicate not found', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';

            // Mock the WebID document fetch with no storage predicate
            mockedAxios.get.mockResolvedValueOnce({
                data: `
                    @prefix foaf: <http://xmlns.com/foaf/0.1/> .
                    <#me> foaf:name "Test User" .
                `
            });

            // Act
            const podUrl = await solidOidcService.discoverPodFromWebId(webid);

            // Assert
            expect(podUrl).toBe('https://testuser.example.org/storage/');
        });

        it('should handle errors and return a fallback URL', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';

            // Mock a failed request
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

            // Act
            const podUrl = await solidOidcService.discoverPodFromWebId(webid);

            // Assert
            expect(podUrl).toBe('https://testuser.example.org/storage/');
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', async () => {
            // Arrange
            const validToken = jwt.sign(
                { webid: 'https://testuser.example.org/profile/card#me' },
                'test-jwt-secret',
                { expiresIn: '1h' }
            );

            // Act
            const result = solidOidcService.verifyToken(validToken);

            // Assert
            expect(result.valid).toBe(true);
            expect(result.webid).toBe('https://testuser.example.org/profile/card#me');
        });

        it('should reject an invalid token', () => {
            // Arrange
            const invalidToken = 'invalid.token.string';

            // Act
            const result = solidOidcService.verifyToken(invalidToken);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should reject an expired token', () => {
            // Arrange
            const expiredToken = jwt.sign(
                { webid: 'https://testuser.example.org/profile/card#me' },
                'test-jwt-secret',
                { expiresIn: '-10s' } // Already expired
            );

            // Act
            const result = solidOidcService.verifyToken(expiredToken);

            // Assert
            expect(result.valid).toBe(false);
            expect(result.error).toContain('expired');
        });
    });
});