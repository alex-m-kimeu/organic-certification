import { Prisma, Farmer } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../middlewares/errorHandler';
import { CreateFarmerDto, UpdateFarmerDto } from '../types/farmer.types';

export class FarmerService {
	/**
	 * Create a new farmer
	 */
	async createFarmer(data: CreateFarmerDto): Promise<Farmer> {
		try {
			return await prisma.$transaction(async (tx) => {
				const existingFarmer = await tx.farmer.findUnique({
					where: { email: data.email },
				});

				if (existingFarmer) {
					throw new AppError('A farmer with this email already exists', 409, 'FARMER_EMAIL_EXISTS');
				}

				const existingPhone = await tx.farmer.findFirst({
					where: { phone: data.phone },
				});

				if (existingPhone) {
					throw new AppError('A farmer with this phone number already exists', 409, 'FARMER_PHONE_EXISTS');
				}

				const farmer = await tx.farmer.create({
					data,
				});

				return farmer;
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new AppError('A farmer with this email already exists', 409, 'FARMER_EMAIL_EXISTS');
			}

			throw new AppError('Failed to create farmer', 500);
		}
	}

	/**
	 * Get all farmers
	 */
	async getFarmers(
		page: number = 1,
		limit: number = 10,
		search?: string,
	): Promise<{
		farmers: Farmer[];
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

			const where: Prisma.FarmerWhereInput = {};
			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ email: { contains: search, mode: 'insensitive' } },
					{ county: { contains: search, mode: 'insensitive' } },
					{ phone: { contains: search, mode: 'insensitive' } },
				];
			}

			const [farmers, total] = await Promise.all([
				prisma.farmer.findMany({
					where,
					orderBy: { createdAt: 'desc' },
					skip: (page - 1) * limit,
					take: limit,
				}),
				prisma.farmer.count({ where }),
			]);

			const totalPages = Math.ceil(total / limit);

			return {
				farmers,
				total,
				totalPages,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farmers', 500);
		}
	}

	/**
	 * Get farmer by ID
	 */
	async getFarmerById(id: string): Promise<Farmer> {
		try {
			const farmer = await prisma.farmer.findUnique({
				where: { id },
			});

			if (!farmer) {
				throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
			}

			return farmer;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farmer', 500);
		}
	}

	/**
	 * Update farmer by ID
	 */
	async updateFarmer(id: string, data: UpdateFarmerDto): Promise<Farmer> {
		try {
			return await prisma.$transaction(async (tx) => {
				const existingFarmer = await tx.farmer.findUnique({
					where: { id },
				});

				if (!existingFarmer) {
					throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
				}

				if (data.email && data.email !== existingFarmer.email) {
					const emailConflict = await tx.farmer.findUnique({
						where: { email: data.email },
					});

					if (emailConflict) {
						throw new AppError('A farmer with this email already exists', 409, 'FARMER_EMAIL_EXISTS');
					}
				}

				if (data.phone && data.phone !== existingFarmer.phone) {
					const phoneConflict = await tx.farmer.findFirst({
						where: { phone: data.phone },
					});

					if (phoneConflict) {
						throw new AppError(
							'A farmer with this phone number already exists',
							409,
							'FARMER_PHONE_EXISTS',
						);
					}
				}

				const farmer = await tx.farmer.update({
					where: { id },
					data,
				});

				return farmer;
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new AppError('A farmer with this email already exists', 409, 'FARMER_EMAIL_EXISTS');
			}

			throw new AppError('Failed to update farmer', 500);
		}
	}

	/**
	 * Delete farmer by ID
	 */
	async deleteFarmer(id: string): Promise<void> {
		try {
			return await prisma.$transaction(async (tx) => {
				const farmer = await tx.farmer.findUnique({
					where: { id },
					include: {
						farms: {
							include: {
								fields: true,
								inspections: true,
								certificates: true,
							},
						},
					},
				});

				if (!farmer) {
					throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
				}

				const farmsWithDependencies = farmer.farms.filter(
					(farm) => farm.inspections.length > 0 || farm.certificates.length > 0,
				);

				if (farmsWithDependencies.length > 0) {
					throw new AppError(
						'Cannot delete farmer with farms that have inspections or certificates. Please handle these dependencies first.',
						400,
						'FARMER_HAS_DEPENDENCIES',
					);
				}

				if (farmer.farms.length > 0) {
					throw new AppError(
						'Cannot delete farmer with existing farms. Please delete all farms first.',
						400,
						'FARMER_HAS_FARMS',
					);
				}

				await tx.farmer.delete({
					where: { id },
				});
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to delete farmer', 500);
		}
	}

	/**
	 * Get farmer by ID
	 */
	async getFarmerWithFarmsAndFields(id: string): Promise<{
		id: string;
		name: string;
		phone: string;
		email: string;
		county: string;
		createdAt: Date;
		updatedAt: Date;
		farms: {
			id: string;
			farmName: string;
			location: string;
			areaHa: number;
			createdAt: Date;
			updatedAt: Date;
			fields: {
				id: string;
				name: string;
				crop: string;
				areaHa: number;
				createdAt: Date;
				updatedAt: Date;
			}[];
			_count: {
				fields: number;
				inspections: number;
				certificates: number;
			};
		}[];
		_count: {
			farms: number;
		};
		stats: {
			totalFarms: number;
			totalFields: number;
			totalFarmArea: number;
			totalFieldArea: number;
			averageFarmSize: number;
			averageFieldSize: number;
		};
	}> {
		try {
			const farmer = await prisma.farmer.findUnique({
				where: { id },
				include: {
					farms: {
						include: {
							fields: {
								orderBy: {
									createdAt: 'desc',
								},
							},
							_count: {
								select: {
									fields: true,
									inspections: true,
									certificates: true,
								},
							},
						},
						orderBy: {
							createdAt: 'desc',
						},
					},
					_count: {
						select: {
							farms: true,
						},
					},
				},
			});

			if (!farmer) {
				throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
			}

			const totalFarms = farmer.farms.length;
			const totalFields = farmer.farms.reduce((acc, farm) => acc + farm.fields.length, 0);
			const totalFarmArea = farmer.farms.reduce((acc, farm) => acc + farm.areaHa, 0);
			const totalFieldArea = farmer.farms.reduce(
				(acc, farm) => acc + farm.fields.reduce((fieldAcc, field) => fieldAcc + field.areaHa, 0),
				0,
			);

			const stats = {
				totalFarms,
				totalFields,
				totalFarmArea,
				totalFieldArea,
				averageFarmSize: totalFarms > 0 ? totalFarmArea / totalFarms : 0,
				averageFieldSize: totalFields > 0 ? totalFieldArea / totalFields : 0,
			};

			return {
				...farmer,
				stats,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farmer with farms and fields', 500);
		}
	}

	/**
	 * Get farmer dashboard summary
	 */
	async getFarmerDashboard(id: string): Promise<{
		farmer: {
			id: string;
			name: string;
			email: string;
			county: string;
		};
		summary: {
			totalFarms: number;
			totalFields: number;
			totalArea: number;
			recentActivities: {
				type: 'farm' | 'field' | 'inspection' | 'certificate';
				title: string;
				description: string;
				date: Date;
				id: string;
			}[];
		};
		farmsSummary: {
			id: string;
			farmName: string;
			location: string;
			areaHa: number;
			fieldsCount: number;
			inspectionsCount: number;
			certificatesCount: number;
			status: 'active' | 'pending_inspection' | 'certified';
		}[];
	}> {
		try {
			const farmer = await prisma.farmer.findUnique({
				where: { id },
				select: {
					id: true,
					name: true,
					email: true,
					county: true,
				},
			});

			if (!farmer) {
				throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
			}

			const [farms, totalStats] = await Promise.all([
				prisma.farm.findMany({
					where: { farmerId: id },
					include: {
						fields: {
							select: {
								id: true,
								createdAt: true,
							},
						},
						inspections: {
							select: {
								id: true,
								status: true,
								createdAt: true,
							},
							orderBy: {
								createdAt: 'desc',
							},
							take: 1,
						},
						certificates: {
							select: {
								id: true,
								createdAt: true,
							},
						},
						_count: {
							select: {
								fields: true,
								inspections: true,
								certificates: true,
							},
						},
					},
					orderBy: {
						updatedAt: 'desc',
					},
				}),
				prisma.farm.aggregate({
					where: { farmerId: id },
					_sum: {
						areaHa: true,
					},
					_count: true,
				}),
			]);

			const totalFields = farms.reduce((acc, farm) => acc + farm._count.fields, 0);

			// Create farms summary with status
			const farmsSummary = farms.map((farm) => {
				let status: 'active' | 'pending_inspection' | 'certified' = 'active';

				if (farm._count.certificates > 0) {
					status = 'certified';
				} else if (farm._count.inspections > 0) {
					const lastInspection = farm.inspections[0];
					if (lastInspection && lastInspection.status === 'SUBMITTED') {
						status = 'pending_inspection';
					}
				}

				return {
					id: farm.id,
					farmName: farm.farmName,
					location: farm.location,
					areaHa: farm.areaHa,
					fieldsCount: farm._count.fields,
					inspectionsCount: farm._count.inspections,
					certificatesCount: farm._count.certificates,
					status,
				};
			});

			// Generate recent activities (last 10 activities)
			const recentActivities: {
				type: 'farm' | 'field' | 'inspection' | 'certificate';
				title: string;
				description: string;
				date: Date;
				id: string;
			}[] = [];

			farms.forEach((farm) => {
				recentActivities.push({
					type: 'farm',
					title: `Farm: ${farm.farmName}`,
					description: `Located in ${farm.location}`,
					date: farm.createdAt,
					id: farm.id,
				});

				farm.fields.forEach((field) => {
					recentActivities.push({
						type: 'field',
						title: `Field added to ${farm.farmName}`,
						description: `New field registered`,
						date: field.createdAt,
						id: field.id,
					});
				});
			});

			// Sort activities by date and take the most recent ones
			recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());

			return {
				farmer,
				summary: {
					totalFarms: totalStats._count,
					totalFields,
					totalArea: totalStats._sum.areaHa || 0,
					recentActivities: recentActivities.slice(0, 10),
				},
				farmsSummary,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to fetch farmer dashboard', 500);
		}
	}
}
