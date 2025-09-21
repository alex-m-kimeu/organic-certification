import { z } from 'zod';

// Common crop types for validation - matching backend
const COMMON_CROPS = [
	'Maize',
	'Beans',
	'Wheat',
	'Rice',
	'Barley',
	'Sorghum',
	'Millet',
	'Cassava',
	'Sweet Potatoes',
	'Irish Potatoes',
	'Bananas',
	'Plantains',
	'Sugarcane',
	'Cotton',
	'Coffee',
	'Tea',
	'Pyrethrum',
	'Sunflower',
	'Groundnuts',
	'Soybeans',
	'Green Grams',
	'Cowpeas',
	'Pigeon Peas',
	'Tomatoes',
	'Onions',
	'Carrots',
	'Cabbages',
	'Kales',
	'Spinach',
	'Lettuce',
	'Cucumbers',
	'Watermelons',
	'Mangoes',
	'Avocados',
	'Citrus',
	'Passion Fruit',
	'Pineapples',
	'Macadamia',
	'Cashew Nuts',
	'Coconuts',
	'Other',
] as const;

// Base field schema definitions
const fieldNameSchema = z
	.string()
	.min(1, 'Field name is required')
	.max(100, 'Field name must not exceed 100 characters')
	.trim();

const cropSchema = z.enum(COMMON_CROPS, {
	message: `Crop must be a valid crop type. Use 'Other' if your crop is not listed.`,
});

const areaHaSchema = z
	.number()
	.positive('Area must be a positive number')
	.max(10000, 'Field area cannot exceed 10,000 hectares')
	.refine((val) => Number(val.toFixed(3)) === val || val.toString().split('.')[1]?.length <= 3, {
		message: 'Area can have at most 3 decimal places',
	});

// Schema for creating a new field
export const createFieldSchema = z.object({
	farmId: z.string().min(1, 'Farm ID is required'),
	name: fieldNameSchema,
	crop: cropSchema,
	areaHa: areaHaSchema,
});

// Schema for updating a field
export const updateFieldSchema = z
	.object({
		farmId: z.string().min(1, 'Farm ID is required').optional(),
		name: fieldNameSchema.optional(),
		crop: cropSchema.optional(),
		areaHa: areaHaSchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field must be provided for update',
	});

export type CreateField = z.infer<typeof createFieldSchema>;
export type UpdateField = z.infer<typeof updateFieldSchema>;

export { COMMON_CROPS };
