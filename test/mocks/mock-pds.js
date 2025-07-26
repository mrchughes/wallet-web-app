const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/turtle', limit: '10mb' }));

// Mock storage
const storage = new Map();
const acls = new Map();

// Helper function to parse WebID from token
const parseWebId = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.decode(token);
        return decoded?.webid || null;
    } catch {
        return null;
    }
};

/**
 * GET WebID Profile
 */
app.get('/profile/card', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = `@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix solid: <http://www.w3.org/ns/solid/terms#> .
@prefix pim: <http://www.w3.org/ns/pim/space#> .

<#me>
    a foaf:Person ;
    foaf:name "Test User" ;
    pim:storage <https://user.example.org/storage/> ;
    solid:oidcIssuer <http://localhost:3004> .`;

    res.setHeader('Content-Type', 'text/turtle');
    res.send(profile);
});

/**
 * PUT WebID Profile
 */
app.put('/profile/card', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Store the updated profile
    storage.set('/profile/card', req.body);
    res.status(200).json({ message: 'Profile updated' });
});

/**
 * GET credential
 */
app.get('/credentials/:vcId', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const vcId = req.params.vcId;
    const path = `/credentials/${vcId}`;

    const credential = storage.get(path);
    if (!credential) {
        return res.status(404).json({ error: 'Credential not found' });
    }

    // Check if client accepts Turtle
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/turtle')) {
        res.setHeader('Content-Type', 'text/turtle');
        if (typeof credential === 'string' && credential.includes('@prefix')) {
            res.send(credential);
        } else {
            // Convert JSON-LD to Turtle (simplified)
            const turtle = convertJsonLdToTurtle(credential);
            res.send(turtle);
        }
    } else {
        res.setHeader('Content-Type', 'application/ld+json');
        if (typeof credential === 'string') {
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(credential);
                res.json(parsed);
            } catch {
                // Convert Turtle to JSON-LD (simplified)
                const jsonLd = convertTurtleToJsonLd(credential);
                res.json(jsonLd);
            }
        } else {
            res.json(credential);
        }
    }
});

/**
 * PUT credential
 */
app.put('/credentials/:vcId', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const vcId = req.params.vcId;
    const path = `/credentials/${vcId}`;

    // Store the credential
    storage.set(path, req.body);

    // Update the index
    updateCredentialsIndex(vcId, webid);

    res.status(201).json({ message: 'Credential stored' });
});

/**
 * DELETE credential
 */
app.delete('/credentials/:vcId', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const vcId = req.params.vcId;
    const path = `/credentials/${vcId}`;

    if (!storage.has(path)) {
        return res.status(404).json({ error: 'Credential not found' });
    }

    storage.delete(path);

    // Remove from index
    removeFromCredentialsIndex(vcId);

    res.status(204).send();
});

/**
 * GET credentials index
 */
app.get('/credentials/index.ttl', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let index = storage.get('/credentials/index.ttl');

    if (!index) {
        // Generate default index
        index = `@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .

<index.ttl>
    a ldp:Container ;
    dc:created "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    dc:modified "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;

        storage.set('/credentials/index.ttl', index);
    }

    res.setHeader('Content-Type', 'text/turtle');
    res.send(index);
});

/**
 * PUT access control list
 */
app.put('/.acl', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    acls.set('/.acl', req.body);
    res.status(200).json({ message: 'Access rules updated' });
});

/**
 * PUT credential-specific ACL
 */
app.put('/credentials/:vcId.acl', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const vcId = req.params.vcId;
    const aclPath = `/credentials/${vcId}.acl`;

    acls.set(aclPath, req.body);
    res.status(200).json({ message: 'Access rules updated' });
});

/**
 * GET credential-specific ACL
 */
app.get('/credentials/:vcId.acl', (req, res) => {
    const webid = parseWebId(req);
    if (!webid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const vcId = req.params.vcId;
    const aclPath = `/credentials/${vcId}.acl`;

    const acl = acls.get(aclPath);
    if (!acl) {
        // Generate default ACL
        const defaultAcl = `@prefix acl: <http://www.w3.org/ns/auth/acl#> .

<#owner>
    a acl:Authorization ;
    acl:agent <${webid}> ;
    acl:accessTo <${vcId}> ;
    acl:mode acl:Read, acl:Write, acl:Control .`;

        res.setHeader('Content-Type', 'text/turtle');
        res.send(defaultAcl);
    } else {
        res.setHeader('Content-Type', 'text/turtle');
        res.send(acl);
    }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Mock Solid PDS',
        timestamp: new Date().toISOString(),
        credentialsStored: Array.from(storage.keys()).filter(k => k.startsWith('/credentials/')).length
    });
});

// Helper functions
function updateCredentialsIndex(vcId, webid) {
    const index = `@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .

<index.ttl>
    a ldp:Container ;
    ldp:contains <${vcId}> ;
    dc:created "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    dc:modified "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;

    storage.set('/credentials/index.ttl', index);
}

function removeFromCredentialsIndex(vcId) {
    // Simplified - would need proper RDF manipulation
    let index = storage.get('/credentials/index.ttl') || '';
    index = index.replace(new RegExp(`ldp:contains <${vcId}> ;\\n`, 'g'), '');
    storage.set('/credentials/index.ttl', index);
}

function convertJsonLdToTurtle(jsonLd) {
    // Simplified conversion
    if (typeof jsonLd === 'string') {
        try {
            jsonLd = JSON.parse(jsonLd);
        } catch {
            return jsonLd;
        }
    }

    return `@prefix cred: <https://www.w3.org/2018/credentials#> .

<${jsonLd.id || 'urn:uuid:unknown'}>
    a cred:VerifiableCredential ;
    cred:issuer <${jsonLd.issuer || 'unknown'}> ;
    cred:issuanceDate "${jsonLd.issuanceDate || new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;
}

function convertTurtleToJsonLd(turtle) {
    // Simplified conversion
    return {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:converted',
        type: ['VerifiableCredential'],
        issuer: 'https://converted.example.org',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: 'https://user.example.org/profile/card#me'
        },
        proof: {
            type: 'RsaSignature2018',
            created: new Date().toISOString(),
            proofPurpose: 'assertionMethod',
            verificationMethod: 'https://converted.example.org/keys/1',
            jws: 'converted-signature'
        }
    };
}

// Initialize with test data
const initTestData = () => {
    const testCredential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://schema.org/'
        ],
        id: 'urn:uuid:pip-benefit-test-123',
        type: ['VerifiableCredential', 'BenefitAwardCredential'],
        issuer: 'https://pip.gov.uk/did.json',
        issuanceDate: '2025-07-26T10:00:00Z',
        expirationDate: '2026-07-26T10:00:00Z',
        credentialSubject: {
            id: 'https://user.example.org/profile/card#me',
            benefitType: 'PIP',
            amount: '£90.10/week',
            awardDate: '2025-07-26'
        },
        proof: {
            type: 'RsaSignature2018',
            created: '2025-07-26T10:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'https://pip.gov.uk/keys/123#pub',
            jws: 'mock-signature-pip-benefit'
        }
    };

    storage.set('/credentials/pip-benefit-test-123', testCredential);
    updateCredentialsIndex('pip-benefit-test-123', 'https://user.example.org/profile/card#me');

    console.log('Initialized test credential: pip-benefit-test-123');
};

app.listen(PORT, () => {
    console.log(`Mock Solid PDS running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    initTestData();
});
