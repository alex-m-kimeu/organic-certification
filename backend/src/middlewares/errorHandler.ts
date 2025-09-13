/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

// Custom error class for application-specific errors
export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;
	public readonly errorCode?: string;

	constructor(message: string, statusCode: number = 500, errorCode?: string, isOperational: boolean = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.errorCode = errorCode;
		this.name = this.constructor.name;

		Error.captureStackTrace(this, this.constructor);
	}
}

interface ErrorResponse {
	success: false;
	error: string;
	message: string;
	statusCode: number;
	timestamp: string;
	path?: string;
	requestId?: string;
	details?: unknown;
	stack?: string;
}

// Helper function to create error response
const createErrorResponse = (error: Error, statusCode: number, req: Request, details?: unknown): ErrorResponse => {
	const response: ErrorResponse = {
		success: false,
		error: error.name || 'Error',
		message: error.message || 'An unexpected error occurred',
		statusCode,
		timestamp: new Date().toISOString(),
		path: req.originalUrl,
		requestId: req.headers['x-request-id'] as string,
	};

	if (details) {
		response.details = details;
	}

	if (process.env.NODE_ENV === 'development') {
		response.stack = error.stack;
	}

	return response;
};

// Handle Prisma errors
const handlePrismaError = (error: unknown, req: Request, res: Response): void => {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		let statusCode = 400;
		let message = 'Database operation failed';

		switch (error.code) {
			case 'P2002':
				statusCode = 409;
				message = 'A record with this data already exists';
				break;
			case 'P2025':
				statusCode = 404;
				message = 'Record not found';
				break;
			case 'P2003':
				statusCode = 400;
				message = 'Foreign key constraint violation';
				break;
			case 'P2011':
				statusCode = 400;
				message = 'Null constraint violation';
				break;
			case 'P2012':
				statusCode = 400;
				message = 'Missing required value';
				break;
			case 'P2014':
				statusCode = 400;
				message = 'Invalid relation reference';
				break;
			case 'P2021':
				statusCode = 400;
				message = 'Table does not exist';
				break;
			case 'P2022':
				statusCode = 400;
				message = 'Column does not exist';
				break;
			default:
				message = `Database error: ${error.message}`;
		}

		const errorResponse = createErrorResponse(new Error(message), statusCode, req, {
			code: error.code,
			field: error.meta?.field_name,
		});

		res.status(statusCode).json(errorResponse);
		return;
	}

	if (error instanceof Prisma.PrismaClientUnknownRequestError) {
		const errorResponse = createErrorResponse(new Error('Unknown database error occurred'), 500, req);
		res.status(500).json(errorResponse);
		return;
	}

	if (error instanceof Prisma.PrismaClientInitializationError) {
		const errorResponse = createErrorResponse(new Error('Database connection failed'), 503, req);
		res.status(503).json(errorResponse);
		return;
	}

	if (error instanceof Prisma.PrismaClientValidationError) {
		const errorResponse = createErrorResponse(new Error('Database query validation failed'), 400, req);
		res.status(400).json(errorResponse);
		return;
	}

	// If it's not a recognized Prisma error, continue with general error handling
	throw error;
};

// Handle Zod validation errors
const handleZodError = (error: ZodError, req: Request, res: Response): void => {
	const validationErrors = error.issues.map((err) => ({
		field: err.path.join('.'),
		message: err.message,
		code: err.code,
		expected: 'expected' in err ? err.expected : undefined,
		received: 'received' in err ? err.received : undefined,
	}));

	const errorResponse = createErrorResponse(new Error('Validation failed'), 400, req, { validationErrors });

	res.status(400).json(errorResponse);
};

// Global error handler middleware
export const globalErrorHandler = (error: Error, req: Request, res: Response, _next: NextFunction): void => {
	console.error('Global error handler caught:', {
		name: error.name,
		message: error.message,
		stack: error.stack,
		url: req.url,
		method: req.method,
		ip: req.ip,
		userAgent: req.get('User-Agent'),
	});

	// Handle Zod validation errors
	if (error instanceof ZodError) {
		handleZodError(error, req, res);
		return;
	}

	// Handle Prisma errors
	try {
		handlePrismaError(error, req, res);
		return;
	} catch {
		// If it's not a Prisma error, continue with general error handling
	}

	// Handle custom AppError
	if (error instanceof AppError) {
		const errorResponse = createErrorResponse(error, error.statusCode, req);
		res.status(error.statusCode).json(errorResponse);
		return;
	}

	// Handle specific known errors
	if (error.name === 'ValidationError') {
		const errorResponse = createErrorResponse(error, 400, req);
		res.status(400).json(errorResponse);
		return;
	}

	if (error.name === 'CastError') {
		const errorResponse = createErrorResponse(new Error('Invalid data format'), 400, req);
		res.status(400).json(errorResponse);
		return;
	}

	if (error.name === 'JsonWebTokenError') {
		const errorResponse = createErrorResponse(new Error('Invalid authentication token'), 401, req);
		res.status(401).json(errorResponse);
		return;
	}

	if (error.name === 'TokenExpiredError') {
		const errorResponse = createErrorResponse(new Error('Authentication token has expired'), 401, req);
		res.status(401).json(errorResponse);
		return;
	}

	// Handle syntax errors (malformed JSON, etc.)
	if (error instanceof SyntaxError && 'body' in error) {
		const errorResponse = createErrorResponse(new Error('Invalid JSON in request body'), 400, req);
		res.status(400).json(errorResponse);
		return;
	}

	// Default error handling for unknown errors
	const statusCode = 500;
	const errorResponse = createErrorResponse(new Error('An unexpected error occurred'), statusCode, req);

	res.status(statusCode).json(errorResponse);
};

// Helper function to wrap async route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response): void => {
	const errorResponse: ErrorResponse = {
		success: false,
		error: 'Not Found',
		message: `Route ${req.originalUrl} not found`,
		statusCode: 404,
		timestamp: new Date().toISOString(),
		path: req.originalUrl,
	};

	res.status(404).json(errorResponse);
};
