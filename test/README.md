# Test Coverage for Wallet Web App

This directory contains test files for the Wallet Web App backend services and components.

## Test Structure

- `test/unit/`: Contains unit tests for individual components
- `test/integration/`: Contains integration tests that verify multiple components working together
- `test/mocks/`: Contains mock implementations for testing

## Test Coverage

| Component | Status | Notes |
|-----------|--------|-------|
| authController | ✅ Passing | All test cases implemented and passing |
| authMiddleware | ✅ Passing | All test cases implemented and passing |
| solidOidcService | ✅ Passing | All test cases implemented and passing |
| pdsService | ✅ Passing | All test cases implemented and passing |
| didIonService | ⚠️ Skipped | Tests skipped due to crypto API compatibility issues |
| integration/auth | ✅ Passing | All integration tests passing |

## Known Issues

### didIonService Tests

The tests for the `didIonService` component are currently skipped. This is due to compatibility issues with the Node.js crypto API. The service uses crypto operations that are difficult to mock correctly:

1. The original implementation used deprecated methods like `createCipher` and `createDecipher`
2. These have been updated to `createCipheriv` and `createDecipheriv` in the implementation
3. Proper mocking of these crypto operations requires complex setup

**To properly implement these tests in the future:**

1. Use modern crypto API mocks
2. Properly mock `createCipheriv`, `createDecipheriv`, and other crypto operations
3. Ensure all test cases verify both success and error paths
4. Consider refactoring the service to use more testable crypto patterns

## Running Tests

To run all tests:
```bash
npm test
```

To run tests with code coverage:
```bash
npm test -- --coverage
```

To run specific tests:
```bash
npm test -- test/unit/pdsService.test.ts
```
