import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SolidOidcToken } from '../../shared/types/auth';
import { AppError } from './errorMiddleware';

export interface AuthenticatedRequest extends Request {
    user?: {
        webid: string;
        token: SolidOidcToken;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.substring(7);

        if (!process.env.JWT_SECRET) {
            throw new AppError('JWT secret not configured', 500);
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as SolidOidcToken;

        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            throw new AppError('Token expired', 401);
        }

        // Check if WebID is present
        if (!decoded.webid) {
            throw new AppError('Invalid token: missing WebID', 401);
        }

        // Attach user info to request
        req.user = {
            webid: decoded.webid,
            token: decoded
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError('Invalid token', 401));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AppError('Token expired', 401));
        } else {
            next(new AppError('Authentication failed', 401));
        }
    }
};

export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);

        if (!process.env.JWT_SECRET) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as SolidOidcToken;

        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return next();
        }

        if (decoded.webid) {
            req.user = {
                webid: decoded.webid,
                token: decoded
            };
        }

        next();
    } catch (error) {
        // For optional auth, ignore errors and continue
        next();
    }
};
