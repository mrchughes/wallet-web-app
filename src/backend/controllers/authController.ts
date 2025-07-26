import { Router, Request, Response } from 'express';
import { SolidOidcService } from '../services/solidOidcService';
import { LoginRequest } from '../../shared/types/auth';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const solidOidcService = new SolidOidcService();

/**
 * POST /api/auth/login
 * Authenticate using Solid OIDC
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const loginRequest: LoginRequest = req.body;

        // Validate request
        if (!loginRequest.username || !loginRequest.password) {
            throw new AppError('Username and password are required', 400);
        }

        // Authenticate with Solid OIDC
        const result = await solidOidcService.authenticate(loginRequest);

        if (!result.success) {
            throw new AppError(result.error || 'Authentication failed', 401);
        }

        // Set secure cookie with token
        res.cookie('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: (result.expiresIn || 3600) * 1000
        });

        res.json({
            success: true,
            webid: result.webid,
            expiresIn: result.expiresIn
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
});

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /api/auth/session
 * Check current session status
 */
router.get('/session', (req: Request, res: Response) => {
    const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No active session'
        });
    }

    try {
        // Verify token without middleware to provide session info
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);

        return res.json({
            success: true,
            webid: decoded.webid,
            expiresAt: decoded.exp * 1000
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid session'
        });
    }
});/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);

        if (!token) {
            throw new AppError('No token provided', 401);
        }

        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);

        // Create new token with extended expiry
        const newToken = require('jsonwebtoken').sign({
            webid: decoded.webid,
            iss: decoded.iss,
            sub: decoded.sub,
            aud: decoded.aud,
            scope: decoded.scope,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        }, process.env.JWT_SECRET);

        res.cookie('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600 * 1000
        });

        res.json({
            success: true,
            token: newToken,
            expiresIn: 3600
        });

    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Token refresh failed'
            });
        }
    }
});

export default router;
