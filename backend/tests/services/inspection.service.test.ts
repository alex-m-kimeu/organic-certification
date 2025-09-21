import { InspectionService } from '../../src/services/inspection.service';
import { CertificateService } from '../../src/services/certificate.service';
import { prisma } from '../../src/config/db';
import { AppError } from '../../src/middlewares/errorHandler';
import { Prisma, InspectionStatus } from '@prisma/client';
import {
	CreateInspectionDto,
	UpdateInspectionDto,
	InspectionWithDetails,
	InspectionWithFarm,
} from '../../src/types/inspection.types';

// Mock the entire db module
jest.mock('../../src/config/db', () => ({
	prisma: {
		$transaction: jest.fn(),
		inspection: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			findUniqueOrThrow: jest.fn(),
		},
		farm: {
			findUnique: jest.fn(),
		},
		checklistQuestion: {
			findMany: jest.fn(),
		},
		inspectionChecklist: {
			createMany: jest.fn(),
			upsert: jest.fn(),
			deleteMany: jest.fn(),
			findMany: jest.fn(),
		},
	},
}));

// Mock the certificate service
jest.mock('../../src/services/certificate.service', () => ({
	CertificateService: jest.fn().mockImplementation(() => ({
		generateCertificate: jest.fn(),
	})),
}));

// Mock logger to avoid console output during tests
jest.mock('../../src/utils/logger', () => ({
	logger: {
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
	},
}));

