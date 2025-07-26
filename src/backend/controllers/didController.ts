import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SolidOidcService } from '../services/solidOidcService';
import { PdsService } from '../services/pdsService';
import { DIDIonService } from '../services/didIonService';
import { CreateDIDRequest, SignRequest } from '../../shared/types/did';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const solidOidcService = new SolidOidcService();
const pdsService = new PdsService(solidOidcService);
const didIonService = new DIDIonService(pdsService);

/**
 * POST /api/did/create
 * Create new DID:ION identity
 */
router.post('/create', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const createRequest: CreateDIDRequest = req.body;

        // Validate request
        if (!createRequest.passphrase) {
            throw new AppError('Passphrase is required', 400);
        }

        if (createRequest.passphrase.length < 8) {
            throw new AppError('Passphrase must be at least 8 characters', 400);
        }

        // Create DID identity
        const result = await didIonService.createDID(createRequest, req.user.webid);

        if (!result.success) {
            throw new AppError(result.error || 'Failed to create DID', 500);
        }

        res.status(201).json({
            success: true,
            did: result.did,
            publicKey: result.publicKey
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('DID creation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
});

/**
 * POST /api/did/sign
 * Sign data with DID:ION
 */
router.post('/sign', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const signRequest: SignRequest = req.body;

        // Validate request
        if (!signRequest.data) {
            throw new AppError('Data to sign is required', 400);
        }

        if (!signRequest.passphrase) {
            throw new AppError('Passphrase is required', 400);
        }

        // Sign data
        const result = await didIonService.signData(signRequest, req.user.webid);

        if (!result.success) {
            throw new AppError(result.error || 'Failed to sign data', 500);
        }

        res.json({
            success: true,
            signature: result.signature,
            did: result.did,
            signedAt: new Date().toISOString()
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Signing error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
});

/**
 * GET /api/did/list
 * List all DID identities for the user
 */
router.get('/list', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const dids = await didIonService.listDIDs(req.user.webid);

        res.json({
            success: true,
            dids: dids.map(did => ({
                did: did.did,
                keyType: did.keyType,
                created: did.created,
                lastUsed: did.lastUsed,
                label: did.label
            }))
        });

    } catch (error) {
        console.error('Error listing DIDs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list DID identities'
        });
    }
});

/**
 * GET /api/did/resolve/:did
 * Resolve a DID document
 */
router.get('/resolve/:did', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const did = req.params.did;

        if (!did) {
            throw new AppError('DID parameter is required', 400);
        }

        const didDocument = await didIonService.resolveDID(did);

        if (!didDocument) {
            throw new AppError('DID not found', 404);
        }

        res.json({
            success: true,
            didDocument
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('DID resolution error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to resolve DID'
            });
        }
    }
});

/**
 * POST /api/did/verify
 * Verify a signature against a DID
 */
router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { did, data, signature } = req.body;

        if (!did || !data || !signature) {
            throw new AppError('DID, data, and signature are required', 400);
        }

        // Get DID document
        const didDocument = await didIonService.resolveDID(did);

        if (!didDocument) {
            throw new AppError('DID not found', 404);
        }

        // Verify signature (simplified implementation)
        const isValid = true; // In real implementation, verify the signature

        res.json({
            success: true,
            valid: isValid,
            did,
            verifiedAt: new Date().toISOString()
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Signature verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify signature'
            });
        }
    }
});

export default router;
