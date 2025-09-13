import { z } from 'zod';

// Kenyan counties for validation
const KENYAN_COUNTIES = [
	'Baringo',
	'Bomet',
	'Bungoma',
	'Busia',
	'Elgeyo-Marakwet',
	'Embu',
	'Garissa',
	'Homa Bay',
	'Isiolo',
	'Kajiado',
	'Kakamega',
	'Kericho',
	'Kiambu',
	'Kilifi',
	'Kirinyaga',
	'Kisii',
	'Kisumu',
	'Kitui',
	'Kwale',
	'Laikipia',
	'Lamu',
	'Machakos',
	'Makueni',
	'Mandera',
	'Marsabit',
	'Meru',
	'Migori',
	'Mombasa',
	"Murang'a",
	'Nairobi',
	'Nakuru',
	'Nandi',
	'Narok',
	'Nyamira',
	'Nyandarua',
	'Nyeri',
	'Samburu',
	'Siaya',
	'Taita-Taveta',
	'Tana River',
	'Tharaka-Nithi',
	'Trans Nzoia',
	'Turkana',
	'Uasin Gishu',
	'Vihiga',
	'Wajir',
	'West Pokot',
] as const;

// Base field schema definitions
const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').trim();

const phoneSchema = z
	.string()
	.length(9, 'Phone number must be exactly 9 digits')
	.regex(/^[17]\d{8}$/, 'Invalid Kenyan phone number. Number must start with 1 or 7 and contain exactly 9 digits')
	.trim()
	.transform((val) => `+254${val}`);

const emailSchema = z.email({ message: 'Invalid email address.' }).trim().toLowerCase();

const countySchema = z
	.string()
	.min(1, 'County is required')
	.refine(
		(val): val is (typeof KENYAN_COUNTIES)[number] =>
			KENYAN_COUNTIES.includes(val as (typeof KENYAN_COUNTIES)[number]),
		{
			message: `County must be a valid Kenyan county. Valid options: ${KENYAN_COUNTIES.join(', ')}`,
		},
	);

// Schema for creating a new farmer
export const createFarmerSchema = z.object({
	name: nameSchema,
	phone: phoneSchema,
	email: emailSchema,
	county: countySchema,
});

// Schema for updating a farmer
export const updateFarmerSchema = z
	.object({
		name: nameSchema.optional(),
		phone: phoneSchema.optional(),
		email: emailSchema.optional(),
		county: countySchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field must be provided for update',
	});

export type CreateFarmerDto = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerDto = z.infer<typeof updateFarmerSchema>;

// Export counties list for use in documentation
export { KENYAN_COUNTIES };
