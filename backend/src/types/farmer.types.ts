import { Farmer as PrismaFarmer } from '@prisma/client';

export interface Farmer extends PrismaFarmer {}

export interface CreateFarmerDto {
	name: string;
	phone: string;
	email: string;
	county: string;
}

export interface UpdateFarmerDto {
	name?: string;
	phone?: string;
	email?: string;
	county?: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
}

export interface PaginatedResponse<T> {
	success: boolean;
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
