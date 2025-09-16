/**
 * Utility functions for handling certificate URLs
 */

/**
 * Generate a local PDF URL for certificates stored in local storage
 */
export const generateLocalPdfUrl = (certificateNumber: string): string => {
	const port = process.env.PORT || 8080;
	const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
	const fileName = `certificate-${certificateNumber}.pdf`;
	return `${baseUrl}/uploads/certificates/${fileName}`;
};

/**
 * Check if a URL is a local storage URL
 */
export const isLocalStorageUrl = (url: string): boolean => {
	return url.includes('/uploads/certificates/');
};

/**
 * Extract certificate number from local storage URL
 */
export const extractCertificateNumberFromLocalUrl = (url: string): string | null => {
	const match = url.match(/certificate-([^.]+)\.pdf$/);
	return match ? match[1] : null;
};
