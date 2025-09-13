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
			const existingFarmer = await prisma.farmer.findUnique({
				where: { email: data.email },
			});

			if (existingFarmer) {
				throw new AppError('A farmer with this email already exists', 409, 'FARMER_EMAIL_EXISTS');
			}

			const farmer = await prisma.farmer.create({
				data,
			});

			return farmer;
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
			const existingFarmer = await prisma.farmer.findUnique({
				where: { id },
			});

			if (!existingFarmer) {
				throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
			}

			const farmer = await prisma.farmer.update({
				where: { id },
				data,
			});

			return farmer;
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
			const farmer = await prisma.farmer.findUnique({
				where: { id },
			});

			if (!farmer) {
				throw new AppError('Farmer not found', 404, 'FARMER_NOT_FOUND');
			}

			await prisma.farmer.delete({
				where: { id },
			});
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError('Failed to delete farmer', 500);
		}
	}
}
