import { z } from 'zod';

// Certificate ID parameter validation
export const certificateIdParamSchema = z.object({
	id: z.string().min(1, 'Certificate ID is required'),
});
