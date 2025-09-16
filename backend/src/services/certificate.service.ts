import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError, ServiceErrors } from '../middlewares/errorHandler';
import {
	Certificate,
	CertificateWithDetails,
	CertificateWithFarm,
	GenerateCertificateDto,
} from '../types/certificate.types';
import { generateCertificatePdf } from '../utils/pdfGenerator';
import { uploadPdfToCloudinary, deletePdfFromCloudinary, extractPublicIdFromUrl } from '../utils/storage';
import { savePdfLocally, deletePdfFromLocal } from '../utils/localStorage';
import { generateLocalPdfUrl } from '../utils/certificateUrl';
import { logger } from '../utils/logger';

export class CertificateService {
	/**
	 * Get all certificates
	 */
	async getCertificates(
		page: number = 1,
		limit: number = 10,
		search?: string,
		farmId?: string,
		status?: string,
	): Promise<{
		certificates: CertificateWithFarm[];
		total: number;
		totalPages: number;
	}> {
		try {
			if (page < 1) {
				throw new AppError('Page must be greater than 0', 400, 'INVALID_PAGE');
			}

			if (limit < 1 || limit > 100) {
				throw new AppError('Limit must be between 1 and 100', 400, 'INVALID_LIMIT');
			}

			// Build where clause
			const where: Prisma.CertificateWhereInput = {};

			// Farm ID filter
			if (farmId) {
				where.farmId = farmId;
			}

			// Status filter (active, expired, expiring in 30 days)
			if (status) {
				const now = new Date();
				const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

				switch (status) {
					case 'active':
						where.expiryDate = { gte: now };
						break;
					case 'expired':
						where.expiryDate = { lt: now };
						break;
					case 'expiring':
						where.expiryDate = {
							gte: now,
							lte: thirtyDaysFromNow,
						};
						break;
				}
			}

			// Search filter
			if (search) {
				where.OR = [
					{ certificateNo: { contains: search, mode: 'insensitive' } },
					{ farm: { farmName: { contains: search, mode: 'insensitive' } } },
					{ farm: { location: { contains: search, mode: 'insensitive' } } },
					{ farm: { farmer: { name: { contains: search, mode: 'insensitive' } } } },
				];
			}

			// Get certificates and total count
			const [certificates, total] = await Promise.all([
				prisma.certificate.findMany({
					where,
					orderBy: { createdAt: 'desc' },
					skip: (page - 1) * limit,
					take: limit,
					include: {
						farm: {
							select: {
								id: true,
								farmName: true,
								location: true,
								farmer: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				}),
				prisma.certificate.count({ where }),
			]);

			const totalPages = Math.ceil(total / limit);

			return {
				certificates,
				total,
				totalPages,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch certificates', 500);
		}
	}

	/**
	 * Get certificate by ID
	 */
	async getCertificateById(id: string): Promise<CertificateWithDetails> {
		try {
			ServiceErrors.validateRequiredString(id, 'Certificate ID');

			const certificate = await prisma.certificate.findUnique({
				where: { id },
				include: {
					farm: {
						include: {
							farmer: true,
						},
					},
				},
			});

			if (!certificate) {
				throw ServiceErrors.notFound('Certificate', id);
			}

			return certificate;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch certificate', 500, 'CERTIFICATE_FETCH_FAILED');
		}
	}

	/**
	 * Delete certificate by ID
	 */
	async deleteCertificate(id: string): Promise<void> {
		try {
			ServiceErrors.validateRequiredString(id, 'Certificate ID');

			const certificate = await prisma.certificate.findUnique({
				where: { id },
			});

			if (!certificate) {
				throw ServiceErrors.notFound('Certificate', id);
			}

			if (certificate.pdfUrl) {
				const publicId = extractPublicIdFromUrl(certificate.pdfUrl);
				if (publicId) {
					try {
						await deletePdfFromCloudinary(publicId);
						logger.info('Deleted certificate from Cloudinary', {
							certificateNumber: certificate.certificateNo,
						});
					} catch (cloudinaryError) {
						logger.warn('Failed to delete PDF from Cloudinary', {
							certificateNumber: certificate.certificateNo,
							error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
						});
					}
				}
			}

			try {
				const localFileName = `certificate-${certificate.certificateNo}.pdf`;
				await deletePdfFromLocal(`certificates/${localFileName}`);
				logger.info('Deleted certificate from local storage', {
					certificateNumber: certificate.certificateNo,
				});
			} catch {
				logger.debug('Certificate not found in local storage', {
					certificateNumber: certificate.certificateNo,
					note: 'Expected if stored in cloud',
				});
			}

			await prisma.certificate.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to delete certificate', 500, 'CERTIFICATE_DELETE_FAILED');
		}
	}

	/**
	 * Generate certificate automatically after inspection approval
	 * This is called internally from the inspection service
	 */
	async generateCertificate(data: GenerateCertificateDto): Promise<Certificate> {
		try {
			const farm = await prisma.farm.findUnique({
				where: { id: data.farmId },
				include: {
					farmer: true,
				},
			});

			if (!farm) {
				throw ServiceErrors.notFound('Farm', data.farmId);
			}

			// Generate certificate number
			const certificateNumber = await this.generateCertificateNumber();

			// Calculate dates
			const issueDate = new Date();
			const expiryDate = new Date(issueDate);
			expiryDate.setFullYear(expiryDate.getFullYear() + 1);

			// Generate PDF
			const pdfBuffer = await generateCertificatePdf({
				...data,
				certificateNumber,
				issueDate,
				expiryDate,
				farmerName: farm.farmer.name,
				farmName: farm.farmName,
				farmLocation: farm.location,
				farmArea: farm.areaHa,
			});

			// Try uploading to Cloudinary first, fallback to local storage
			let pdfUrl: string | null = null;
			let storageMessage = '';

			logger.info('Starting certificate generation', { certificateNumber });

			try {
				logger.info('Attempting Cloudinary upload', { certificateNumber });

				const fileName = `certificate-${certificateNumber}.pdf`;
				const uploadResult = await uploadPdfToCloudinary(pdfBuffer, fileName, {
					publicId: `cert_${certificateNumber}`,
					folder: 'organic-certificates',
				});
				pdfUrl = uploadResult.secure_url;
				storageMessage = 'Certificate uploaded to cloud storage successfully';

				logger.info('Cloudinary upload successful', {
					certificateNumber,
					pdfUrl: uploadResult.secure_url,
				});
			} catch (uploadError) {
				logger.warn('Cloudinary upload failed, attempting local storage', {
					certificateNumber,
					error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
				});

				try {
					// Try saving to local storage as fallback
					const fileName = `certificate-${certificateNumber}.pdf`;
					const localFilePath = await savePdfLocally(pdfBuffer, fileName, {
						certificateNumber,
						subfolder: 'certificates',
					});

					// Create local URL for static file serving
					pdfUrl = generateLocalPdfUrl(certificateNumber);
					storageMessage = 'Certificate saved to local storage due to cloud storage failure';

					logger.info('Local storage fallback successful', {
						certificateNumber,
						localPath: localFilePath,
						pdfUrl,
					});
				} catch (localError) {
					logger.error('Both cloud and local storage failed', {
						certificateNumber,
						cloudinaryError: uploadError instanceof Error ? uploadError.message : 'Unknown error',
						localStorageError: localError instanceof Error ? localError.message : 'Unknown error',
					});
					storageMessage = 'Certificate generation failed - unable to save to any storage';
				}
			}

			// Save to database with storage information
			const certificate = await prisma.certificate.create({
				data: {
					farmId: data.farmId,
					certificateNo: certificateNumber,
					issueDate,
					expiryDate,
					pdfUrl,
				},
			});

			logger.info('Certificate record created in database', {
				certificateNumber,
				message: storageMessage,
			});
			return certificate;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to generate certificate', 500, 'CERTIFICATE_GENERATION_FAILED');
		}
	}

	/**
	 * Generate a unique certificate number using cryptographically secure random hash
	 */
	private async generateCertificateNumber(): Promise<string> {
		const year = new Date().getFullYear();
		const prefix = `OC${year}`;

		// Generate cryptographically secure random certificate number
		let certificateNumber: string;
		let isUnique = false;

		// Keep generating until we get a unique certificate number
		do {
			// Generate 8 characters of random hex
			const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
			certificateNumber = `${prefix}-${randomHex}`;

			const existing = await prisma.certificate.findUnique({
				where: { certificateNo: certificateNumber },
			});

			isUnique = !existing;
		} while (!isUnique);

		return certificateNumber;
	}

	/**
	 * Retry uploading PDF for certificates that failed to upload
	 * Note: This requires the original inspection data to regenerate the PDF
	 */
	async retryUploadCertificatePdf(
		certificateId: string,
		inspectionData: {
			complianceScore: number;
			inspectorName: string;
			inspectionDate: Date;
		},
	): Promise<Certificate> {
		try {
			const certificate = await prisma.certificate.findUnique({
				where: { id: certificateId },
				include: {
					farm: {
						include: {
							farmer: true,
						},
					},
				},
			});

			if (!certificate) {
				throw ServiceErrors.notFound('Certificate', certificateId);
			}

			if (certificate.pdfUrl) {
				throw new AppError('Certificate PDF already exists', 400, 'CERTIFICATE_PDF_EXISTS');
			}

			// Regenerate PDF data with the original inspection data
			const pdfBuffer = await generateCertificatePdf({
				farmId: certificate.farmId,
				complianceScore: inspectionData.complianceScore,
				inspectorName: inspectionData.inspectorName,
				inspectionDate: inspectionData.inspectionDate,
				certificateNumber: certificate.certificateNo,
				issueDate: certificate.issueDate,
				expiryDate: certificate.expiryDate,
				farmerName: certificate.farm.farmer.name,
				farmName: certificate.farm.farmName,
				farmLocation: certificate.farm.location,
				farmArea: certificate.farm.areaHa,
			});

			// Retry upload
			const fileName = `certificate-${certificate.certificateNo}.pdf`;
			const uploadResult = await uploadPdfToCloudinary(pdfBuffer, fileName, {
				publicId: `cert_${certificate.certificateNo}`,
				folder: 'organic-certificates',
			});

			// Update database with PDF URL
			const updatedCertificate = await prisma.certificate.update({
				where: { id: certificateId },
				data: {
					pdfUrl: uploadResult.secure_url,
				},
			});

			return updatedCertificate;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to retry certificate PDF upload', 500, 'CERTIFICATE_RETRY_FAILED');
		}
	}
}
