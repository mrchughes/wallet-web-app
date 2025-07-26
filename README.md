# Wallet Web App

A web application for managing decentralized identities and verifiable credentials in the Solid ecosystem.

## Overview

The Wallet Web App is a key component of the Solid VC Microservices Prototype. It allows users to:

- **Authentication** - Authenticate via Solid OIDC
- **DID:ION Management** - Create and manage decentralized identities
- **Credential Storage** - Securely store verifiable credentials in Solid PDS
- **Permission Control** - Manage access permissions for credentials
- **Digital Signing** - Sign data using DID:ION private keys
- **Credential Visualization** - View credentials in JSON-LD and Turtle formats

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+

### Installation
```bash
# Clone and install
git clone <repository-url>
cd wallet-web-app
chmod +x scripts/*.sh
./scripts/install.sh
```

### Development
```bash
# Start all services (backend, frontend, mocks)
npm run dev

# Or use the convenience script
./scripts/run.sh
```

### Testing
```bash
# Run all tests
./scripts/test.sh

# Or individual test suites
npm test                # Unit tests
npm run test:integration # Integration tests
npm run postman         # Postman API tests
```

### Production
```bash
# Build and start
npm run build
npm start

# Or use Docker
docker-compose up --build
```

## Repository Structure

```
wallet-web-app/
├── docs/                       # OpenAPI specs and documentation
├── scripts/                    # Helper scripts (install, run, test)
├── src/
│   ├── backend/               # Node.js/Express API server
│   │   ├── controllers/       # API route handlers
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Express middleware
│   │   └── app.ts            # Main application
│   ├── frontend/              # React TypeScript application
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── contexts/      # React contexts
│   │   │   └── services/      # API service layer
│   │   └── package.json
│   └── shared/                # Shared TypeScript types
└── test/
    ├── mocks/                 # Mock external services
    ├── postman/               # Postman collections
    └── unit/                  # Unit tests
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate using Solid OIDC
- `GET /api/auth/session` - Check current session
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and clear session

### DID Management
- `POST /api/did/create` - Create new DID:ION identity
- `POST /api/did/sign` - Sign data with DID:ION
- `GET /api/did/list` - List user's DID identities
- `GET /api/did/resolve/:did` - Resolve DID document

### PDS Operations
- `GET /api/pds/credentials` - List all credentials from PDS
- `GET /api/pds/credentials/:id` - Get specific credential
- `GET /api/pds/permissions` - Get current permissions
- `POST /api/pds/permissions` - Set permissions for credential
- `GET /api/pds/pod-info` - Get pod information

## Key Features

### Solid OIDC Integration
- Seamless authentication with Solid identity providers
- WebID-based user identification
- Secure token management with automatic refresh

### DID:ION Identity Management
- Create cryptographic key pairs (RSA/Ed25519)
- Register DID:ION identities with mock ION service
- Secure private key storage with passphrase encryption
- Digital signing capabilities

### Verifiable Credentials
- Support for W3C Verifiable Credentials standard
- Dual format support (JSON-LD and Turtle)
- Credential metadata and indexing
- Verification status tracking

### Access Control
- Web Access Control (WAC) implementation
- Granular permission management (read/write/append/control)
- Service registration and domain allowlisting
- Audit logging for access events

### User Interface
- GOV.UK Design System compliance
- WCAG 2.1 AA accessibility standards
- Responsive design for mobile and desktop
- Real-time credential updates

## Mock Services

The project includes mock implementations of external dependencies:

- **Mock Solid OIDC** (port 3004) - Authentication provider
- **Mock PDS** (port 3003) - Personal Data Store
- **Mock DID:ION** (port 3002) - DID:ION network service

Start all mocks:
```bash
npm run mocks
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Postman API Tests
```bash
npm run postman
```

### Test Coverage
```bash
npm run test:coverage
```

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Server
NODE_ENV=development
PORT=3001

# Solid OIDC
SOLID_OIDC_ISSUER=https://oidc.solid.gov.uk
SOLID_OIDC_CLIENT_ID=wallet-web-app
SOLID_OIDC_CLIENT_SECRET=your-secret

# Security
JWT_SECRET=your-jwt-secret
SESSION_TIMEOUT=1800

# Development
MOCK_SERVICES=true
```

### Development Credentials
For testing with mock services:
- Username: `testuser`
- Password: `password`

## Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker build -t wallet-web-app .
docker run -p 3000:3000 -p 3001:3001 wallet-web-app
```

## Integration Points

This service integrates with:

1. **Solid OIDC Provider** - User authentication and authorization
2. **Solid Personal Data Store (PDS)** - Credential and data storage
3. **DID:ION Service** - Decentralized identity operations
4. **PIP VC Service** - Benefit credential issuance
5. **EON VC Service** - Discount credential consumption

## Development Guidelines

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Comprehensive error handling
- Input validation and sanitization

### Security
- Passphrase-based key encryption
- Secure token storage (httpOnly cookies)
- CORS protection
- Rate limiting
- Helmet security headers

### Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000-3004 are available
2. **Mock services not starting**: Check Node.js version (18+ required)
3. **Frontend build fails**: Run `cd src/frontend && npm install`
4. **Authentication fails**: Verify mock OIDC service is running

### Logs
- Backend logs: Console output
- Frontend logs: Browser developer console
- Mock service logs: Individual service console output

## Contributing

1. Follow the existing code structure and patterns
2. Ensure all tests pass before submitting
3. Update documentation for new features
4. Follow GOV.UK Design System for UI changes

## License

This project is part of the Solid VC Microservices Prototype.

## Team Rules

- **No TODOs or placeholders** - All code must be complete and functional
- **Clean repository structure** - Organize files in appropriate directories
- **Comprehensive testing** - Include unit, integration, and API tests
- **Documentation** - Keep README and API docs up to date
- **Security first** - Never commit secrets or credentials
- **Accessibility** - All UI must meet WCAG 2.1 AA standards
