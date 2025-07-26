# Mock Services

This directory contains mock implementations of external services that the Wallet Web App depends on.

## Services

### Mock Solid OIDC Provider (`mock-solid-oidc.js`)
- Provides authentication endpoints
- Issues mock JWT tokens with WebID claims
- Supports user registration and login

### Mock PDS (`mock-pds.js`)
- Simulates Solid Personal Data Store functionality
- Stores credentials and metadata
- Handles access control lists (ACL)

### Mock DID:ION Service (`mock-did-ion.js`)
- Simulates DID:ION network operations
- Handles DID creation and resolution
- Provides signature verification

## Usage

### Start all mocks
```bash
npm run mocks
```

### Start individual mocks
```bash
node test/mocks/mock-solid-oidc.js
node test/mocks/mock-pds.js
node test/mocks/mock-did-ion.js
```

## Configuration

Mock services run on the following ports:
- Solid OIDC: 3004
- PDS: 3003  
- DID:ION: 3002

## Test Data

The `data/` directory contains:
- Sample credentials in JSON-LD and Turtle formats
- Mock access tokens
- Example WebID documents
- Test key pairs
