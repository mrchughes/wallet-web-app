import { SolidOidcService } from '../../src/backend/services/solidOidcService';

/**
 * Creates a standardized mock for SolidOidcService that can be used across tests
 * @param overrides Optional configuration overrides for the mock methods
 * @returns A mock SolidOidcService instance
 */
export function createMockSolidOidcService(overrides: Partial<MockConfig> = {}) {
    const config = {
        ...defaultMockConfig,
        ...overrides
    };

    const mockService = {
        discoverPodFromWebId: jest.fn().mockImplementation((webid: string) => {
            if (config.shouldFailPodDiscovery) {
                return Promise.reject(new Error('Pod discovery failed'));
            }
            const url = new URL(webid);
            return Promise.resolve(`${url.origin}/storage/`);
        }),
        getWebIdProfile: jest.fn().mockImplementation((webid: string) => {
            if (config.shouldFailProfileRetrieval) {
                return Promise.reject(new Error('Profile retrieval failed'));
            }
            return Promise.resolve({
                name: 'Test User',
                email: 'test@example.com'
            });
        }),
        authenticate: jest.fn().mockImplementation((credentials) => {
            if (config.shouldFailAuthentication) {
                return Promise.reject(new Error('Authentication failed'));
            }
            return Promise.resolve({
                webid: 'https://testuser.example.org/profile/card#me',
                accessToken: 'mock-access-token',
                idToken: 'mock-id-token'
            });
        }),
        validateToken: jest.fn().mockImplementation((token) => {
            if (config.shouldFailTokenValidation) {
                return Promise.resolve(false);
            }
            return Promise.resolve(true);
        }),
        getTokenFromRequest: jest.fn().mockImplementation((req) => {
            return config.tokenValue || 'mock-token';
        })
    };

    return mockService as unknown as jest.Mocked<SolidOidcService>;
}

interface MockConfig {
    shouldFailPodDiscovery: boolean;
    shouldFailProfileRetrieval: boolean;
    shouldFailAuthentication: boolean;
    shouldFailTokenValidation: boolean;
    tokenValue: string | null;
}

const defaultMockConfig: MockConfig = {
    shouldFailPodDiscovery: false,
    shouldFailProfileRetrieval: false,
    shouldFailAuthentication: false,
    shouldFailTokenValidation: false,
    tokenValue: 'mock-token'
};
