import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { cloudinary, defaultCertificateUploadOptions } from '../config/cloudinary';
import { logger } from './logger';

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async <T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000,
): Promise<T> => {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error: unknown) {
			// Handle Cloudinary-specific error format and other error types
			let errorMessage = 'Unknown error';

			if (error && typeof error === 'object' && 'error' in error) {
				const cloudinaryError = error as { error: { message: string; name?: string } };
				errorMessage = cloudinaryError.error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}

			const isNetworkError =
				errorMessage.includes('ETIMEDOUT') ||
				errorMessage.includes('ECONNRESET') ||
				errorMessage.includes('ENOTFOUND') ||
				errorMessage.includes('network') ||
				errorMessage.includes('Request Timeout') ||
				errorMessage.includes('TimeoutError') ||
				(error &&
					typeof error === 'object' &&
					'error' in error &&
					(error as { error: { name?: string } }).error.name === 'TimeoutError');

			if (attempt === maxRetries || !isNetworkError) {
				throw new Error(`Upload failed: ${errorMessage}`);
			}

			// Wait with exponential backoff
			const delay = baseDelay * Math.pow(2, attempt - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
	throw new Error('Max retries exceeded');
};

/**
 * Upload PDF buffer to Cloudinary with timeout and retry
 */
export const uploadPdfToCloudinary = async (
	pdfBuffer: Buffer,
	fileName: string,
	options?: {
		publicId?: string;
		folder?: string;
	},
): Promise<UploadApiResponse> => {
	try {
		return await retryWithBackoff(async () => {
			return new Promise<UploadApiResponse>((resolve, reject) => {
				// Set up timeout
				const timeoutId = setTimeout(() => {
					reject(new Error('Cloudinary upload timeout after 30 seconds'));
				}, 30000);

				try {
					// Create a readable stream from the buffer
					const uploadStream = cloudinary.uploader.upload_stream(
						{
							...defaultCertificateUploadOptions,
							public_id: options?.publicId || `cert_${Date.now()}`,
							folder: options?.folder || 'organic-certificates',
							original_filename: fileName,
						},
						(error, result) => {
							clearTimeout(timeoutId);

							if (error) {
								reject(new Error(`Cloudinary upload failed: ${error.message}`));
							} else if (result) {
								resolve(result);
							} else {
								reject(new Error('Upload failed with no result'));
							}
						},
					);

					// Convert buffer to readable stream and pipe to Cloudinary
					const readable = new Readable();
					readable.push(pdfBuffer);
					readable.push(null); // End the stream
					readable.pipe(uploadStream);

					// Handle stream errors
					readable.on('error', (error) => {
						clearTimeout(timeoutId);
						reject(new Error(`Stream error: ${error.message}`));
					});

					uploadStream.on('error', (error) => {
						clearTimeout(timeoutId);
						reject(new Error(`Upload stream error: ${error.message}`));
					});
				} catch (syncError) {
					clearTimeout(timeoutId);
					reject(
						new Error(
							`Synchronous error: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`,
						),
					);
				}
			});
		});
	} catch (error) {
		logger.error('Cloudinary upload failed after retries', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error instanceof Error ? error : new Error('Cloudinary upload failed');
	}
};

/**
 * Delete PDF from Cloudinary with retry logic
 */
export const deletePdfFromCloudinary = async (publicId: string): Promise<void> => {
	try {
		await retryWithBackoff(async () => {
			return new Promise<void>((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(new Error('Cloudinary delete timeout after 30 seconds'));
				}, 30000);

				cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error) => {
					clearTimeout(timeoutId);
					if (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						reject(new Error(`Cloudinary delete failed: ${errorMessage}`));
					} else {
						resolve();
					}
				});
			});
		});
	} catch (error) {
		throw new Error(
			`Failed to delete PDF from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
};

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
	try {
		const urlParts = url.split('/');
		const uploadIndex = urlParts.findIndex((part) => part === 'upload');
		if (uploadIndex === -1) return null;

		let publicIdIndex = uploadIndex + 1;
		if (urlParts[publicIdIndex]?.startsWith('v')) {
			publicIdIndex++;
		}

		const publicIdWithExtension = urlParts.slice(publicIdIndex).join('/');
		return publicIdWithExtension.replace('.pdf', '');
	} catch {
		return null;
	}
};

export default {
	uploadPdfToCloudinary,
	deletePdfFromCloudinary,
	extractPublicIdFromUrl,
};
