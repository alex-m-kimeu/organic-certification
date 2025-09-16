import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

// Validate required environment variables
const requiredEnvVars = {
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
} as const;

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
	.filter(([, value]) => !value)
	.map(([key]) => key);

if (missingVars.length > 0) {
	throw new Error(
		`Missing required Cloudinary environment variables: ${missingVars.join(', ')}. ` +
			'Please check your .env file and ensure all Cloudinary credentials are set.',
	);
}

// Configure Cloudinary
cloudinary.config({
	cloud_name: requiredEnvVars.CLOUDINARY_CLOUD_NAME,
	api_key: requiredEnvVars.CLOUDINARY_API_KEY,
	api_secret: requiredEnvVars.CLOUDINARY_API_SECRET,
	secure: true,
	url_analytics: false,
	timeout: 30000,
});

export { cloudinary };

/**
 * Default upload options for certificate PDFs
 */
export const defaultCertificateUploadOptions = {
	resource_type: 'raw' as const,
	folder: 'organic-certificates',
	use_filename: true,
	unique_filename: true,
	overwrite: false,
	access_mode: 'public' as const,
	format: 'pdf' as const,
} as const;

/**
 * Cloudinary configuration validation status
 */
export const isConfigured = (): boolean => {
	try {
		return !!(cloudinary.config().cloud_name && cloudinary.config().api_key && cloudinary.config().api_secret);
	} catch {
		return false;
	}
};

export default cloudinary;
