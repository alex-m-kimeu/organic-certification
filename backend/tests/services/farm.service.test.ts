import { prisma } from '../../src/config/db';
import { Prisma } from '@prisma/client';
import { FarmService } from '../../src/services/farm.service';
import { AppError } from '../../src/middlewares/errorHandler';
import { CreateFarmDto, UpdateFarmDto } from '../../src/types/farm.types';

// Mock the entire db module
jest.mock('../../src/config/db', () => ({
	prisma: {
		$transaction: jest.fn(),
		farmer: {
			findUnique: jest.fn(),
		},
		farm: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
			aggregate: jest.fn(),
		},
		field: {
			count: jest.fn(),
		},
	},
}));

describe('FarmService', () => {
	let farmService: FarmService;

	// Cast prisma to jest mocks to get proper TypeScript support
	const mockPrisma = prisma as jest.Mocked<typeof prisma>;

	beforeEach(() => {
		farmService = new FarmService();

		// Clear all mocks before each test
		jest.clearAllMocks();

		// Setup transaction mock to execute callback with the transaction object
		(mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
			// Return the result of calling the callback with the same mockPrisma
			return await callback(mockPrisma);
		});
	});

	describe('createFarm', () => {
		const validFarmData: CreateFarmDto = {
			farmerId: 'cm123farmer456def',
			farmName: 'Green Valley Farm',
			location: 'Kiambu County, Central Kenya',
			areaHa: 25.5,
		};

		const mockCreatedFarm = {
			id: 'cm123farm456def',
			...validFarmData,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockFarmer = {
			id: validFarmData.farmerId,
			name: 'John Doe',
			email: 'john.doe@test.com',
			phone: '712345678', // 9 digits starting with 7
			county: 'Kiambu',
		};

		it('should create a farm successfully', async () => {
			// Setup mocks for successful creation
			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock farmer exists check
				(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmer);
				// Mock farm creation
				(mockPrisma.farm.create as jest.Mock).mockResolvedValue(mockCreatedFarm);

				return await callback(mockPrisma);
			});

			const result = await farmService.createFarm(validFarmData);

			expect(result).toEqual(mockCreatedFarm);
			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
		});

		it('should throw AppError when farmer not found', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock farmer not found
				(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

				return await callback(mockPrisma);
			});

			await expect(farmService.createFarm(validFarmData)).rejects.toThrow(AppError);

			try {
				await farmService.createFarm(validFarmData);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farmer not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});

		it('should throw AppError when farm name already exists for farmer', async () => {
			const duplicateError = new (Prisma.PrismaClientKnownRequestError as any)('Duplicate entry', {
				code: 'P2002',
				meta: { target: ['farmerId', 'farmName'] },
				clientVersion: '5.0.0',
			});

			mockPrisma.$transaction.mockRejectedValue(duplicateError);

			await expect(farmService.createFarm(validFarmData)).rejects.toThrow(AppError);

			try {
				await farmService.createFarm(validFarmData);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('A farm with this name already exists for this farmer');
				expect((error as AppError).statusCode).toBe(409);
			}
		});

		it('should handle database errors gracefully', async () => {
			const databaseError = new Error('Database connection failed');
			(mockPrisma.$transaction as jest.Mock).mockRejectedValue(databaseError);

			await expect(farmService.createFarm(validFarmData)).rejects.toThrow('Failed to create farm');
		});
	});

	describe('getFarms', () => {
		const mockFarms = [
			{
				id: '1',
				farmName: 'Farm 1',
				location: 'Location 1',
				areaHa: 10.5,
				farmer: { id: 'farmer1', name: 'Farmer 1', email: 'farmer1@test.com' },
				fields: [],
			},
			{
				id: '2',
				farmName: 'Farm 2',
				location: 'Location 2',
				areaHa: 20.0,
				farmer: { id: 'farmer2', name: 'Farmer 2', email: 'farmer2@test.com' },
				fields: [],
			},
		];

		it('should return paginated farms with default pagination', async () => {
			(mockPrisma.farm.findMany as jest.Mock).mockResolvedValue(mockFarms);
			(mockPrisma.farm.count as jest.Mock).mockResolvedValue(2);

			const result = await farmService.getFarms();

			expect(result.farms).toEqual(mockFarms);
			expect(result.total).toBe(2);
			expect(result.totalPages).toBe(1);
			expect(mockPrisma.farm.findMany).toHaveBeenCalledWith({
				where: {},
				include: {
					farmer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					fields: true,
				},
				skip: 0,
				take: 10,
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should handle custom pagination parameters', async () => {
			const page = 2;
			const limit = 5;

			(mockPrisma.farm.findMany as jest.Mock).mockResolvedValue(mockFarms);
			(mockPrisma.farm.count as jest.Mock).mockResolvedValue(2);

			const result = await farmService.getFarms(page, limit);

			expect(result.totalPages).toBe(1);
			expect(mockPrisma.farm.findMany).toHaveBeenCalledWith({
				where: {},
				include: {
					farmer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					fields: true,
				},
				skip: 5, // (page - 1) * limit
				take: limit,
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should handle search functionality', async () => {
			const searchTerm = 'Green';
			(mockPrisma.farm.findMany as jest.Mock).mockResolvedValue(mockFarms);
			(mockPrisma.farm.count as jest.Mock).mockResolvedValue(1);

			const result = await farmService.getFarms(1, 10, searchTerm);

			expect(mockPrisma.farm.findMany).toHaveBeenCalledWith({
				where: {
					OR: [
						{ farmName: { contains: searchTerm, mode: 'insensitive' } },
						{ location: { contains: searchTerm, mode: 'insensitive' } },
						{ farmer: { name: { contains: searchTerm, mode: 'insensitive' } } },
					],
				},
				include: {
					farmer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					fields: true,
				},
				skip: 0,
				take: 10,
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should filter by farmerId when provided', async () => {
			const farmerId = 'cm123farmer456def';
			const mockFarmer = { id: farmerId };

			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmer);
			(mockPrisma.farm.findMany as jest.Mock).mockResolvedValue(mockFarms);
			(mockPrisma.farm.count as jest.Mock).mockResolvedValue(1);

			const result = await farmService.getFarms(1, 10, undefined, farmerId);

			expect(mockPrisma.farmer.findUnique).toHaveBeenCalledWith({
				where: { id: farmerId },
				select: { id: true },
			});
			expect(mockPrisma.farm.findMany).toHaveBeenCalledWith({
				where: { farmerId },
				include: {
					farmer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					fields: true,
				},
				skip: 0,
				take: 10,
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should throw AppError when farmer not found for filtering', async () => {
			const farmerId = 'nonexistent-farmer';

			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmService.getFarms(1, 10, undefined, farmerId)).rejects.toThrow(AppError);

			try {
				await farmService.getFarms(1, 10, undefined, farmerId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farmer not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});

		it('should validate pagination parameters', async () => {
			// Test invalid page
			await expect(farmService.getFarms(0)).rejects.toThrow('Page must be greater than 0');

			// Test invalid limit (too small)
			await expect(farmService.getFarms(1, 0)).rejects.toThrow('Limit must be between 1 and 100');

			// Test invalid limit (too large)
			await expect(farmService.getFarms(1, 101)).rejects.toThrow('Limit must be between 1 and 100');
		});
	});

	describe('getFarmById', () => {
		const farmId = 'cm123farm456def';
		const mockFarm = {
			id: farmId,
			farmName: 'Green Valley Farm',
			location: 'Kiambu County',
			areaHa: 25.5,
			fields: [{ id: 'field1', name: 'Field 1', crop: 'Maize', areaHa: 10.0 }],
		};

		const mockFarmWithFarmer = {
			...mockFarm,
			farmer: {
				id: 'farmer1',
				name: 'John Doe',
				email: 'john.doe@test.com',
			},
		};

		it('should return farm when found (without farmer)', async () => {
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);

			const result = await farmService.getFarmById(farmId);

			expect(result).toEqual(mockFarm);
			expect(mockPrisma.farm.findUnique).toHaveBeenCalledWith({
				where: { id: farmId },
				include: { fields: true },
			});
		});

		it('should return farm when found (with farmer)', async () => {
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarmWithFarmer);

			const result = await farmService.getFarmById(farmId, true);

			expect(result).toEqual(mockFarmWithFarmer);
			expect(mockPrisma.farm.findUnique).toHaveBeenCalledWith({
				where: { id: farmId },
				include: {
					fields: true,
					farmer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});
		});

		it('should throw AppError when farm not found', async () => {
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmService.getFarmById(farmId)).rejects.toThrow(AppError);

			try {
				await farmService.getFarmById(farmId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farm not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});
	});

	describe('getFarmsByFarmerId', () => {
		const farmerId = 'cm123farmer456def';
		const mockFarms = [
			{
				id: 'farm1',
				farmName: 'Farm 1',
				location: 'Location 1',
				fields: [],
			},
		];

		const mockFarmer = {
			id: farmerId,
			name: 'John Doe',
		};

		it('should return farms for valid farmer', async () => {
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockFarmer);
			(mockPrisma.farm.findMany as jest.Mock).mockResolvedValue(mockFarms);

			const result = await farmService.getFarmsByFarmerId(farmerId);

			expect(result).toEqual(mockFarms);
			expect(mockPrisma.farmer.findUnique).toHaveBeenCalledWith({
				where: { id: farmerId },
			});
			expect(mockPrisma.farm.findMany).toHaveBeenCalledWith({
				where: { farmerId },
				include: { fields: true },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('should throw AppError when farmer not found', async () => {
			(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmService.getFarmsByFarmerId(farmerId)).rejects.toThrow(AppError);

			try {
				await farmService.getFarmsByFarmerId(farmerId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farmer not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});
	});

	describe('updateFarm', () => {
		const farmId = 'cm123farm456def';
		const updateData: UpdateFarmDto = {
			farmName: 'Updated Farm Name',
			location: 'Updated Location',
		};

		const mockExistingFarm = {
			id: farmId,
			farmerId: 'farmer1',
			farmName: 'Old Farm Name',
			location: 'Old Location',
			areaHa: 25.5,
			fields: [{ areaHa: 10.0 }, { areaHa: 5.5 }], // Total: 15.5 ha
		};

		const mockUpdatedFarm = {
			...mockExistingFarm,
			...updateData,
		};

		it('should update farm successfully', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock existing farm check
				(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockExistingFarm);
				// Mock farm update
				(mockPrisma.farm.update as jest.Mock).mockResolvedValue(mockUpdatedFarm);

				return await callback(mockPrisma);
			});

			const result = await farmService.updateFarm(farmId, updateData);

			expect(result).toEqual(mockUpdatedFarm);
			expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
		});

		it('should throw AppError when farm not found', async () => {
			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock farm not found
				(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

				return await callback(mockPrisma);
			});

			await expect(farmService.updateFarm(farmId, updateData)).rejects.toThrow(AppError);

			try {
				await farmService.updateFarm(farmId, updateData);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farm not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});

		it('should validate new farmer exists when changing farmerId', async () => {
			const updateWithNewFarmer = {
				...updateData,
				farmerId: 'new-farmer-id',
			};

			const mockNewFarmer = {
				id: 'new-farmer-id',
				name: 'New Farmer',
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock existing farm
				(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockExistingFarm);
				// Mock new farmer check
				(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(mockNewFarmer);
				// Mock farm update
				(mockPrisma.farm.update as jest.Mock).mockResolvedValue({
					...mockUpdatedFarm,
					farmerId: 'new-farmer-id',
				});

				return await callback(mockPrisma);
			});

			const result = await farmService.updateFarm(farmId, updateWithNewFarmer);

			expect(result.farmerId).toBe('new-farmer-id');
		});

		it('should throw AppError when new farmer not found', async () => {
			const updateWithNewFarmer = {
				farmerId: 'nonexistent-farmer',
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock existing farm
				(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockExistingFarm);
				// Mock new farmer not found
				(mockPrisma.farmer.findUnique as jest.Mock).mockResolvedValue(null);

				return await callback(mockPrisma);
			});

			await expect(farmService.updateFarm(farmId, updateWithNewFarmer)).rejects.toThrow(AppError);

			try {
				await farmService.updateFarm(farmId, updateWithNewFarmer);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farmer not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});

		it('should validate farm area cannot be smaller than total field areas', async () => {
			const updateWithSmallArea = {
				areaHa: 10.0, // Smaller than total fields area (15.5)
			};

			mockPrisma.$transaction.mockImplementation(async (callback: any) => {
				// Mock existing farm with fields
				(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockExistingFarm);

				return await callback(mockPrisma);
			});

			await expect(farmService.updateFarm(farmId, updateWithSmallArea)).rejects.toThrow(AppError);

			try {
				await farmService.updateFarm(farmId, updateWithSmallArea);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toContain(
					'Farm area (10 ha) cannot be smaller than total fields area (15.5 ha)',
				);
				expect((error as AppError).statusCode).toBe(400);
			}
		});

		it('should handle duplicate farm name error', async () => {
			const duplicateError = new (Prisma.PrismaClientKnownRequestError as any)('Duplicate entry', {
				code: 'P2002',
				meta: { target: ['farmerId', 'farmName'] },
				clientVersion: '5.0.0',
			});

			mockPrisma.$transaction.mockRejectedValue(duplicateError);

			await expect(farmService.updateFarm(farmId, updateData)).rejects.toThrow(AppError);

			try {
				await farmService.updateFarm(farmId, updateData);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('A farm with this name already exists for this farmer');
				expect((error as AppError).statusCode).toBe(409);
			}
		});
	});

	describe('deleteFarm', () => {
		const farmId = 'cm123farm456def';

		it('should delete farm successfully when no dependencies', async () => {
			const mockFarm = {
				id: farmId,
				farmName: 'Test Farm',
				fields: [],
				inspections: [],
				certificates: [],
			};

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarm);
			(mockPrisma.farm.delete as jest.Mock).mockResolvedValue(mockFarm);

			await farmService.deleteFarm(farmId);

			expect(mockPrisma.farm.findUnique).toHaveBeenCalledWith({
				where: { id: farmId },
				include: {
					fields: true,
					inspections: true,
					certificates: true,
				},
			});
			expect(mockPrisma.farm.delete).toHaveBeenCalledWith({
				where: { id: farmId },
			});
		});

		it('should throw AppError when farm not found', async () => {
			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(farmService.deleteFarm(farmId)).rejects.toThrow(AppError);

			try {
				await farmService.deleteFarm(farmId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe('Farm not found');
				expect((error as AppError).statusCode).toBe(404);
			}
		});

		it('should throw AppError when farm has inspections', async () => {
			const mockFarmWithInspections = {
				id: farmId,
				fields: [],
				inspections: [{ id: 'inspection1' }],
				certificates: [],
			};

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarmWithInspections);

			await expect(farmService.deleteFarm(farmId)).rejects.toThrow(AppError);

			try {
				await farmService.deleteFarm(farmId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe(
					'Cannot delete farm with existing inspections. Please delete all inspections first.',
				);
				expect((error as AppError).statusCode).toBe(400);
			}
		});

		it('should throw AppError when farm has certificates', async () => {
			const mockFarmWithCertificates = {
				id: farmId,
				fields: [],
				inspections: [],
				certificates: [{ id: 'certificate1' }],
			};

			(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(mockFarmWithCertificates);

			await expect(farmService.deleteFarm(farmId)).rejects.toThrow(AppError);

			try {
				await farmService.deleteFarm(farmId);
			} catch (error) {
				expect(error).toBeInstanceOf(AppError);
				expect((error as AppError).message).toBe(
					'Cannot delete farm with existing certificates. Please delete all certificates first.',
				);
				expect((error as AppError).statusCode).toBe(400);
			}
		});
	});

	describe('getFarmStats', () => {
		const mockStats = {
			_count: 5,
			_sum: { areaHa: 125.5 },
			_avg: { areaHa: 25.1 },
		};

		it('should return overall farm statistics', async () => {
			(mockPrisma.farm.aggregate as jest.Mock).mockResolvedValue(mockStats);
			(mockPrisma.field.count as jest.Mock).mockResolvedValue(25);

			const result = await farmService.getFarmStats();

			expect(result).toEqual({
				totalFarms: 5,
				totalArea: 125.5,
				totalFields: 25,
				averageFarmSize: 25.1,
			});

			expect(mockPrisma.farm.aggregate).toHaveBeenCalledWith({
				where: {},
				_count: true,
				_sum: { areaHa: true },
				_avg: { areaHa: true },
			});
			expect(mockPrisma.field.count).toHaveBeenCalledWith({
				where: {},
			});
		});

		it('should return statistics for specific farm', async () => {
			const farmId = 'cm123farm456def';

			(mockPrisma.farm.aggregate as jest.Mock).mockResolvedValue({
				_count: 1,
				_sum: { areaHa: 25.5 },
				_avg: { areaHa: 25.5 },
			});
			(mockPrisma.field.count as jest.Mock).mockResolvedValue(3);

			const result = await farmService.getFarmStats(farmId);

			expect(result).toEqual({
				totalFarms: 1,
				totalArea: 25.5,
				totalFields: 3,
				averageFarmSize: 25.5,
			});

			expect(mockPrisma.farm.aggregate).toHaveBeenCalledWith({
				where: { id: farmId },
				_count: true,
				_sum: { areaHa: true },
				_avg: { areaHa: true },
			});
			expect(mockPrisma.field.count).toHaveBeenCalledWith({
				where: { farmId },
			});
		});

		it('should handle null values in statistics', async () => {
			const mockNullStats = {
				_count: 0,
				_sum: { areaHa: null },
				_avg: { areaHa: null },
			};

			(mockPrisma.farm.aggregate as jest.Mock).mockResolvedValue(mockNullStats);
			(mockPrisma.field.count as jest.Mock).mockResolvedValue(0);

			const result = await farmService.getFarmStats();

			expect(result).toEqual({
				totalFarms: 0,
				totalArea: 0,
				totalFields: 0,
				averageFarmSize: 0,
			});
		});
	});
});
