import { Farm as PrismaFarm, Field as PrismaField } from '@prisma/client';
import { ApiResponse, PaginatedResponse } from './common.types';

export interface Farm extends PrismaFarm {}

export interface FarmWithFields extends Farm {
	fields: Field[];
}

export interface FarmWithFieldsAndFarmer extends FarmWithFields {
	farmer: {
		id: string;
		name: string;
		email: string;
	};
}

export interface Field extends PrismaField {}

export interface CreateFarmDto {
	farmerId: string;
	farmName: string;
	location: string;
	areaHa: number;
}

export interface UpdateFarmDto {
	farmerId?: string;
	farmName?: string;
	location?: string;
	areaHa?: number;
}

export type { ApiResponse, PaginatedResponse };
