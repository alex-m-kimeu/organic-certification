import { Prisma, Field } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { CreateFieldDto, UpdateFieldDto, FieldWithFarm } from '../types/field.types';

export class FieldService {
	/**
	 * Create a new field
	 */
	async createField(data: CreateFieldDto): Promise<Field> {
		try {
			return await prisma.$transaction(async (tx) => {
				const farm = await tx.farm.findUnique({
					where: { id: data.farmId },
					include: {
						fields: {
							select: {
								areaHa: true,
							},
						},
					},
				});

				if (!farm) {
					throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
				}

				const totalExistingFieldsArea = farm.fields.reduce((sum, field) => sum + field.areaHa, 0);
				const totalAreaAfterAddition = totalExistingFieldsArea + data.areaHa;

				if (totalAreaAfterAddition > farm.areaHa) {
					throw new AppError(
						`Total fields area (${totalAreaAfterAddition} ha) would exceed farm area (${farm.areaHa} ha). Available area: ${(farm.areaHa - totalExistingFieldsArea).toFixed(3)} ha`,
						400,
						'FIELD_AREA_EXCEEDS_FARM',
					);
				}

				const field = await tx.field.create({
					data,
				});

				return field;
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new AppError(
						'A field with this name already exists in this farm',
						409,
						'DUPLICATE_FIELD_NAME',
					);
				}
			}

			throw new AppError('Failed to create field', 500);
		}
	}

	/**
	 * Get all fields
	 */
	async getFields(
		page: number = 1,
		limit: number = 10,
		search?: string,
		farmId?: string,
		crop?: string,
	): Promise<{
		fields: FieldWithFarm[];
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

			const where: Prisma.FieldWhereInput = {};

			if (farmId) {
				const farm = await prisma.farm.findUnique({
					where: { id: farmId },
					select: { id: true },
				});

				if (!farm) {
					throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
				}

				where.farmId = farmId;
			}

			if (crop) {
				where.crop = {
					equals: crop,
					mode: 'insensitive',
				};
			}

			if (search) {
				where.OR = [
					{
						name: {
							contains: search,
							mode: 'insensitive',
						},
					},
					{
						crop: {
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

			const [fields, total] = await Promise.all([
				prisma.field.findMany({
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
									},
								},
							},
						},
					},
					skip: (page - 1) * limit,
					take: limit,
					orderBy: {
						createdAt: 'desc',
					},
				}),
				prisma.field.count({ where }),
			]);

