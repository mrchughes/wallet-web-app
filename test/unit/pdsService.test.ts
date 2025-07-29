import { PdsService } from '../../src/backend/services/pdsService';
import axios from 'axios';
import { SetPermissionsRequest, VerifiableCredential, Proof } from '../../src/shared/types/credentials';
import { createMockSolidOidcService } from '../mocks/solidOidcService.mock';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mocked PdsService
let pdsService: PdsService;
let mockSolidOidcService: any;

describe('PdsService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup environment
        process.env = {
            ...originalEnv,
            PDS_BASE_URL: 'http://test-pds.org',
            MOCK_SERVICES: 'false' // Disable mock services for tests
        };

        // Set up the mock implementation for SolidOidcService
        mockSolidOidcService = createMockSolidOidcService();
        mockSolidOidcService.discoverPodFromWebId.mockResolvedValue('http://test-pod.org/');

        // Create service to test
        pdsService = new PdsService(mockSolidOidcService);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getCredentials', () => {
        it('should retrieve credentials from PDS', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';

            // Mock successful response
            mockedAxios.get.mockResolvedValueOnce({
                data: '@prefix ldp: <http://www.w3.org/ns/ldp#> .\n<index.ttl> a ldp:Container .',
                headers: {
                    'content-type': 'text/turtle'
                }
            });

            // Act
            const credentials = await pdsService.getCredentials(webid);

            // Assert
            expect(mockSolidOidcService.discoverPodFromWebId).toHaveBeenCalledWith(webid);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://test-pod.org/credentials/index.ttl',
                expect.anything()
            );
            expect(credentials).toEqual([]);
        });

        it('should handle pod discovery failure', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';
            
            // Mock pod discovery failure
            mockSolidOidcService.discoverPodFromWebId.mockRejectedValueOnce(new Error('Pod discovery failed'));

            // Act
            const credentials = await pdsService.getCredentials(webid);

            // Assert
            expect(credentials).toEqual([]);
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });
    });

    describe('getCredential', () => {
        it('should retrieve a credential by ID', async () => {
            // Arrange
            const credentialId = 'credential123';
            const webid = 'https://testuser.example.org/profile/card#me';
            const mockCredential: VerifiableCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'credential123',
                type: ['VerifiableCredential'],
                issuer: 'https://issuer.example.org',
                issuanceDate: '2023-01-01T00:00:00Z',
                credentialSubject: {
                    id: webid,
                    name: 'Test Credential'
                },
                proof: {
                    type: 'Ed25519Signature2018',
                    created: '2023-01-01T00:00:00Z',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'https://issuer.example.org/keys/1',
                    jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...'
                }
            };

            // Mock successful response
            mockedAxios.get.mockResolvedValueOnce({
                data: JSON.stringify(mockCredential),
                headers: {
                    'content-type': 'application/json'
                }
            });

            // Act
            const credential = await pdsService.getCredential(credentialId, webid);

            // Assert
            expect(mockSolidOidcService.discoverPodFromWebId).toHaveBeenCalledWith(webid);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://test-pod.org/credentials/credential123',
                expect.anything()
            );
            expect(credential).toEqual(mockCredential);
        });

        it('should handle credential not found', async () => {
            // Arrange
            const credentialId = 'nonexistent';
            const webid = 'https://testuser.example.org/profile/card#me';

            // Mock 404 response
            mockedAxios.get.mockRejectedValueOnce({
                response: {
                    status: 404
                }
            });

            // Act
            const credential = await pdsService.getCredential(credentialId, webid);

            // Assert
            expect(mockSolidOidcService.discoverPodFromWebId).toHaveBeenCalledWith(webid);
            expect(credential).toBeNull();
        });
    });

    describe('storeCredential', () => {
        it('should store a credential in the PDS', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';
            const credential: VerifiableCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'credential123',
                type: ['VerifiableCredential'],
                issuer: 'https://issuer.example.org',
                issuanceDate: '2023-01-01T00:00:00Z',
                credentialSubject: {
                    id: webid,
                    name: 'Test Credential'
                },
                proof: {
                    type: 'Ed25519Signature2018',
                    created: '2023-01-01T00:00:00Z',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'https://issuer.example.org/keys/1',
                    jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...'
                }
            };

            // Mock successful responses
            mockedAxios.put.mockResolvedValueOnce({});
            mockedAxios.get.mockResolvedValueOnce({
                data: '@prefix ldp: <http://www.w3.org/ns/ldp#> .\n<index.ttl> a ldp:Container .',
                headers: {
                    'content-type': 'text/turtle'
                }
            });
            mockedAxios.put.mockResolvedValueOnce({});

            // Act
            const result = await pdsService.storeCredential(credential, webid);

            // Assert
            expect(mockSolidOidcService.discoverPodFromWebId).toHaveBeenCalledWith(webid);
            expect(mockedAxios.put).toHaveBeenCalledWith(
                'http://test-pod.org/credentials/credential123',
                JSON.stringify(credential, null, 2),
                expect.anything()
            );
            expect(result).toBe(true);
        });

        it('should handle storage errors', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';
            const credential: VerifiableCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'credential123',
                type: ['VerifiableCredential'],
                issuer: 'https://issuer.example.org',
                issuanceDate: '2023-01-01T00:00:00Z',
                credentialSubject: {
                    id: webid
                },
                proof: {
                    type: 'Ed25519Signature2018',
                    created: '2023-01-01T00:00:00Z',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'https://issuer.example.org/keys/1',
                    jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...'
                }
            };

            // Mock network error
            mockedAxios.put.mockRejectedValueOnce(new Error('Network error'));

            // Act
            const result = await pdsService.storeCredential(credential, webid);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('setPermissions', () => {
        it('should set permissions for a credential', async () => {
            // Arrange
            const webid = 'https://testuser.example.org/profile/card#me';
            const request: SetPermissionsRequest = {
                credentialId: 'credential123',
                accessors: ['https://friend.example.org/profile/card#me'],
                actions: ['read']
            };

            // Mock successful response
            mockedAxios.put.mockResolvedValueOnce({});

            // Act
            const result = await pdsService.setPermissions(request, webid);

            // Assert
            expect(mockSolidOidcService.discoverPodFromWebId).toHaveBeenCalledWith(webid);
            expect(mockedAxios.put).toHaveBeenCalledWith(
                'http://test-pod.org/credentials/credential123.acl',
                expect.stringContaining('mode acl:Read'),
                expect.anything()
            );
            expect(result).toBe(true);
        });
    });
});
