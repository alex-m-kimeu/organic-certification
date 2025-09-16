import fs from 'fs/promises';
import path from 'path';

/**
 * Local storage utility for PDF files when Cloudinary is unavailable
 */

// Directory for storing PDF files locally
const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'storage');

/**
 * Ensure the local storage directory exists
 */
export const ensureStorageDirectory = async (): Promise<void> => {
	try {
		await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
	} catch (error) {
		throw new Error(
			`Failed to create local storage directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
};

/**
 * Save PDF buffer to local storage
 */
export const savePdfLocally = async (
	pdfBuffer: Buffer,
	fileName: string,
	options?: {
		certificateNumber?: string;
		subfolder?: string;
	},
): Promise<string> => {
	try {
		// Ensure storage directory exists
		await ensureStorageDirectory();

		// Create subfolder if specified
		let storageDir = LOCAL_STORAGE_DIR;
		if (options?.subfolder) {
			storageDir = path.join(LOCAL_STORAGE_DIR, options.subfolder);
			await fs.mkdir(storageDir, { recursive: true });
		}

		// Sanitize filename
		const sanitizedFileName = fileName.replace(/[^a-z0-9\-_.]/gi, '_');
		const filePath = path.join(storageDir, sanitizedFileName);

		// Save the PDF file
		await fs.writeFile(filePath, pdfBuffer);

		// Return relative path from storage root
		const relativePath = path.relative(LOCAL_STORAGE_DIR, filePath);
		return relativePath;
	} catch (error) {
		throw new Error(`Failed to save PDF locally: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

/**
 * Read PDF from local storage
 */
export const readPdfFromLocal = async (relativePath: string): Promise<Buffer> => {
	try {
		const filePath = path.join(LOCAL_STORAGE_DIR, relativePath);

		// Check if file exists
		try {
			await fs.access(filePath);
		} catch {
			throw new Error('PDF file not found in local storage');
		}

		// Read and return the file
		return await fs.readFile(filePath);
	} catch (error) {
		throw new Error(
			`Failed to read PDF from local storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
};

/**
 * Delete PDF from local storage
 */
export const deletePdfFromLocal = async (relativePath: string): Promise<void> => {
	try {
		const filePath = path.join(LOCAL_STORAGE_DIR, relativePath);

		// Check if file exists before trying to delete
		try {
			await fs.access(filePath);
			await fs.unlink(filePath);
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
				throw error;
			}
		}
	} catch (error) {
		throw new Error(
			`Failed to delete PDF from local storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
};

/**
 * Check if a PDF exists in local storage
 */
export const checkPdfExists = async (relativePath: string): Promise<boolean> => {
	try {
		const filePath = path.join(LOCAL_STORAGE_DIR, relativePath);
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
};

/**
 * Get the full file path for a locally stored PDF
 */
export const getLocalPdfPath = (relativePath: string): string => {
	return path.join(LOCAL_STORAGE_DIR, relativePath);
};

/**
 * Get storage directory information
 */
export const getStorageInfo = async (): Promise<{
	directory: string;
	exists: boolean;
	fileCount: number;
}> => {
	try {
		const exists = await fs
			.access(LOCAL_STORAGE_DIR)
			.then(() => true)
			.catch(() => false);

		let fileCount = 0;
		if (exists) {
			const files = await fs.readdir(LOCAL_STORAGE_DIR, { recursive: true });
			fileCount = files.filter((file) => typeof file === 'string' && file.endsWith('.pdf')).length;
		}

		return {
			directory: LOCAL_STORAGE_DIR,
			exists,
			fileCount,
		};
	} catch {
		return {
			directory: LOCAL_STORAGE_DIR,
			exists: false,
			fileCount: 0,
		};
	}
};

export default {
	ensureStorageDirectory,
	savePdfLocally,
	readPdfFromLocal,
	deletePdfFromLocal,
	checkPdfExists,
	getLocalPdfPath,
	getStorageInfo,
};
