import type { Request, Response, NextFunction } from 'express';
import { z, ZodType, ZodError } from 'zod';
import type { ParsedQs } from 'qs';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidationOptions {
	target: ValidationTarget;
	schema: ZodType;
	optional?: boolean;
}

// Create validation middleware for a single target
export const validate = (target: ValidationTarget, schema: ZodType, optional: boolean = false) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			let dataToValidate: unknown;

			// Get data based on target
			switch (target) {
				case 'body':
					dataToValidate = req.body;
					break;
				case 'query':
					dataToValidate = req.query;
					break;
				case 'params':
					dataToValidate = req.params;
					break;
				default:
					throw new Error(`Invalid validation target: ${target}`);
			}

			// Skip validation if optional and data is empty
			if (
				optional &&
				(!dataToValidate || (typeof dataToValidate === 'object' && Object.keys(dataToValidate).length === 0))
			) {
				next();
				return;
			}

			// Parse and validate data
			const validatedData = schema.parse(dataToValidate);

			// Replace the original data with validated data
			switch (target) {
				case 'body':
					req.body = validatedData;
					break;
				case 'query':
					req.query = validatedData as ParsedQs;
					break;
				case 'params':
					req.params = validatedData as Record<string, string>;
					break;
			}

			next();
		} catch (error) {
			// ZodError will be handled by the global error handler
			next(error);
		}
	};
};

// Validate request body
export const validateBody = (
	schema: ZodType,
	optional: boolean = false,
): ((req: Request, res: Response, next: NextFunction) => void) => {
	return validate('body', schema, optional);
};

// Validate query parameters
export const validateQuery = (
	schema: ZodType,
	optional: boolean = true,
): ((req: Request, res: Response, next: NextFunction) => void) => {
	return validate('query', schema, optional);
};

// Validate URL parameters
export const validateParams = (
	schema: ZodType,
	optional: boolean = false,
): ((req: Request, res: Response, next: NextFunction) => void) => {
	return validate('params', schema, optional);
};

// Validate multiple targets at once
export const validateMultiple = (validations: ValidationOptions[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const errors: ZodError[] = [];

		for (const validation of validations) {
			try {
				let dataToValidate: unknown;

				// Get data based on target
				switch (validation.target) {
					case 'body':
						dataToValidate = req.body;
						break;
					case 'query':
						dataToValidate = req.query;
						break;
					case 'params':
						dataToValidate = req.params;
						break;
				}

				// Skip validation if optional and data is empty
				if (
					validation.optional &&
					(!dataToValidate ||
						(typeof dataToValidate === 'object' && Object.keys(dataToValidate).length === 0))
				) {
					continue;
				}

				// Parse and validate data
				const validatedData = validation.schema.parse(dataToValidate);

				// Replace the original data with validated data
				switch (validation.target) {
					case 'body':
						req.body = validatedData;
						break;
					case 'query':
						req.query = validatedData as ParsedQs;
						break;
					case 'params':
						req.params = validatedData as Record<string, string>;
						break;
				}
			} catch (error) {
				if (error instanceof ZodError) {
					errors.push(error);
				} else {
					next(error);
					return;
				}
			}
		}

		// If there are validation errors, combine them
		if (errors.length > 0) {
			const combinedError = new ZodError(
				errors.reduce((acc, error) => acc.concat(error.issues), [] as ZodError['issues']),
			);
			next(combinedError);
			return;
		}

		next();
	};
};

// Helper function to create pagination validation schema
export const createPaginationSchema = (): z.ZodType => {
	return z.object({
		page: z
			.string()
			.optional()
			.transform((val: string | undefined) => (val ? parseInt(val, 10) : 1))
			.refine((val: number) => val > 0, { message: 'Page must be greater than 0' }),
		limit: z
			.string()
			.optional()
			.transform((val: string | undefined) => (val ? parseInt(val, 10) : 10))
			.refine((val: number) => val > 0 && val <= 100, {
				message: 'Limit must be between 1 and 100',
			}),
		sort: z
			.string()
			.optional()
			.refine(
				(val: string | undefined) => {
					if (!val) return true;
					const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$/;
					return pattern.test(val);
				},
				{ message: 'Sort format must be "field:asc" or "field:desc"' },
			),
		search: z
			.string()
			.optional()
			.refine((val: string | undefined) => !val || (val.length >= 1 && val.length <= 100), {
				message: 'Search term must be between 1 and 100 characters',
			}),
	});
};

// Helper function to create ID parameter validation schema
export const createIdParamSchema = (): z.ZodType => {
	return z.object({
		id: z
			.string()
			.regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format')
			.describe('Resource identifier'),
	});
};

// Middleware to validate Prisma cuid parameters
export const validateIdParam = (
	paramName: string = 'id',
): ((req: Request, res: Response, next: NextFunction) => void) => {
	const schema = z.object({
		[paramName]: z.string().regex(/^[a-zA-Z0-9_-]+$/, `Invalid ID format for ${paramName}`),
	});

	return validateParams(schema);
};

// Common validation schemas
export const commonSchemas = {
	// Email validation
	email: (): z.ZodEmail => {
		return z.email({ message: 'Invalid email address' }).trim().toLowerCase();
	},

	// Generic phone number validation
	phone: (): z.ZodString => {
		return z
			.string()
			.min(10, 'Phone number must be at least 10 characters')
			.max(15, 'Phone number must be at most 15 characters')
			.trim();
	},

	// Name validation
	name: (): z.ZodString => {
		return z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').trim();
	},

	// Required string
	requiredString: (fieldName: string, minLength: number = 1, maxLength: number = 255): z.ZodString => {
		return z
			.string()
			.min(minLength, `${fieldName} must be at least ${minLength} characters`)
			.max(maxLength, `${fieldName} must be at most ${maxLength} characters`)
			.trim();
	},

	// Optional string
	optionalString: (maxLength: number = 255): z.ZodOptional<z.ZodString> => {
		return z.string().max(maxLength).trim().optional();
	},

	// Positive number
	positiveNumber: (fieldName: string): z.ZodNumber => {
		return z.number().positive({ message: `${fieldName} must be a positive number` });
	},

	// Boolean
	boolean: (): z.ZodBoolean => {
		return z.boolean();
	},

	// Date validation
	dateString: (): z.ZodString => {
		return z.string().refine((val) => !isNaN(Date.parse(val)), {
			message: 'Invalid date format',
		});
	},

	// ISO datetime validation
	isoDateTime: (): z.ZodISODateTime => {
		return z.iso.datetime({ message: 'Invalid ISO datetime format' });
	},
};
