const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user database
const users = new Map([
    ['testuser', { id: 'user-123', password: 'password', webid: 'https://user.example.org/profile/card#me' }],
    ['admin', { id: 'admin-456', password: 'admin', webid: 'https://admin.example.org/profile/card#me' }]
]);

// Mock service registry
const services = new Map();
const allowedDomains = new Set(['localhost', 'example.org', 'pip.gov.uk', 'eon.co.uk']);

/**
 * OIDC Discovery endpoint
 */
app.get('/.well-known/openid-configuration', (req, res) => {
    res.json({
        issuer: `http://localhost:${PORT}`,
        authorization_endpoint: `http://localhost:${PORT}/auth`,
        token_endpoint: `http://localhost:${PORT}/token`,
        userinfo_endpoint: `http://localhost:${PORT}/userinfo`,
        jwks_uri: `http://localhost:${PORT}/.well-known/jwks.json`,
        response_types_supported: ['code', 'token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256']
    });
});

/**
 * JWKS endpoint for token verification
 */
app.get('/.well-known/jwks.json', (req, res) => {
    res.json({
        keys: [{
            kty: 'RSA',
            kid: 'mock-key-1',
            use: 'sig',
            alg: 'RS256',
            n: 'mock-modulus',
            e: 'AQAB'
        }]
    });
});

/**
 * Token endpoint
 */
app.post('/token', (req, res) => {
    const { grant_type, username, password, client_id } = req.body;

    if (grant_type !== 'password') {
        return res.status(400).json({
            error: 'unsupported_grant_type',
            error_description: 'Only password grant type is supported'
        });
    }

    const user = users.get(username);
    if (!user || user.password !== password) {
        return res.status(401).json({
            error: 'invalid_grant',
            error_description: 'Invalid username or password'
        });
    }

    const tokenData = {
        webid: user.webid,
        iss: `http://localhost:${PORT}`,
        sub: user.id,
        aud: client_id,
        scope: 'openid profile webid',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        jti: uuidv4()
    };

    const accessToken = jwt.sign(tokenData, 'mock-secret');

    res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile webid'
    });
});

/**
 * User info endpoint
 */
app.get('/userinfo', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, 'mock-secret');
        res.json({
            sub: decoded.sub,
            webid: decoded.webid,
            name: `User ${decoded.sub}`,
            email: `${decoded.sub}@example.org`
        });
    } catch (error) {
        res.status(401).json({ error: 'invalid_token' });
    }
});

/**
 * Domain allowlist management
 */
app.get('/allowlist', (req, res) => {
    res.json({
        domains: Array.from(allowedDomains)
    });
});

app.post('/allowlist', (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    allowedDomains.add(domain);
    res.status(201).json({ message: 'Domain added to allowlist' });
});

app.delete('/allowlist', (req, res) => {
    const { domain } = req.query;
    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    allowedDomains.delete(domain);
    res.status(204).send();
});

/**
 * Service registration with DID:web
 */
app.post('/service-register', (req, res) => {
    const { domain, did_web } = req.body;

    if (!domain || !did_web) {
        return res.status(400).json({
            error: 'Domain and DID:web are required'
        });
    }

    if (!allowedDomains.has(domain)) {
        return res.status(403).json({
            error: 'Domain not in allowlist'
        });
    }

    const serviceId = `service-${Date.now()}`;
    services.set(serviceId, {
        domain,
        did_web,
        registered: new Date().toISOString()
    });

    res.status(201).json({
        service_id: serviceId,
        message: 'Service registered successfully'
    });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Mock Solid OIDC Provider',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Mock Solid OIDC Provider running on port ${PORT}`);
    console.log(`Discovery: http://localhost:${PORT}/.well-known/openid-configuration`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
