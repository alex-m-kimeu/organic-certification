import { z } from 'zod';

// Base field schema definitions
const farmNameSchema = z
	.string()
	.min(1, 'Farm name is required')
	.max(100, 'Farm name must not exceed 100 characters')
	.trim();

const locationSchema = z
	.string()
	.min(1, 'Location is required')
	.max(200, 'Location must not exceed 200 characters')
	.trim();

const areaHaSchema = z
	.number()
	.positive('Area must be a positive number')
	.max(50000, 'Area cannot exceed 50,000 hectares')
	.refine((val) => Number(val.toFixed(2)) === val || val.toString().split('.')[1]?.length <= 2, {
		message: 'Area can have at most 2 decimal places',
	});

// Schema for creating a new farm
export const createFarmSchema = z.object({
	farmerId: z.string().min(1, 'Farmer ID is required'),
	farmName: farmNameSchema,
	location: locationSchema,
	areaHa: areaHaSchema,
});

// Schema for updating a farm
export const updateFarmSchema = z
	.object({
		farmerId: z.string().min(1, 'Farmer ID is required').optional(),
		farmName: farmNameSchema.optional(),
		location: locationSchema.optional(),
		areaHa: areaHaSchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field must be provided for update',
	});

export type CreateFarm = z.infer<typeof createFarmSchema>;
export type UpdateFarm = z.infer<typeof updateFarmSchema>;
