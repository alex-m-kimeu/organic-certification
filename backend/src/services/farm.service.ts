import { Prisma, Farm } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { CreateFarmDto, UpdateFarmDto, FarmWithFields, FarmWithFieldsAndFarmer } from '../types/farm.types';

export class FarmService {
	/**
	 * Create a new farm
	 */
	async createFarm(data: CreateFarmDto): Promise<Farm> {
		try {
			return await prisma.$transaction(async (tx) => {
				const farmer = await tx.farmer.findUnique({
					where: { id: data.farmerId },
				});

				if (!farmer) {
					throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
				}

				const farm = await tx.farm.create({
					data,
				});

				return farm;
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new AppError(
						'A farm with this name already exists for this farmer',
						409,
						'DUPLICATE_FARM_NAME',
					);
				}
			}

			throw new AppError('Failed to create farm', 500);
		}
	}

	/**
	 * Get all farms
	 */
	async getFarms(
		page: number = 1,
		limit: number = 10,
		search?: string,
		farmerId?: string,
	): Promise<{
		farms: FarmWithFieldsAndFarmer[];
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

			const where: Prisma.FarmWhereInput = {};

			if (farmerId) {
				const farmer = await prisma.farmer.findUnique({
					where: { id: farmerId },
					select: { id: true },
				});

				if (!farmer) {
					throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
				}

				where.farmerId = farmerId;
			}

			if (search) {
				where.OR = [
					{
						farmName: {
							contains: search,
							mode: 'insensitive',
						},
					},
					{
						location: {
							contains: search,
							mode: 'insensitive',
						},
					},
					{
						farmer: {
							name: {
								contains: search,
								mode: 'insensitive',
							},
						},
					},
				];
			}

			const [farms, total] = await Promise.all([
				prisma.farm.findMany({
					where,
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
					skip: (page - 1) * limit,
					take: limit,
					orderBy: {
						createdAt: 'desc',
					},
				}),
				prisma.farm.count({ where }),
			]);

			return {
				farms,
				total,
				totalPages: Math.ceil(total / limit),
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farms', 500);
		}
	}

	/**
	 * Get farm by ID with fields
	 */
	async getFarmById(id: string, includeFarmer: boolean = false): Promise<FarmWithFields | FarmWithFieldsAndFarmer> {
		try {
			const includeOptions: Prisma.FarmInclude = {
				fields: true,
			};

			if (includeFarmer) {
				includeOptions.farmer = {
					select: {
						id: true,
						name: true,
						email: true,
					},
				};
			}

			const farm = await prisma.farm.findUnique({
				where: { id },
				include: includeOptions,
			});

			if (!farm) {
				throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
			}

			return farm as FarmWithFields | FarmWithFieldsAndFarmer;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farm', 500);
		}
	}

	/**
	 * Get farms by farmer ID
	 */
	async getFarmsByFarmerId(farmerId: string): Promise<FarmWithFields[]> {
		try {
			const farmer = await prisma.farmer.findUnique({
				where: { id: farmerId },
			});

			if (!farmer) {
				throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
			}

			const farms = await prisma.farm.findMany({
				where: { farmerId },
				include: {
					fields: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
			});

			return farms;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farms', 500);
		}
	}

	/**
	 * Update farm by ID
	 */
	async updateFarm(id: string, data: UpdateFarmDto): Promise<Farm> {
		try {
			return await prisma.$transaction(async (tx) => {
				const existingFarm = await tx.farm.findUnique({
					where: { id },
					include: {
						fields: {
							select: {
								areaHa: true,
							},
						},
					},
				});

				if (!existingFarm) {
					throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
				}

				// If changing farmer, validate new farmer exists
				if (data.farmerId && data.farmerId !== existingFarm.farmerId) {
					const farmer = await tx.farmer.findUnique({
						where: { id: data.farmerId },
					});

					if (!farmer) {
						throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
					}
				}

				// If updating area, validate against existing fields
				if (data.areaHa !== undefined) {
					const totalFieldsArea = existingFarm.fields.reduce((sum, field) => sum + field.areaHa, 0);

					if (data.areaHa < totalFieldsArea) {
						throw new AppError(
							`Farm area (${data.areaHa} ha) cannot be smaller than total fields area (${totalFieldsArea} ha)`,
							400,
							'FARM_AREA_TOO_SMALL',
						);
					}
				}

				const farm = await tx.farm.update({
					where: { id },
					data,
				});

				return farm;
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new AppError(
						'A farm with this name already exists for this farmer',
						409,
						'DUPLICATE_FARM_NAME',
					);
				}
			}

			throw new AppError('Failed to update farm', 500);
		}
	}

	/**
	 * Delete farm by ID
	 */
	async deleteFarm(id: string): Promise<void> {
		try {
			const farm = await prisma.farm.findUnique({
				where: { id },
				include: {
					fields: true,
					inspections: true,
					certificates: true,
				},
			});

			if (!farm) {
				throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
			}

			if (farm.inspections.length > 0) {
				throw new AppError(
					'Cannot delete farm with existing inspections. Please delete all inspections first.',
					400,
					'FARM_HAS_INSPECTIONS',
				);
			}

			if (farm.certificates.length > 0) {
				throw new AppError(
					'Cannot delete farm with existing certificates. Please delete all certificates first.',
					400,
					'FARM_HAS_CERTIFICATES',
				);
			}

			await prisma.farm.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to delete farm', 500);
		}
	}

	/**
	 * Get farm statistics
	 */
	async getFarmStats(farmId?: string): Promise<{
		totalFarms: number;
		totalArea: number;
		totalFields: number;
		averageFarmSize: number;
	}> {
		try {
			const where: Prisma.FarmWhereInput = farmId ? { id: farmId } : {};

			const [stats, fieldsCount] = await Promise.all([
				prisma.farm.aggregate({
					where,
					_count: true,
					_sum: {
						areaHa: true,
					},
					_avg: {
						areaHa: true,
					},
				}),
				prisma.field.count({
					where: farmId
						? {
								farmId,
							}
						: {},
				}),
			]);

			return {
				totalFarms: stats._count,
				totalArea: stats._sum.areaHa || 0,
				totalFields: fieldsCount,
				averageFarmSize: stats._avg.areaHa || 0,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farm statistics', 500);
		}
	}
}
