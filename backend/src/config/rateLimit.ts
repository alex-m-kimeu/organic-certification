import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';

export const rateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	legacyHeaders: false,

	message: {
		success: false,
		error: 'Too many requests',
		message: 'You have exceeded the rate limit. Please try again later.',
		retryAfter: 15 * 60,
	},

	skip: (req: Request): boolean => {
		if (req.path === '/health') {
			return true;
		}

		if (
			process.env.NODE_ENV === 'development' &&
			(req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')
		) {
			return true;
		}

		return false;
	},

	handler: (req: Request, res: Response): void => {
		res.status(429).json({
			success: false,
			error: 'Rate Limit Exceeded',
			message: 'Too many requests from this IP, please try again later.',
			retryAfter: Math.round(15 * 60),
		});
	},
});