			return {
				fields,
				total,
				totalPages: Math.ceil(total / limit),
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch fields', 500);
		}
	}

	/**
	 * Get field by ID with farm information
	 */
	async getFieldById(id: string): Promise<FieldWithFarm> {
		try {
			const field = await prisma.field.findUnique({
				where: { id },
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
			});

			if (!field) {
				throw new AppError('Field not found', 404, 'FIELD_NOT_FOUND');
			}

			return field;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch field', 500);
		}
	}

	/**
	 * Get fields by farm ID
	 */
	async getFieldsByFarmId(farmId: string): Promise<Field[]> {
		try {
			const farm = await prisma.farm.findUnique({
				where: { id: farmId },
			});

			if (!farm) {
				throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
			}

			const fields = await prisma.field.findMany({
				where: { farmId },
				orderBy: {
					createdAt: 'desc',
				},
			});

			return fields;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch fields', 500);
		}
	}

	/**
	 * Update field by ID
	 */
	async updateField(id: string, data: UpdateFieldDto): Promise<Field> {
		try {
			return await prisma.$transaction(async (tx) => {
				const existingField = await tx.field.findUnique({
					where: { id },
				});

				if (!existingField) {
					throw new AppError('Field not found', 404, 'FIELD_NOT_FOUND');
				}

				let targetFarmId = existingField.farmId;

				if (data.farmId && data.farmId !== existingField.farmId) {
					const farm = await tx.farm.findUnique({
						where: { id: data.farmId },
					});

					if (!farm) {
						throw new AppError('Farm not found', 404, 'FARM_NOT_FOUND');
					}

					targetFarmId = data.farmId;
				}

				// If updating area, validate against farm capacity
				if (data.areaHa !== undefined) {
					const targetFarm = await tx.farm.findUnique({
						where: { id: targetFarmId },
						include: {
							fields: {
								where: {
									id: { not: id }, // Exclude current field from calculation
								},
								select: {
									areaHa: true,
								},
							},
						},
					});

					if (!targetFarm) {
						throw new AppError('Target farm not found', 404, 'FARM_NOT_FOUND');
					}

					const totalOtherFieldsArea = targetFarm.fields.reduce((sum, field) => sum + field.areaHa, 0);
					const totalAreaAfterUpdate = totalOtherFieldsArea + data.areaHa;

					if (totalAreaAfterUpdate > targetFarm.areaHa) {
						throw new AppError(
							`Updated field area would cause total fields area (${totalAreaAfterUpdate} ha) to exceed farm area (${targetFarm.areaHa} ha). Available area: ${(targetFarm.areaHa - totalOtherFieldsArea).toFixed(3)} ha`,
							400,
							'FIELD_AREA_EXCEEDS_FARM',
						);
					}
				}

				const field = await tx.field.update({
					where: { id },
					data,
				});

				return field;
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new AppError(
						'A field with this name already exists in this farm',
						409,
						'DUPLICATE_FIELD_NAME',
					);
				}
			}

			throw new AppError('Failed to update field', 500);
		}
	}

	/**
	 * Delete field by ID
	 */
	async deleteField(id: string): Promise<void> {
		try {
			const field = await prisma.field.findUnique({
				where: { id },
			});

			if (!field) {
				throw new AppError('Field not found', 404, 'FIELD_NOT_FOUND');
			}

			await prisma.field.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to delete field', 500);
		}
	}

	/**
	 * Get field statistics
	 */
	async getFieldStats(farmId?: string): Promise<{
		totalFields: number;
		totalArea: number;
		averageFieldSize: number;
		cropDistribution: { crop: string; count: number; totalArea: number }[];
	}> {
		try {
			const where: Prisma.FieldWhereInput = farmId ? { farmId } : {};

			const [stats, cropStats] = await Promise.all([
				prisma.field.aggregate({
					where,
					_count: true,
					_sum: {
						areaHa: true,
					},
					_avg: {
						areaHa: true,
					},
				}),
				prisma.field.groupBy({
					by: ['crop'],
					where,
					_count: true,
					_sum: {
						areaHa: true,
					},
					orderBy: {
						_count: {
							crop: 'desc',
						},
					},
				}),
			]);

			const cropDistribution = cropStats.map((crop) => ({
				crop: crop.crop,
				count: crop._count,
				totalArea: crop._sum.areaHa || 0,
			}));

			return {
				totalFields: stats._count,
				totalArea: stats._sum.areaHa || 0,
				averageFieldSize: stats._avg.areaHa || 0,
				cropDistribution,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch field statistics', 500);
		}
	}

	/**
	 * Get unique crop types from all fields
	 */
	async getCropTypes(): Promise<string[]> {
		try {
			const crops = await prisma.field.findMany({
				select: {
					crop: true,
				},
				distinct: ['crop'],
				where: {
					crop: {
						not: '',
					},
				},
				orderBy: {
					crop: 'asc',
				},
			});

			// Filter out any empty strings and ensure we have valid crop names
			const validCrops = crops
				.map((field) => field.crop)
				.filter((crop) => crop && crop.trim().length > 0)
				.map((crop) => crop.trim());

			// Remove duplicates (in case database distinct didn't work perfectly)
			const uniqueCrops = Array.from(new Set(validCrops));

			// If no crops found, return empty array with appropriate handling
			if (uniqueCrops.length === 0) {
				const totalFields = await prisma.field.count();
				if (totalFields === 0) {
					return [];
				}

				return [];
			}

			return uniqueCrops;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch crop types', 500);
		}
	}
}