describe('InspectionService', () => {
	let inspectionService: InspectionService;
	let mockCertificateService: jest.Mocked<CertificateService>;

	// Cast prisma to jest mocks to get proper TypeScript support
	const mockPrisma = prisma as jest.Mocked<typeof prisma>;

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();

		// Create mock certificate service
		mockCertificateService = {
			generateCertificate: jest.fn(),
		} as any;

		// Mock the constructor to return our mock
		(CertificateService as jest.Mock).mockImplementation(() => mockCertificateService);

		inspectionService = new InspectionService();

		// Setup transaction mock to execute callback with the transaction object
		(mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
			// Return the result of calling the callback with the same mockPrisma
			return await callback(mockPrisma);
		});
	});

	describe('createInspection', () => {
		const validInspectionData: CreateInspectionDto = {
			farmId: 'cm123farm456def',
			inspectorName: 'John Inspector',
			checklist: [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: false },
			],
		};

		const mockFarm = {
			id: 'cm123farm456def',
			farmerId: 'farmer1',
			farmName: 'Test Farm',
			location: 'Test Location',
			areaHa: 10.5,
			farmer: {
				id: 'farmer1',
				name: 'John Farmer',
				email: 'farmer@test.com',
				phone: '712345678',
				county: 'Kiambu',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockQuestions = [
			{
				id: 1,
				question: 'Question 1',
				description: 'Description 1',
				isActive: true,
				order: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 2,
				question: 'Question 2',
				description: 'Description 2',
				isActive: true,
				order: 2,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 3,
				question: 'Question 3',
				description: 'Description 3',
				isActive: true,
				order: 3,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 4,
				question: 'Question 4',
				description: 'Description 4',
				isActive: true,
				order: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 5,
				question: 'Question 5',
				description: 'Description 5',
				isActive: true,
				order: 5,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		const mockCreatedInspection = {
			id: 'inspection1',
			farmId: validInspectionData.farmId,
			inspectorName: validInspectionData.inspectorName,
			complianceScore: 80,
			status: InspectionStatus.SUBMITTED,
			date: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockInspectionWithDetails: InspectionWithDetails = {
			...mockCreatedInspection,
			farm: mockFarm,
			checklist: [
				{
					id: 'checklist1',
					inspectionId: 'inspection1',
					questionId: 1,
					answer: true,
					question: mockQuestions[0],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
		};

		it('should create an inspection successfully with compliance score 80% (SUBMITTED status)', async () => {
			// Setup mocks
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);
			(mockPrisma.inspection.create as jest.Mock).mockResolvedValue(mockCreatedInspection);
			(mockPrisma.inspectionChecklist.createMany as jest.Mock).mockResolvedValue({ count: 5 });
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockInspectionWithDetails);

			const result = await inspectionService.createInspection(validInspectionData);

			expect(result).toEqual(mockInspectionWithDetails);
			expect(mockPrisma.farm.findUnique).toHaveBeenCalledWith({
				where: { id: validInspectionData.farmId },
				include: { farmer: true },
			});
			expect(mockPrisma.checklistQuestion.findMany).toHaveBeenCalledWith({
				where: { id: { in: [1, 2, 3, 4, 5] }, isActive: true },
			});
			expect(mockPrisma.inspection.create).toHaveBeenCalledWith({
				data: {
					farmId: validInspectionData.farmId,
					inspectorName: validInspectionData.inspectorName,
					complianceScore: 80,
					status: InspectionStatus.SUBMITTED,
					date: expect.any(Date),
				},
			});
		});

		it('should create an inspection with 90% compliance score (APPROVED status) and trigger certificate generation', async () => {
			const highScoreData = {
				...validInspectionData,
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: true },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const approvedInspection = {
				...mockCreatedInspection,
				complianceScore: 100,
				status: InspectionStatus.APPROVED,
			};

			const approvedInspectionWithDetails = {
				...mockInspectionWithDetails,
				complianceScore: 100,
				status: InspectionStatus.APPROVED,
			};

			// Setup mocks
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);
			(mockPrisma.inspection.create as jest.Mock).mockResolvedValue(approvedInspection);
			(mockPrisma.inspectionChecklist.createMany as jest.Mock).mockResolvedValue({ count: 5 });
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(approvedInspectionWithDetails);
			mockCertificateService.generateCertificate.mockResolvedValue({} as any);

			// Mock setTimeout to execute immediately for testing
			const originalSetTimeout = global.setTimeout;
			(global as any).setTimeout = jest.fn((callback: any) => {
				callback();
				return {} as any;
			});

			const result = await inspectionService.createInspection(highScoreData);

			expect(result.complianceScore).toBe(100);
			expect(result.status).toBe(InspectionStatus.APPROVED);

			// Allow some time for async certificate generation
			await new Promise((resolve) => originalSetTimeout(resolve, 10));

			expect(mockCertificateService.generateCertificate).toHaveBeenCalledWith({
				farmId: highScoreData.farmId,
				complianceScore: 100,
				inspectorName: highScoreData.inspectorName,
				inspectionDate: expect.any(Date),
			});

			// Restore setTimeout
			global.setTimeout = originalSetTimeout;
		});

		it('should create an inspection with low compliance score (REJECTED status)', async () => {
			const lowScoreData = {
				...validInspectionData,
				checklist: [
					{ questionId: 1, answer: false },
					{ questionId: 2, answer: false },
					{ questionId: 3, answer: false },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const rejectedInspection = {
				...mockCreatedInspection,
				complianceScore: 40,
				status: InspectionStatus.REJECTED,
			};

			const rejectedInspectionWithDetails = {
				...mockInspectionWithDetails,
				complianceScore: 40,
				status: InspectionStatus.REJECTED,
			};

			// Setup mocks
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);
			(mockPrisma.inspection.create as jest.Mock).mockResolvedValue(rejectedInspection);
			(mockPrisma.inspectionChecklist.createMany as jest.Mock).mockResolvedValue({ count: 5 });
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(rejectedInspectionWithDetails);

			const result = await inspectionService.createInspection(lowScoreData);

			expect(result.complianceScore).toBe(40);
			expect(result.status).toBe(InspectionStatus.REJECTED);
			expect(mockCertificateService.generateCertificate).not.toHaveBeenCalled();
		});

		it('should throw AppError when farm not found', async () => {
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(inspectionService.createInspection(validInspectionData)).rejects.toThrow(
				new AppError('Farm not found', 404),
			);

			expect(mockPrisma.farm.findUnique).toHaveBeenCalledWith({
				where: { id: validInspectionData.farmId },
				include: { farmer: true },
			});
		});

		it('should throw AppError when questions not found or inactive', async () => {
			const incompleteQuestions = [
				{
					id: 1,
					question: 'Question 1',
					description: 'Description 1',
					isActive: true,
					order: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					question: 'Question 2',
					description: 'Description 2',
					isActive: true,
					order: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]; // Missing questions 3, 4, 5

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(incompleteQuestions);

			await expect(inspectionService.createInspection(validInspectionData)).rejects.toThrow(
				new AppError('One or more checklist questions not found or inactive', 400),
			);
		});

		it('should handle P2002 database constraint errors gracefully', async () => {
			const constraintError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
				code: 'P2002',
				clientVersion: '4.0.0',
			});

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);
			(mockPrisma.inspection.create as jest.Mock).mockRejectedValue(constraintError);

			await expect(inspectionService.createInspection(validInspectionData)).rejects.toThrow(
				new AppError('Inspection with duplicate data already exists', 409),
			);
		});

		it('should handle database errors gracefully', async () => {
			(mockPrisma.farm.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

			await expect(inspectionService.createInspection(validInspectionData)).rejects.toThrow(
				new AppError('Failed to create inspection', 500),
			);
		});
	});

	describe('getInspections', () => {
		const mockInspections: InspectionWithFarm[] = [
			{
				id: 'inspection1',
				farmId: 'farm1',
				date: new Date(),
				inspectorName: 'Inspector 1',
				status: InspectionStatus.APPROVED,
				complianceScore: 95,
				createdAt: new Date(),
				updatedAt: new Date(),
				farm: {
					id: 'farm1',
					farmName: 'Farm 1',
					location: 'Location 1',
					farmer: {
						id: 'farmer1',
						name: 'Farmer 1',
						email: 'farmer1@test.com',
					},
				},
				checklist: [],
			},
			{
				id: 'inspection2',
				farmId: 'farm2',
				date: new Date(),
				inspectorName: 'Inspector 2',
				status: InspectionStatus.SUBMITTED,
				complianceScore: 85,
				createdAt: new Date(),
				updatedAt: new Date(),
				farm: {
					id: 'farm2',
					farmName: 'Farm 2',
					location: 'Location 2',
					farmer: {
						id: 'farmer2',
						name: 'Farmer 2',
						email: 'farmer2@test.com',
					},
				},
				checklist: [],
			},
		];

		it('should return paginated inspections with default pagination', async () => {
			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue(mockInspections);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(2);

			const result = await inspectionService.getInspections();

			expect(result).toEqual({
				inspections: mockInspections,
				total: 2,
				totalPages: 1,
			});

			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith({
				where: {},
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
				skip: 0,
				take: 10,
			});
		});

		it('should handle custom pagination parameters', async () => {
			const page = 2;
			const limit = 5;
			const paginatedInspections = [mockInspections[0]];

			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue(paginatedInspections);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(7);

			const result = await inspectionService.getInspections(page, limit);

			expect(result).toEqual({
				inspections: paginatedInspections,
				total: 7,
				totalPages: 2,
			});

			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					skip: 5, // (page - 1) * limit = (2 - 1) * 5
					take: 5,
				}),
			);
		});

		it('should handle search functionality', async () => {
			const searchTerm = 'Test Farm';
			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue([mockInspections[0]]);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(1);

			const result = await inspectionService.getInspections(1, 10, searchTerm);

			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						OR: [
							{
								inspectorName: {
									contains: searchTerm,
									mode: 'insensitive',
								},
							},
							{
								farm: {
									farmName: {
										contains: searchTerm,
										mode: 'insensitive',
									},
								},
							},
							{
								farm: {
									location: {
										contains: searchTerm,
										mode: 'insensitive',
									},
								},
							},
							{
								farm: {
									farmer: {
										name: {
											contains: searchTerm,
											mode: 'insensitive',
										},
									},
								},
							},
						],
					},
				}),
			);

			expect(result.inspections).toHaveLength(1);
		});

		it('should filter by farmId when provided', async () => {
			const farmId = 'farm1';
			const mockFarm = { id: farmId, farmName: 'Test Farm' };

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue([mockInspections[0]]);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(1);

			const result = await inspectionService.getInspections(1, 10, undefined, farmId);

			expect(mockPrisma.farm.findUnique).toHaveBeenCalledWith({
				where: { id: farmId },
			});

			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						farmId,
					},
				}),
			);

			expect(result.inspections).toHaveLength(1);
		});

		it('should throw AppError when farm not found for filtering', async () => {
			const farmId = 'nonexistent-farm';

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(inspectionService.getInspections(1, 10, undefined, farmId)).rejects.toThrow(
				new AppError('Farm not found', 404),
			);
		});

		it('should filter by status when provided', async () => {
			const status = 'APPROVED';
			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue([mockInspections[0]]);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(1);

			await inspectionService.getInspections(1, 10, undefined, undefined, status);

			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						status: InspectionStatus.APPROVED,
					},
				}),
			);
		});

		it('should filter by inspector name when provided', async () => {
			const inspectorName = 'John Inspector';
			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue([mockInspections[0]]);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(1);

			await inspectionService.getInspections(1, 10, undefined, undefined, undefined, inspectorName);

			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						inspectorName: {
							contains: inspectorName,
							mode: 'insensitive',
						},
					},
				}),
			);
		});

		it('should validate pagination parameters', async () => {
			await expect(inspectionService.getInspections(0, 10)).rejects.toThrow(
				new AppError('Page must be greater than 0', 400),
			);

			await expect(inspectionService.getInspections(1, 0)).rejects.toThrow(
				new AppError('Limit must be between 1 and 100', 400),
			);

			await expect(inspectionService.getInspections(1, 101)).rejects.toThrow(
				new AppError('Limit must be between 1 and 100', 400),
			);
		});

		it('should not throw error for invalid status (service handles gracefully)', async () => {
			const invalidStatus = 'INVALID_STATUS';
			(mockPrisma.inspection.findMany as jest.Mock).mockResolvedValue([mockInspections[0]]);
			(mockPrisma.inspection.count as jest.Mock).mockResolvedValue(1);

			// Service doesn't validate status - it just ignores invalid ones
			const result = await inspectionService.getInspections(1, 10, undefined, undefined, invalidStatus);

			expect(result.inspections).toHaveLength(1);
			expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {}, // Invalid status is ignored, so where clause remains empty
				}),
			);
		});
	});

	describe('getInspectionById', () => {
		const inspectionId = 'cm123inspection456def';
		const mockInspectionWithDetails: InspectionWithDetails = {
			id: inspectionId,
			farmId: 'farm1',
			date: new Date(),
			inspectorName: 'John Inspector',
			status: InspectionStatus.APPROVED,
			complianceScore: 90,
			createdAt: new Date(),
			updatedAt: new Date(),
			farm: {
				id: 'farm1',
				farmerId: 'farmer1',
				farmName: 'Test Farm',
				location: 'Test Location',
				areaHa: 10.5,
				createdAt: new Date(),
				updatedAt: new Date(),
				farmer: {
					id: 'farmer1',
					name: 'John Farmer',
					email: 'farmer@test.com',
					phone: '712345678',
					county: 'Kiambu',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			},
			checklist: [
				{
					id: 'checklist1',
					inspectionId,
					questionId: 1,
					answer: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					question: {
						id: 1,
						question: 'Test Question 1',
						description: 'Test Description 1',
						isActive: true,
						order: 1,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			],
		};

		it('should return inspection when found', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(mockInspectionWithDetails);

			const result = await inspectionService.getInspectionById(inspectionId);

			expect(result).toEqual(mockInspectionWithDetails);
			expect(mockPrisma.inspection.findUnique).toHaveBeenCalledWith({
				where: { id: inspectionId },
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

		it('should throw AppError when inspection not found', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(inspectionService.getInspectionById(inspectionId)).rejects.toThrow(
				new AppError('Inspection not found', 404),
			);

			expect(mockPrisma.inspection.findUnique).toHaveBeenCalledWith({
				where: { id: inspectionId },
				include: expect.any(Object),
			});
		});

		it('should handle database errors gracefully', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

			await expect(inspectionService.getInspectionById(inspectionId)).rejects.toThrow(
				new AppError('Failed to fetch inspection', 500),
			);
		});
	});

	describe('updateInspection', () => {
		const inspectionId = 'cm123inspection456def';
		const updateData: UpdateInspectionDto = {
			inspectorName: 'Updated Inspector',
			checklist: [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: false },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: true },
			],
		};

		const mockExistingInspection = {
			id: inspectionId,
			farmId: 'farm1',
			inspectorName: 'Original Inspector',
			complianceScore: 80,
			status: InspectionStatus.SUBMITTED,
			date: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockQuestions = [
			{
				id: 1,
				question: 'Question 1',
				description: 'Description 1',
				isActive: true,
				order: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 2,
				question: 'Question 2',
				description: 'Description 2',
				isActive: true,
				order: 2,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 3,
				question: 'Question 3',
				description: 'Description 3',
				isActive: true,
				order: 3,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 4,
				question: 'Question 4',
				description: 'Description 4',
				isActive: true,
				order: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 5,
				question: 'Question 5',
				description: 'Description 5',
				isActive: true,
				order: 5,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		const mockUpdatedInspection: InspectionWithDetails = {
			...mockExistingInspection,
			inspectorName: updateData.inspectorName!,
			complianceScore: 80,
			farm: {
				id: 'farm1',
				farmerId: 'farmer1',
				farmName: 'Test Farm',
				location: 'Test Location',
				areaHa: 10.5,
				createdAt: new Date(),
				updatedAt: new Date(),
				farmer: {
					id: 'farmer1',
					name: 'John Farmer',
					email: 'farmer@test.com',
					phone: '712345678',
					county: 'Kiambu',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			},
			checklist: [
				{
					id: 'checklist1',
					inspectionId,
					questionId: 1,
					answer: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					question: mockQuestions[0],
				},
			],
		};

		it('should update inspection successfully', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(mockExistingInspection);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);
			(mockPrisma.inspectionChecklist.upsert as jest.Mock).mockResolvedValue({});
			(mockPrisma.inspectionChecklist.findMany as jest.Mock).mockResolvedValue([
				{ inspectionId, questionId: 1, answer: true },
				{ inspectionId, questionId: 2, answer: true },
				{ inspectionId, questionId: 3, answer: false },
				{ inspectionId, questionId: 4, answer: true },
				{ inspectionId, questionId: 5, answer: true },
			]);
			(mockPrisma.inspection.update as jest.Mock).mockResolvedValue(mockUpdatedInspection);
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUpdatedInspection);

			const result = await inspectionService.updateInspection(inspectionId, updateData);

			expect(result).toEqual(mockUpdatedInspection);
			expect(mockPrisma.inspection.findUnique).toHaveBeenCalledWith({ where: { id: inspectionId } });
			expect(mockPrisma.inspection.update).toHaveBeenCalledWith({
				where: { id: inspectionId },
				data: expect.objectContaining({
					inspectorName: updateData.inspectorName,
					complianceScore: 80,
					status: InspectionStatus.SUBMITTED,
				}),
			});
		});

		it('should throw AppError when inspection not found for update', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(inspectionService.updateInspection(inspectionId, updateData)).rejects.toThrow(
				new AppError('Inspection not found', 404),
			);
		});

		it('should trigger certificate generation for high compliance score', async () => {
			const highScoreUpdate = {
				...updateData,
				checklist: [
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: true },
					{ questionId: 4, answer: true },
					{ questionId: 5, answer: true },
				],
			};

			const approvedInspection = {
				...mockUpdatedInspection,
				complianceScore: 100,
				status: InspectionStatus.APPROVED,
			};

			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(mockExistingInspection);
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);
			(mockPrisma.inspectionChecklist.upsert as jest.Mock).mockResolvedValue({});
			(mockPrisma.inspectionChecklist.findMany as jest.Mock).mockResolvedValue([
				{ inspectionId, questionId: 1, answer: true },
				{ inspectionId, questionId: 2, answer: true },
				{ inspectionId, questionId: 3, answer: true },
				{ inspectionId, questionId: 4, answer: true },
				{ inspectionId, questionId: 5, answer: true },
			]);
			(mockPrisma.inspection.update as jest.Mock).mockResolvedValue(approvedInspection);
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(approvedInspection);
			mockCertificateService.generateCertificate.mockResolvedValue({} as any);

			// Mock setTimeout for certificate generation
			const originalSetTimeout = global.setTimeout;
			(global as any).setTimeout = jest.fn((callback: any) => {
				callback();
				return {} as any;
			});

			const result = await inspectionService.updateInspection(inspectionId, highScoreUpdate);

			expect(result.complianceScore).toBe(100);
			expect(result.status).toBe(InspectionStatus.APPROVED);

			// Allow some time for async certificate generation
			await new Promise((resolve) => originalSetTimeout(resolve, 10));

			expect(mockCertificateService.generateCertificate).toHaveBeenCalledWith({
				farmId: mockExistingInspection.farmId,
				complianceScore: 100,
				inspectorName: highScoreUpdate.inspectorName!,
				inspectionDate: expect.any(Date),
			});

			// Restore setTimeout
			global.setTimeout = originalSetTimeout;
		});
	});

	describe('approveInspection', () => {
		const inspectionId = 'cm123inspection456def';
		const mockInspection = {
			id: inspectionId,
			farmId: 'farm1',
			inspectorName: 'John Inspector',
			complianceScore: 85,
			status: InspectionStatus.SUBMITTED,
			date: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockApprovedInspection: InspectionWithDetails = {
			...mockInspection,
			status: InspectionStatus.APPROVED,
			farm: {
				id: 'farm1',
				farmerId: 'farmer1',
				farmName: 'Test Farm',
				location: 'Test Location',
				areaHa: 10.5,
				createdAt: new Date(),
				updatedAt: new Date(),
				farmer: {
					id: 'farmer1',
					name: 'John Farmer',
					email: 'farmer@test.com',
					phone: '712345678',
					county: 'Kiambu',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			},
			checklist: [],
		};

		it('should approve inspection successfully and generate certificate', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(mockInspection);
			(mockPrisma.inspection.update as jest.Mock).mockResolvedValue(mockApprovedInspection);
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockApprovedInspection);
			mockCertificateService.generateCertificate.mockResolvedValue({} as any);

			// Mock setTimeout for certificate generation
			const originalSetTimeout = global.setTimeout;
			(global as any).setTimeout = jest.fn((callback: any) => {
				callback();
				return {} as any;
			});

			const result = await inspectionService.approveInspection(inspectionId, true);

			expect(result.status).toBe(InspectionStatus.APPROVED);
			expect(mockPrisma.inspection.update).toHaveBeenCalledWith({
				where: { id: inspectionId },
				data: { status: InspectionStatus.APPROVED },
			});

			// Allow some time for async certificate generation
			await new Promise((resolve) => originalSetTimeout(resolve, 10));

			expect(mockCertificateService.generateCertificate).toHaveBeenCalledWith({
				farmId: mockInspection.farmId,
				complianceScore: mockInspection.complianceScore,
				inspectorName: mockInspection.inspectorName,
				inspectionDate: mockInspection.date,
			});

			// Restore setTimeout
			global.setTimeout = originalSetTimeout;
		});

		it('should reject inspection successfully', async () => {
			const mockRejectedInspection = {
				...mockApprovedInspection,
				status: InspectionStatus.REJECTED,
			};

			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(mockInspection);
			(mockPrisma.inspection.update as jest.Mock).mockResolvedValue(mockRejectedInspection);
			(mockPrisma.inspection.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockRejectedInspection);

			const result = await inspectionService.approveInspection(inspectionId, false);

			expect(result.status).toBe(InspectionStatus.REJECTED);
			expect(mockPrisma.inspection.update).toHaveBeenCalledWith({
				where: { id: inspectionId },
				data: { status: InspectionStatus.REJECTED },
			});
			expect(mockCertificateService.generateCertificate).not.toHaveBeenCalled();
		});

		it('should throw AppError when inspection not found', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(inspectionService.approveInspection(inspectionId, true)).rejects.toThrow(
				new AppError('Inspection not found', 404),
			);
		});

		it('should throw AppError when compliance score is below 80%', async () => {
			const lowScoreInspection = {
				...mockInspection,
				complianceScore: 75,
			};

			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(lowScoreInspection);

			await expect(inspectionService.approveInspection(inspectionId, true)).rejects.toThrow(
				new AppError('Inspection does not meet minimum compliance score (80%) for manual approval', 400),
			);
		});
	});

	describe('deleteInspection', () => {
		const inspectionId = 'cm123inspection456def';
		const mockInspection = {
			id: inspectionId,
			farmId: 'farm1',
			inspectorName: 'John Inspector',
			complianceScore: 85,
			status: InspectionStatus.DRAFT,
			date: new Date(),
		};

		it('should delete inspection successfully', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(mockInspection);
			(mockPrisma.inspection.delete as jest.Mock).mockResolvedValue(mockInspection);

			await inspectionService.deleteInspection(inspectionId);

			expect(mockPrisma.inspection.findUnique).toHaveBeenCalledWith({
				where: { id: inspectionId },
			});
			expect(mockPrisma.inspection.delete).toHaveBeenCalledWith({
				where: { id: inspectionId },
			});
		});

		it('should throw AppError when inspection not found', async () => {
			(mockPrisma.inspection.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(inspectionService.deleteInspection(inspectionId)).rejects.toThrow(
				new AppError('Inspection not found', 404),
			);

			expect(mockPrisma.inspection.delete).not.toHaveBeenCalled();
		});
	});

	describe('getQuestions', () => {
		const mockQuestions = [
			{
				id: 1,
				question: 'Any synthetic inputs in the last 36 months?',
				description: 'Check if synthetic fertilizers or pesticides were used',
				order: 1,
			},
			{
				id: 2,
				question: 'Are crops rotated regularly?',
				description: 'Verify crop rotation practices',
				order: 2,
			},
		];

		it('should return active questions successfully', async () => {
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockResolvedValue(mockQuestions);

			const result = await inspectionService.getQuestions();

			expect(result).toEqual(mockQuestions);
			expect(mockPrisma.checklistQuestion.findMany).toHaveBeenCalledWith({
				where: { isActive: true },
				select: {
					id: true,
					question: true,
					description: true,
					order: true,
				},
				orderBy: { order: 'asc' },
			});
		});

		it('should handle database errors gracefully', async () => {
			(mockPrisma.checklistQuestion.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

			await expect(inspectionService.getQuestions()).rejects.toThrow(
				new AppError('Failed to fetch checklist questions', 500),
			);
		});
	});
});
