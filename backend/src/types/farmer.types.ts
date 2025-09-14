import { Farmer as PrismaFarmer } from '@prisma/client';
import { ApiResponse, PaginatedResponse } from './common.types';

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

export type { ApiResponse, PaginatedResponse };
