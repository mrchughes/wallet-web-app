const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Mock DID registry
const didRegistry = new Map();
const keyPairs = new Map();

/**
 * Create new DID:ION
 */
app.post('/did/create', (req, res) => {
    const { publicKey } = req.body;

    if (!publicKey) {
        return res.status(400).json({
            error: 'Public key is required'
        });
    }

    const did = `did:ion:${uuidv4()}`;
    const didDocument = {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/v1'
        ],
        id: did,
        verificationMethod: [{
            id: `${did}#key1`,
            type: 'RsaVerificationKey2018',
            controller: did,
            publicKeyPem: publicKey
        }],
        authentication: [`${did}#key1`],
        assertionMethod: [`${did}#key1`],
        service: [{
            id: `${did}#wallet`,
            type: 'WalletService',
            serviceEndpoint: 'https://wallet.example.org'
        }]
    };

    didRegistry.set(did, didDocument);
    keyPairs.set(did, publicKey);

    res.status(201).json({
        did,
        didDocument,
        created: new Date().toISOString()
    });
});

/**
 * Resolve DID document
 */
app.get('/did/resolve/:did', (req, res) => {
    const did = decodeURIComponent(req.params.did);

    const didDocument = didRegistry.get(did);
    if (!didDocument) {
        return res.status(404).json({
            error: 'DID not found'
        });
    }

    res.json({
        didDocument,
        didResolutionMetadata: {
            contentType: 'application/did+ld+json'
        },
        didDocumentMetadata: {
            created: '2025-07-26T00:00:00Z',
            updated: '2025-07-26T00:00:00Z'
        }
    });
});

/**
 * Verify signature
 */
app.post('/did/verify', (req, res) => {
    const { did, data, signature } = req.body;

    if (!did || !data || !signature) {
        return res.status(400).json({
            error: 'DID, data, and signature are required'
        });
    }

    const didDocument = didRegistry.get(did);
    if (!didDocument) {
        return res.status(404).json({
            error: 'DID not found'
        });
    }

    // Mock verification - in real implementation, would verify cryptographic signature
    const isValid = signature.length > 0 && data.length > 0;

    res.json({
        valid: isValid,
        did,
        verificationMethod: `${did}#key1`,
        verifiedAt: new Date().toISOString()
    });
});

/**
 * List all DIDs (for testing)
 */
app.get('/did/list', (req, res) => {
    const dids = Array.from(didRegistry.keys()).map(did => ({
        did,
        created: didRegistry.get(did)?.created || new Date().toISOString()
    }));

    res.json({
        dids,
        count: dids.length
    });
});

/**
 * Update DID document (for key rotation)
 */
app.put('/did/update/:did', (req, res) => {
    const did = decodeURIComponent(req.params.did);
    const { operation } = req.body;

    const didDocument = didRegistry.get(did);
    if (!didDocument) {
        return res.status(404).json({
            error: 'DID not found'
        });
    }

    // Mock update operation
    if (operation === 'add-key') {
        const newKeyId = `${did}#key${didDocument.verificationMethod.length + 1}`;
        didDocument.verificationMethod.push({
            id: newKeyId,
            type: 'RsaVerificationKey2018',
            controller: did,
            publicKeyPem: req.body.publicKey
        });
    }

    didDocument.updated = new Date().toISOString();
    didRegistry.set(did, didDocument);

    res.json({
        didDocument,
        updated: new Date().toISOString()
    });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Mock DID:ION Service',
        timestamp: new Date().toISOString(),
        didsRegistered: didRegistry.size
    });
});

// Initialize with some test DIDs
const initTestData = () => {
    const testDid = 'did:ion:test-123';
    const testDidDocument = {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/v1'
        ],
        id: testDid,
        verificationMethod: [{
            id: `${testDid}#key1`,
            type: 'RsaVerificationKey2018',
            controller: testDid,
            publicKeyPem: '-----BEGIN PUBLIC KEY-----\\nMOCK_PUBLIC_KEY\\n-----END PUBLIC KEY-----'
        }],
        authentication: [`${testDid}#key1`],
        assertionMethod: [`${testDid}#key1`]
    };

    didRegistry.set(testDid, testDidDocument);
    console.log(`Initialized test DID: ${testDid}`);
};

app.listen(PORT, () => {
    console.log(`Mock DID:ION Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    initTestData();
});
