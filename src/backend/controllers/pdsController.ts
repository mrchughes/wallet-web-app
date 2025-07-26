import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SolidOidcService } from '../services/solidOidcService';
import { PdsService } from '../services/pdsService';
import { SetPermissionsRequest } from '../../shared/types/credentials';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const solidOidcService = new SolidOidcService();
const pdsService = new PdsService(solidOidcService);

/**
 * GET /api/pds/credentials
 * List all credentials from PDS
 */
router.get('/credentials', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const credentials = await pdsService.getCredentials(req.user.webid);

        res.json({
            success: true,
            credentials,
            count: credentials.length
        });

    } catch (error) {
        console.error('Error getting credentials:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve credentials'
        });
    }
});

/**
 * GET /api/pds/credentials/:id
 * Get a specific credential
 */
router.get('/credentials/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const credentialId = req.params.id;
        const format = (req.query.format as 'json-ld' | 'turtle') || 'json-ld';

        if (!credentialId) {
            throw new AppError('Credential ID is required', 400);
        }

        const credential = await pdsService.getCredential(credentialId, req.user.webid, format);

        if (!credential) {
            throw new AppError('Credential not found', 404);
        }

        res.json({
            success: true,
            credential,
            format
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Error getting credential:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve credential'
            });
        }
    }
});

/**
 * GET /api/pds/permissions
 * Get current permissions for all credentials
 */
router.get('/permissions', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        // Get all credentials first
        const credentials = await pdsService.getCredentials(req.user.webid);

        // Get permissions for each credential
        const permissionsPromises = credentials.map(async (credential) => {
            const permissions = await pdsService.getPermissions(credential.id, req.user!.webid);
            return {
                credentialId: credential.id,
                title: credential.title,
                permissions
            };
        });

        const allPermissions = await Promise.all(permissionsPromises);

        res.json({
            success: true,
            permissions: allPermissions
        });

    } catch (error) {
        console.error('Error getting permissions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve permissions'
        });
    }
});

/**
 * GET /api/pds/permissions/:credentialId
 * Get permissions for a specific credential
 */
router.get('/permissions/:credentialId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const credentialId = req.params.credentialId;

        if (!credentialId) {
            throw new AppError('Credential ID is required', 400);
        }

        const permissions = await pdsService.getPermissions(credentialId, req.user.webid);

        res.json({
            success: true,
            credentialId,
            permissions
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Error getting permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve permissions'
            });
        }
    }
});

/**
 * POST /api/pds/permissions
 * Set permissions for a credential
 */
router.post('/permissions', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const permissionRequest: SetPermissionsRequest = req.body;

        // Validate request
        if (!permissionRequest.credentialId) {
            throw new AppError('Credential ID is required', 400);
        }

        if (!permissionRequest.accessors || !Array.isArray(permissionRequest.accessors)) {
            throw new AppError('Accessors array is required', 400);
        }

        if (!permissionRequest.actions || !Array.isArray(permissionRequest.actions)) {
            throw new AppError('Actions array is required', 400);
        }

        // Validate actions
        const validActions = ['read', 'write', 'append', 'control'];
        const invalidActions = permissionRequest.actions.filter(action => !validActions.includes(action));

        if (invalidActions.length > 0) {
            throw new AppError(`Invalid actions: ${invalidActions.join(', ')}`, 400);
        }

        // Validate accessors (should be WebIDs)
        for (const accessor of permissionRequest.accessors) {
            try {
                new URL(accessor);
            } catch {
                throw new AppError(`Invalid WebID format: ${accessor}`, 400);
            }
        }

        const success = await pdsService.setPermissions(permissionRequest, req.user.webid);

        if (!success) {
            throw new AppError('Failed to set permissions', 500);
        }

        res.json({
            success: true,
            message: 'Permissions updated successfully',
            credentialId: permissionRequest.credentialId,
            accessors: permissionRequest.accessors,
            actions: permissionRequest.actions
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Error setting permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to set permissions'
            });
        }
    }
});

/**
 * DELETE /api/pds/permissions/:credentialId
 * Remove all permissions for a credential (reset to default)
 */
router.delete('/permissions/:credentialId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const credentialId = req.params.credentialId;

        if (!credentialId) {
            throw new AppError('Credential ID is required', 400);
        }

        // Reset permissions to default (only owner can access)
        const defaultPermissions: SetPermissionsRequest = {
            credentialId,
            accessors: [req.user.webid],
            actions: ['read', 'write', 'append', 'control']
        };

        const success = await pdsService.setPermissions(defaultPermissions, req.user.webid);

        if (!success) {
            throw new AppError('Failed to reset permissions', 500);
        }

        res.json({
            success: true,
            message: 'Permissions reset to default',
            credentialId
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Error resetting permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reset permissions'
            });
        }
    }
});

/**
 * GET /api/pds/pod-info
 * Get information about the user's pod
 */
router.get('/pod-info', async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        const podUrl = await solidOidcService.discoverPodFromWebId(req.user.webid);

        if (!podUrl) {
            throw new AppError('Could not discover pod URL', 404);
        }

        res.json({
            success: true,
            webid: req.user.webid,
            podUrl,
            storageQuota: 'Unknown', // Would need to query pod for storage info
            credentialsPath: '/credentials/'
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Error getting pod info:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pod information'
            });
        }
    }
});

export default router;
