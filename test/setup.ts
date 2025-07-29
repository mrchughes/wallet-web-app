// Global test setup
import 'jest';

// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MOCK_SERVICES = 'true';
process.env.SOLID_OIDC_ISSUER = 'https://oidc.test.org';
process.env.SOLID_OIDC_CLIENT_ID = 'test-client';
process.env.SOLID_OIDC_CLIENT_SECRET = 'test-secret';
process.env.PDS_BASE_URL = 'http://test-pds.org';
process.env.DID_ION_SERVICE_URL = 'http://test-ion-service.org';

// Setup global Jest matchers if needed
expect.extend({
    // Custom matchers can be added here
});

// Global beforeAll
beforeAll(() => {
    console.log('Starting tests...');
});

// Global afterAll
afterAll(() => {
    console.log('Tests completed.');
});