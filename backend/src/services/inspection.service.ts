import { Prisma, InspectionStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import {
	CreateInspectionDto,
	UpdateInspectionDto,
	InspectionWithFarm,
	InspectionWithDetails,
} from '../types/inspection.types';
import { CertificateService } from './certificate.service';
import { logger } from '../utils/logger';

export class InspectionService {
	private certificateService: CertificateService;

	constructor() {
		this.certificateService = new CertificateService();
	}
	/**
	 * Create a new inspection with checklist answers
	 */
	async createInspection(data: CreateInspectionDto): Promise<InspectionWithDetails> {
		try {
			const totalQuestions = data.checklist.length;
			const yesAnswers = data.checklist.filter((item) => item.answer === true).length;
			const complianceScore = Math.round((yesAnswers / totalQuestions) * 100);

			const createdInspection = await prisma.$transaction(async (tx) => {
				// Verify farm exists
				const farm = await tx.farm.findUnique({
					where: { id: data.farmId },
					include: { farmer: true },
				});

				if (!farm) {
					throw new AppError('Farm not found', 404);
				}

				// Verify all questions exist and are active
				const questionIds = data.checklist.map((item) => item.questionId);
				const questions = await tx.checklistQuestion.findMany({
					where: {
						id: { in: questionIds },
						isActive: true,
					},
				});

				if (questions.length !== questionIds.length) {
					throw new AppError('One or more checklist questions not found or inactive', 400);
				}

				// Determine status based on compliance score
				let status: InspectionStatus = InspectionStatus.DRAFT;
				if (complianceScore >= 90) {
					status = InspectionStatus.APPROVED;
				} else if (complianceScore >= 80) {
					status = InspectionStatus.SUBMITTED;
				} else {
					status = InspectionStatus.REJECTED;
				}

				// Create inspection
				const inspection = await tx.inspection.create({
					data: {
						farmId: data.farmId,
						inspectorName: data.inspectorName,
						complianceScore,
						status,
						date: new Date(),
					},
				});

				// Create checklist answers
				const checklistData = data.checklist.map((item) => ({
					inspectionId: inspection.id,
					questionId: item.questionId,
					answer: item.answer,
				}));

				await tx.inspectionChecklist.createMany({
					data: checklistData,
				});

				// Return inspection with all related data
				const createdInspection = await tx.inspection.findUniqueOrThrow({
					where: { id: inspection.id },
					include: {
						farm: {
							include: {
								farmer: true,
							},
						},
						checklist: {
							include: {
								question: true,
							},
							orderBy: {
								question: {
									order: 'asc',
								},
							},
						},
					},
				});

				return createdInspection;
			});

			// Generate certificate if compliance >= 90% (auto-approved)
			if (complianceScore >= 90) {
				this.generateCertificateAsync({
					farmId: data.farmId,
					complianceScore,
					inspectorName: data.inspectorName,
					inspectionDate: new Date(),
				});
			}

			return createdInspection;
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new AppError('Inspection with duplicate data already exists', 409);
				}
			}

			throw new AppError('Failed to create inspection', 500);
		}
	}

	/**
	 * Get all inspections
	 */
	async getInspections(
		page: number = 1,
		limit: number = 10,
		search?: string,
		farmId?: string,
		status?: string,
		inspectorName?: string,
	): Promise<{
		inspections: InspectionWithFarm[];
		total: number;
		totalPages: number;
	}> {
		try {
			if (page < 1) {
				throw new AppError('Page must be greater than 0', 400);
			}

			if (limit < 1 || limit > 100) {
				throw new AppError('Limit must be between 1 and 100', 400);
			}

			const where: Prisma.InspectionWhereInput = {};

			if (farmId) {
				const farm = await prisma.farm.findUnique({
					where: { id: farmId },
				});

				if (!farm) {
					throw new AppError('Farm not found', 404);
				}

				where.farmId = farmId;
			}

			if (status) {
				const validStatuses: Record<string, InspectionStatus> = {
					DRAFT: InspectionStatus.DRAFT,
					SUBMITTED: InspectionStatus.SUBMITTED,
					APPROVED: InspectionStatus.APPROVED,
					REJECTED: InspectionStatus.REJECTED,
				};

				const upperStatus = status.toUpperCase();
				if (validStatuses[upperStatus]) {
					where.status = validStatuses[upperStatus];
				}
			}

			if (inspectorName) {
				where.inspectorName = {
					contains: inspectorName,
					mode: 'insensitive',
				};
			}

			if (search) {
				where.OR = [
					{
						inspectorName: {
							contains: search,
							mode: 'insensitive',
						},
					},
					{
						farm: {
							farmName: {
								contains: search,
								mode: 'insensitive',
							},
						},
					},
					{
						farm: {
							location: {
								contains: search,
								mode: 'insensitive',
							},
						},
					},
					{
						farm: {
							farmer: {
								name: {
									contains: search,
									mode: 'insensitive',
								},
							},
						},
					},
				];
			}

			const [inspections, total] = await Promise.all([
				prisma.inspection.findMany({
					where,
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
										email: true,
									},
								},
							},
						},
						checklist: {
							include: {
								question: true,
							},
							orderBy: {
								question: {
									order: 'asc',
								},
							},
						},
					},
					orderBy: {
						date: 'desc',
					},
					skip: (page - 1) * limit,
					take: limit,
				}),
				prisma.inspection.count({ where }),
			]);

			return {
				inspections,
				total,
				totalPages: Math.ceil(total / limit),
			};
		} catch (error) {
			if (error instanceof AppError) throw error;

			throw new AppError('Failed to fetch inspections', 500);
		}
	}

	/**
	 * Get inspection by ID with all related data
	 */
	async getInspectionById(id: string): Promise<InspectionWithDetails> {
		try {
			const inspection = await prisma.inspection.findUnique({
				where: { id },
				include: {
					farm: {
						include: {
							farmer: true,
						},
					},
					checklist: {
						include: {
							question: true,
						},
						orderBy: {
							question: {
								order: 'asc',
							},
						},
					},
				},
			});

			if (!inspection) {
				throw new AppError('Inspection not found', 404);
			}

			return inspection;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch inspection', 500);
		}
	}

	/**
	 * Update inspection by ID
	 */
	async updateInspection(id: string, data: UpdateInspectionDto): Promise<InspectionWithDetails> {
		try {
			let calculatedComplianceScore: number | null = null;

			const updatedInspection = await prisma.$transaction(async (tx) => {
				const existingInspection = await tx.inspection.findUnique({
					where: { id },
				});

				if (!existingInspection) {
					throw new AppError('Inspection not found', 404);
				}

				const updateData: Prisma.InspectionUpdateInput = {};

				if (data.inspectorName) {
					updateData.inspectorName = data.inspectorName;
				}

				if (data.checklist) {
					const questionIds = data.checklist.map((item) => item.questionId);
					const questions = await tx.checklistQuestion.findMany({
						where: {
							id: { in: questionIds },
							isActive: true,
						},
					});

					if (questions.length !== questionIds.length) {
						throw new AppError('One or more checklist questions not found or inactive', 400);
					}

					for (const item of data.checklist) {
						await tx.inspectionChecklist.upsert({
							where: {
								inspectionId_questionId: {
									inspectionId: id,
									questionId: item.questionId,
								},
							},
							update: {
								answer: item.answer,
							},
							create: {
								inspectionId: id,
								questionId: item.questionId,
								answer: item.answer,
							},
						});
					}

					// Get all current answers to calculate compliance score
					const allAnswers = await tx.inspectionChecklist.findMany({
						where: { inspectionId: id },
					});

					// Calculate new compliance score based on ALL answers
					const totalQuestions = allAnswers.length;
					const yesAnswers = allAnswers.filter((item) => item.answer === true).length;
					const complianceScore = Math.round((yesAnswers / totalQuestions) * 100);

					// Store the calculated score for certificate generation
					calculatedComplianceScore = complianceScore;

					// Determine new status based on compliance score
					let status: InspectionStatus = InspectionStatus.DRAFT;
					if (complianceScore >= 90) {
						status = InspectionStatus.APPROVED;
					} else if (complianceScore >= 80) {
						status = InspectionStatus.SUBMITTED;
					} else {
						status = InspectionStatus.REJECTED;
					}

					updateData.complianceScore = complianceScore;
					updateData.status = status;
				}

				// Update inspection
				await tx.inspection.update({
					where: { id },
					data: updateData,
				});

				// Return updated inspection with all related data
				return await tx.inspection.findUniqueOrThrow({
					where: { id },
					include: {
						farm: {
							include: {
								farmer: true,
							},
						},
						checklist: {
							include: {
								question: true,
							},
							orderBy: {
								question: {
									order: 'asc',
								},
							},
						},
					},
				});
			});

			// Generate certificate if compliance >= 90% (auto-approved) and checklist was updated
			if (data.checklist && calculatedComplianceScore !== null && calculatedComplianceScore >= 90) {
				this.generateCertificateAsync({
					farmId: updatedInspection.farmId,
					complianceScore: calculatedComplianceScore,
					inspectorName: updatedInspection.inspectorName,
					inspectionDate: updatedInspection.date,
				});
			}

			return updatedInspection;
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new AppError('Inspection with duplicate data already exists', 409);
				}
			}

			throw new AppError('Failed to update inspection', 500);
		}
	}

	/**
	 * Approve or reject an inspection (manual approval for scores >= 80% but < 90%)
	 */
	async approveInspection(id: string, approved: boolean): Promise<InspectionWithDetails> {
		try {
			const updatedInspection = await prisma.$transaction(async (tx) => {
				const inspection = await tx.inspection.findUnique({
					where: { id },
				});

				if (!inspection) {
					throw new AppError('Inspection not found', 404);
				}

				if (!inspection.complianceScore || inspection.complianceScore < 80) {
					throw new AppError(
						'Inspection does not meet minimum compliance score (80%) for manual approval',
						400,
					);
				}

				const newStatus = approved ? InspectionStatus.APPROVED : InspectionStatus.REJECTED;

				await tx.inspection.update({
					where: { id },
					data: { status: newStatus },
				});

				// Return updated inspection with all related data
				return await tx.inspection.findUniqueOrThrow({
					where: { id },
					include: {
						farm: {
							include: {
								farmer: true,
							},
						},
						checklist: {
							include: {
								question: true,
							},
							orderBy: {
								question: {
									order: 'asc',
								},
							},
						},
					},
				});
			});

			// Generate certificate if approved and compliance >= 80%
			if (approved && updatedInspection.complianceScore && updatedInspection.complianceScore >= 80) {
				this.generateCertificateAsync({
					farmId: updatedInspection.farmId,
					complianceScore: updatedInspection.complianceScore,
					inspectorName: updatedInspection.inspectorName,
					inspectionDate: updatedInspection.date,
				});
			}

			return updatedInspection;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to approve inspection', 500);
		}
	}

	/**
	 * Delete inspection by ID
	 */
	async deleteInspection(id: string): Promise<void> {
		try {
			const inspection = await prisma.inspection.findUnique({
				where: { id },
			});

			if (!inspection) {
				throw new AppError('Inspection not found', 404);
			}

			await prisma.inspection.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to delete inspection', 500);
		}
	}

	/**
	 * Get all active checklist questions
	 */
	async getQuestions(): Promise<
		Array<{
			id: number;
			question: string;
			description: string | null;
			order: number;
		}>
	> {
		try {
			return await prisma.checklistQuestion.findMany({
				where: { isActive: true },
				select: {
					id: true,
					question: true,
					description: true,
					order: true,
				},
				orderBy: { order: 'asc' },
			});
		} catch {
			throw new AppError('Failed to fetch checklist questions', 500);
		}
	}

	/**
	 * Generate certificate asynchronously to prevent transaction rollback
	 */
	private generateCertificateAsync(data: {
		farmId: string;
		complianceScore: number;
		inspectorName: string;
		inspectionDate: Date;
	}): void {
		// Fire and forget - don't await to prevent affecting the main inspection flow
		this.certificateService
			.generateCertificate(data)
			.then(() => {
				logger.info('Certificate generated successfully from inspection approval', {
					farmId: data.farmId,
					complianceScore: data.complianceScore,
					inspectorName: data.inspectorName,
				});
			})
			.catch((error) => {
				logger.error('Failed to generate certificate from inspection approval', {
					farmId: data.farmId,
					complianceScore: data.complianceScore,
					inspectorName: data.inspectorName,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			});
	}
}
