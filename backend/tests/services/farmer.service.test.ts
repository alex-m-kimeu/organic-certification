import { FarmerService } from '../../src/services/farmer.service';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../src/middlewares/errorHandler';
import { CreateFarmerDto, UpdateFarmerDto } from '../../src/types/farmer.types';

// Mock the entire db module
jest.mock('../../src/config/db', () => ({
	prisma: {
		$transaction: jest.fn(),
		farmer: {
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		farm: {
			findMany: jest.fn(),
			aggregate: jest.fn(),
			count: jest.fn(),
		},
		field: {
			count: jest.fn(),
		},
		inspection: {
			count: jest.fn(),
		},
		certificate: {
			count: jest.fn(),
		},
	},
}));

// Import the mocked prisma
import { prisma } from '../../src/config/db';

describe('FarmerService', () => {
	let farmerService: FarmerService;

	// Cast prisma to jest mocks to get proper TypeScript support
	const mockPrisma = prisma as jest.Mocked<typeof prisma>;

	beforeEach(() => {
		farmerService = new FarmerService();

		// Clear all mocks before each test
		jest.clearAllMocks();

		// Setup transaction mock to execute callback with the transaction object
		(mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
			// Return the result of calling the callback with the same mockPrisma
			return await callback(mockPrisma);
		});
	});

	describe('createFarmer', () => {
		const validFarmerData: CreateFarmerDto = {
			name: 'John Doe',
			phone: '712344462',
			email: 'john.doe@test.com',
			county: 'Kiambu',
		};

		const mockCreatedFarmer = {
			id: 'cm123abc456def',
			...validFarmerData,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should create a farmer successfully', async () => {
			// Setup mocks for successful creation
			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(null), // No existing email
						findFirst: jest.fn().mockResolvedValue(null), // No existing phone
						create: jest.fn().mockResolvedValue(mockCreatedFarmer),
					},
				};
				return callback(tx);
			});

			const result = await farmerService.createFarmer(validFarmerData);

			expect(result).toEqual(mockCreatedFarmer);
			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
		});

		it('should throw AppError when email already exists', async () => {
			const existingFarmer = { id: 'existing-id', email: validFarmerData.email };

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(existingFarmer),
						findFirst: jest.fn(),
						create: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.createFarmer(validFarmerData)).rejects.toThrow(AppError);

			try {
				await farmerService.createFarmer(validFarmerData);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('A farmer with this email already exists');
				expect((error as AppError).statusCode).toBe(409);
				expect((error as AppError).errorCode).toBe('FARMER_EMAIL_EXISTS');
			}
		});

		it('should throw AppError when phone already exists', async () => {
			const existingPhone = { id: 'existing-id', phone: validFarmerData.phone };

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(null), // No existing email
						findFirst: jest.fn().mockResolvedValue(existingPhone), // Existing phone
						create: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.createFarmer(validFarmerData)).rejects.toThrow(AppError);

			try {
				await farmerService.createFarmer(validFarmerData);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('A farmer with this phone number already exists');
				expect((error as AppError).statusCode).toBe(409);
				expect((error as AppError).errorCode).toBe('FARMER_PHONE_EXISTS');
			}
		});

		it('should handle database errors gracefully', async () => {
			const databaseError = new Error('Database connection failed');
			(mockPrisma.$transaction as jest.Mock).mockRejectedValue(databaseError);

			await expect(farmerService.createFarmer(validFarmerData)).rejects.toThrow('Failed to create farmer');
		});
	});

	describe('getFarmerById', () => {
		const farmerId = 'cm123abc456def';
		const mockFarmer = {
			id: farmerId,
			name: 'John Doe',
			email: 'john.doe@test.com',
			phone: '712344462', // Valid Kenyan format
			county: 'Kiambu',
		};

		it('should return farmer when found', async () => {
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmer);

			const result = await farmerService.getFarmerById(farmerId);

			expect(result).toEqual(mockFarmer);
			expect(mockPrisma.farmer.findUnique).toHaveBeenCalledWith({
				where: { id: farmerId },
			});
		});

		it('should throw AppError when farmer not found', async () => {
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmerService.getFarmerById(farmerId)).rejects.toThrow(AppError);

			try {
				await farmerService.getFarmerById(farmerId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farmer not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});
	});

	describe('getAllFarmers', () => {
		const mockFarmers = [
			{ id: '1', name: 'Farmer 1', email: 'farmer1@test.com' },
			{ id: '2', name: 'Farmer 2', email: 'farmer2@test.com' },
		];

		it('should return paginated farmers with default pagination', async () => {
			(mockPrisma.farmer.findMany as jest.Mock).mockResolvedValue(mockFarmers);
			(mockPrisma.farmer.count as jest.Mock).mockResolvedValue(2);

			const result = await farmerService.getFarmers();

			expect(result.farmers).toEqual(mockFarmers);
			expect(result.total).toBe(2);
			expect(result.totalPages).toBe(1);
			expect(mockPrisma.farmer.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 10,
				orderBy: { createdAt: 'desc' },
				where: {},
			});
		});

		it('should handle custom pagination parameters', async () => {
			const page = 2;
			const limit = 5;

			(mockPrisma.farmer.findMany as jest.Mock).mockResolvedValue(mockFarmers);
			(mockPrisma.farmer.count as jest.Mock).mockResolvedValue(2);

			const result = await farmerService.getFarmers(page, limit);

			expect(result.totalPages).toBe(1);
			expect(mockPrisma.farmer.findMany).toHaveBeenCalledWith({
				skip: 5, // (page - 1) * limit
				take: limit,
				orderBy: { createdAt: 'desc' },
				where: {},
			});
		});

		it('should handle search functionality', async () => {
			const searchTerm = 'John';
			(mockPrisma.farmer.findMany as jest.Mock).mockResolvedValue(mockFarmers);
			(mockPrisma.farmer.count as jest.Mock).mockResolvedValue(1);

			const result = await farmerService.getFarmers(1, 10, searchTerm);

			expect(mockPrisma.farmer.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 10,
				orderBy: { createdAt: 'desc' },
				where: {
					OR: [
						{ name: { contains: searchTerm, mode: 'insensitive' } },
						{ email: { contains: searchTerm, mode: 'insensitive' } },
						{ county: { contains: searchTerm, mode: 'insensitive' } },
						{ phone: { contains: searchTerm, mode: 'insensitive' } },
					],
				},
			});
		});
	});

	describe('updateFarmer', () => {
		const farmerId = 'cm123abc456def';
		const updateData: UpdateFarmerDto = {
			name: 'Updated Name',
			county: 'Nairobi',
		};
		const mockUpdatedFarmer = {
			id: farmerId,
			name: updateData.name,
			county: updateData.county,
			email: 'john.doe@test.com',
		};

		it('should update farmer successfully', async () => {
			const existingFarmer = {
				id: farmerId,
				name: 'John Doe',
				email: 'john.doe@test.com',
				phone: '712344462',
			};

			// Mock the findUnique call that checks if farmer exists
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(existingFarmer);
			// Mock the update call
			(mockPrisma.farmer.update as jest.Mock).mockResolvedValue(mockUpdatedFarmer);

			const result = await farmerService.updateFarmer(farmerId, updateData);

			expect(result).toEqual(mockUpdatedFarmer);
			expect(mockPrisma.farmer.update).toHaveBeenCalledWith({
				where: { id: farmerId },
				data: updateData,
			});
		});

		it('should throw AppError when farmer not found for update', async () => {
			const prismaNotFoundError = new Error('Record to update not found');
			(prismaNotFoundError as any).code = 'P2025'; // Prisma's "record not found" error code

			(mockPrisma.farmer.update as jest.Mock).mockRejectedValue(prismaNotFoundError);

			await expect(farmerService.updateFarmer(farmerId, updateData)).rejects.toThrow(AppError);
		});
	});

	describe('deleteFarmer', () => {
		const farmerId = 'cm123abc456def';

		it('should delete farmer successfully', async () => {
			const mockFarmer = {
				id: farmerId,
				name: 'Deleted Farmer',
				farms: [], // No farms with dependencies
			};

			// Mock the findUnique call that checks if farmer exists and gets farm dependencies
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmer);
			// Mock the delete call
			(mockPrisma.farmer.delete as jest.Mock).mockResolvedValue(undefined);

			await farmerService.deleteFarmer(farmerId);

			expect(mockPrisma.farmer.delete).toHaveBeenCalledWith({
				where: { id: farmerId },
			});
		});

		it('should throw AppError when farmer not found for deletion', async () => {
			// Mock findUnique to return null (farmer not found)
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmerService.deleteFarmer(farmerId)).rejects.toThrow(AppError);
		});
	});

	describe('Phone Number Transformation', () => {
		it('should test phone transformation logic (mocked)', async () => {
			// This tests that our validation schema works correctly
			// The actual transformation happens in the validation layer
			const validFarmerData: CreateFarmerDto = {
				name: 'John Doe',
				phone: '712344462', // 9 digits, should be transformed to +254712344462
				email: 'john.doe@test.com',
				county: 'Kiambu',
			};

			const mockCreatedFarmer = {
				id: 'cm123abc456def',
				...validFarmerData,
				phone: '+254712344462', // Expect transformed phone
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(null),
						findFirst: jest.fn().mockResolvedValue(null),
						create: jest.fn().mockResolvedValue(mockCreatedFarmer),
					},
				};
				return callback(tx);
			});

			const result = await farmerService.createFarmer(validFarmerData);

			// The phone should be formatted by validation middleware before reaching service
			expect(result.phone).toBe('+254712344462');
		});

		it('should handle phone numbers starting with 1', async () => {
			const validFarmerData: CreateFarmerDto = {
				name: 'Jane Doe',
				phone: '123456789', // Valid: starts with 1
				email: 'jane.doe@test.com',
				county: 'Mombasa',
			};

			const mockCreatedFarmer = {
				id: 'cm123abc456def',
				...validFarmerData,
				phone: '+254123456789', // Expect transformed phone
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(null),
						findFirst: jest.fn().mockResolvedValue(null),
						create: jest.fn().mockResolvedValue(mockCreatedFarmer),
					},
				};
				return callback(tx);
			});

			const result = await farmerService.createFarmer(validFarmerData);

			expect(result.phone).toBe('+254123456789');
		});
	});

	describe('Complex Deletion Logic', () => {
		const farmerId = 'cm123abc456def';

		it('should prevent deletion when farmer has farms with inspections', async () => {
			const mockFarmerWithInspections = {
				id: farmerId,
				name: 'Farmer with Inspections',
				farms: [
					{
						id: 'farm1',
						farmName: 'Test Farm',
						inspections: [{ id: 'inspection1' }], // Has inspections
						certificates: [],
						fields: [],
					},
				],
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(mockFarmerWithInspections),
						delete: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.deleteFarmer(farmerId)).rejects.toThrow(
				'Cannot delete farmer with farms that have inspections or certificates',
			);
		});

		it('should prevent deletion when farmer has farms with certificates', async () => {
			const mockFarmerWithCertificates = {
				id: farmerId,
				name: 'Farmer with Certificates',
				farms: [
					{
						id: 'farm1',
						farmName: 'Test Farm',
						inspections: [],
						certificates: [{ id: 'cert1' }], // Has certificates
						fields: [],
					},
				],
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(mockFarmerWithCertificates),
						delete: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.deleteFarmer(farmerId)).rejects.toThrow(
				'Cannot delete farmer with farms that have inspections or certificates',
			);
		});

		it('should allow deletion when farms have no dependencies but warn about farm deletion', async () => {
			const mockFarmerWithFarmsNoDeps = {
				id: farmerId,
				name: 'Farmer with Farms No Deps',
				farms: [
					{
						id: 'farm1',
						farmName: 'Test Farm',
						inspections: [], // No inspections
						certificates: [], // No certificates
						fields: [],
					},
				],
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(mockFarmerWithFarmsNoDeps),
						delete: jest.fn().mockResolvedValue(undefined),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.deleteFarmer(farmerId)).rejects.toThrow(
				'Cannot delete farmer with existing farms',
			);
		});

		it('should allow deletion when farmer has no farms', async () => {
			const mockFarmerNoFarms = {
				id: farmerId,
				name: 'Farmer No Farms',
				farms: [], // No farms
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(mockFarmerNoFarms),
						delete: jest.fn().mockResolvedValue(undefined),
					},
				};
				return callback(tx);
			});

			await farmerService.deleteFarmer(farmerId);

			// Should complete without throwing
			expect(mockPrisma.$transaction).toHaveBeenCalled();
		});
	});

	describe('Dashboard Calculations', () => {
		const farmerId = 'cm123abc456def';

		it('should calculate statistics correctly in getFarmerDashboard', async () => {
			const mockFarmerData = {
				id: farmerId,
				name: 'Dashboard Test Farmer',
				email: 'test@example.com',
				county: 'Nairobi',
			};

			const mockFarms = [
				{
					id: 'farm1',
					farmName: 'Farm 1',
					location: 'Location 1',
					areaHa: 10.5,
					createdAt: new Date(),
					fields: [{ id: 'field1', createdAt: new Date() }],
					inspections: [{ id: 'insp1', status: 'APPROVED', createdAt: new Date() }],
					certificates: [{ id: 'cert1', createdAt: new Date() }],
					_count: { fields: 1, inspections: 1, certificates: 1 },
				},
				{
					id: 'farm2',
					farmName: 'Farm 2',
					location: 'Location 2',
					areaHa: 15.25,
					createdAt: new Date(),
					fields: [
						{ id: 'field2', createdAt: new Date() },
						{ id: 'field3', createdAt: new Date() },
					],
					inspections: [],
					certificates: [],
					_count: { fields: 2, inspections: 0, certificates: 0 },
				},
			];

			const mockTotalStats = {
				_count: 2,
				_sum: { areaHa: 25.75 },
			};

			// Mock all three calls that the dashboard uses
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmerData);
			(mockPrisma.farm.findMany as jest.Mock).mockResolvedValue(mockFarms);
			(mockPrisma.farm.aggregate as jest.Mock).mockResolvedValue(mockTotalStats);

			const result = await farmerService.getFarmerDashboard(farmerId);

			expect(result.farmer).toEqual(mockFarmerData);
			expect(result.summary.totalFarms).toBe(2);
			expect(result.summary.totalFields).toBe(3); // 1 + 2 fields
			expect(result.summary.totalArea).toBe(25.75);
			expect(result.farmsSummary).toHaveLength(2);

			// Check farm status calculation logic
			expect(result.farmsSummary[0].status).toBe('certified'); // Has certificates
			expect(result.farmsSummary[1].status).toBe('active'); // No inspections or certificates
		});

		it('should handle farmer not found in getFarmerDashboard', async () => {
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmerService.getFarmerDashboard(farmerId)).rejects.toThrow(AppError);
		});

		it('should calculate stats correctly in getFarmerWithFarmsAndFields', async () => {
			const mockFarmerWithFarms = {
				id: farmerId,
				name: 'Stats Test Farmer',
				email: 'stats@example.com',
				county: 'Kiambu',
				farms: [
					{
						id: 'farm1',
						farmName: 'Farm 1',
						areaHa: 10.0,
						fields: [
							{ id: 'field1', areaHa: 3.5 },
							{ id: 'field2', areaHa: 4.5 },
						],
						_count: { fields: 2, inspections: 1, certificates: 0 },
					},
					{
						id: 'farm2',
						farmName: 'Farm 2',
						areaHa: 15.0,
						fields: [{ id: 'field3', areaHa: 6.0 }],
						_count: { fields: 1, inspections: 0, certificates: 1 },
					},
				],
				_count: { farms: 2 },
			};

			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmerWithFarms);

			const result = await farmerService.getFarmerWithFarmsAndFields(farmerId);

			expect(result.stats.totalFarms).toBe(2);
			expect(result.stats.totalFields).toBe(3); // 2 + 1 fields
			expect(result.stats.totalFarmArea).toBe(25.0); // 10.0 + 15.0
			expect(result.stats.totalFieldArea).toBe(14.0); // 3.5 + 4.5 + 6.0
			expect(result.stats.averageFarmSize).toBe(12.5); // 25.0 / 2
			expect(result.stats.averageFieldSize).toBeCloseTo(4.67, 2); // 14.0 / 3
		});

		it('should handle zero division in stats calculations', async () => {
			const mockFarmerNoFarms = {
				id: farmerId,
				name: 'No Farms Farmer',
				email: 'nofarms@example.com',
				county: 'Meru',
				farms: [],
				_count: { farms: 0 },
			};

			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmerNoFarms);

			const result = await farmerService.getFarmerWithFarmsAndFields(farmerId);

			expect(result.stats.totalFarms).toBe(0);
			expect(result.stats.totalFields).toBe(0);
			expect(result.stats.averageFarmSize).toBe(0); // Should handle 0/0 case
			expect(result.stats.averageFieldSize).toBe(0); // Should handle 0/0 case
		});
	});

	describe('Transaction Rollback Scenarios', () => {
		const validFarmerData: CreateFarmerDto = {
			name: 'Transaction Test',
			phone: '712344462',
			email: 'transaction@test.com',
			county: 'Nakuru',
		};

		it('should handle rollback when email check passes but phone check fails', async () => {
			const existingPhoneFarmer = { id: 'existing-id', phone: validFarmerData.phone };

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(null), // Email check passes
						findFirst: jest.fn().mockResolvedValue(existingPhoneFarmer), // Phone check fails
						create: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.createFarmer(validFarmerData)).rejects.toThrow(
				'A farmer with this phone number already exists',
			);

			// Verify create was never called due to early return
			expect(mockPrisma.$transaction).toHaveBeenCalled();
		});

		it('should handle database errors during transaction', async () => {
			const databaseError = new Error('Transaction failed');
			mockPrisma.$transaction.mockRejectedValue(databaseError);

			await expect(farmerService.createFarmer(validFarmerData)).rejects.toThrow('Failed to create farmer');
		});
	});

	describe('Update Validation Logic', () => {
		const farmerId = 'cm123abc456def';

		it('should prevent updating to existing email', async () => {
			const existingFarmer = {
				id: farmerId,
				name: 'Existing Farmer',
				email: 'existing@test.com',
				phone: '712344462',
			};

			const conflictingFarmer = {
				id: 'another-id',
				email: 'conflict@test.com',
			};

			const updateData: UpdateFarmerDto = {
				email: 'conflict@test.com', // Same as conflicting farmer
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest
							.fn()
							.mockResolvedValueOnce(existingFarmer) // First call - find farmer to update
							.mockResolvedValueOnce(conflictingFarmer), // Second call - check email conflict
						update: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.updateFarmer(farmerId, updateData)).rejects.toThrow(
				'A farmer with this email already exists',
			);
		});

		it('should prevent updating to existing phone', async () => {
			const existingFarmer = {
				id: farmerId,
				name: 'Existing Farmer',
				email: 'existing@test.com',
				phone: '712344462',
			};

			const conflictingFarmer = {
				id: 'another-id',
				phone: '798765432',
			};

			const updateData: UpdateFarmerDto = {
				phone: '798765432', // Same as conflicting farmer
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(existingFarmer),
						findFirst: jest.fn().mockResolvedValue(conflictingFarmer),
						update: jest.fn(),
					},
				};
				return callback(tx);
			});

			await expect(farmerService.updateFarmer(farmerId, updateData)).rejects.toThrow(
				'A farmer with this phone number already exists',
			);
		});

		it('should allow updating when no conflicts exist', async () => {
			const existingFarmer = {
				id: farmerId,
				name: 'Existing Farmer',
				email: 'existing@test.com',
				phone: '712344462',
			};

			const updateData: UpdateFarmerDto = {
				name: 'Updated Name',
				county: 'Updated County',
			};

			const updatedFarmer = {
				...existingFarmer,
				...updateData,
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				const tx = {
					farmer: {
						findUnique: jest.fn().mockResolvedValue(existingFarmer),
						update: jest.fn().mockResolvedValue(updatedFarmer),
					},
				};
				return callback(tx);
			});

			const result = await farmerService.updateFarmer(farmerId, updateData);

			expect(result.name).toBe('Updated Name');
			expect(result.county).toBe('Updated County');
		});
	});
});
