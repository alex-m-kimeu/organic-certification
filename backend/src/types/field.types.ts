import { Field as PrismaField } from '@prisma/client';
import { ApiResponse, PaginatedResponse } from './common.types';

export interface Field extends PrismaField {}

export interface FieldWithFarm extends Field {
	farm: {
		id: string;
		farmName: string;
		location: string;
		farmer: {
			id: string;
			name: string;
		};
	};
}

export interface CreateFieldDto {
	farmId: string;
	name: string;
	crop: string;
	areaHa: number;
}

export interface UpdateFieldDto {
	farmId?: string;
	name?: string;
	crop?: string;
	areaHa?: number;
}

export type { ApiResponse, PaginatedResponse };
