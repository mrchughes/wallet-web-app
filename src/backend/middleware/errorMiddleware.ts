import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
    error: string;
    message: string;
    status: number;
    timestamp: string;
    path: string;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Resource not found: ${req.originalUrl}`, 404);
    next(error);
};

export const errorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
    } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error);
    }

    const errorResponse: ErrorResponse = {
        error: error.name || 'Error',
        message,
        status: statusCode,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    };

    res.status(statusCode).json(errorResponse);
};
