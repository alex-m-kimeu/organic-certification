import {
	Inspection as PrismaInspection,
	InspectionChecklist as PrismaInspectionChecklist,
	ChecklistQuestion as PrismaChecklistQuestion,
	InspectionStatus,
	Farm,
	Farmer,
} from '@prisma/client';
import { ApiResponse, PaginatedResponse } from './common.types';

export interface Inspection extends PrismaInspection {}

export interface ChecklistQuestion extends PrismaChecklistQuestion {}

export interface InspectionChecklist extends PrismaInspectionChecklist {}

// Extended inspection with related data
export interface InspectionWithFarm extends Inspection {
	farm: {
		id: string;
		farmName: string;
		location: string;
		farmer: {
			id: string;
			name: string;
			email: string;
		};
	};
	checklist: (InspectionChecklist & {
		question: ChecklistQuestion;
	})[];
}

// Inspection with full farm and farmer details
export interface InspectionWithDetails extends Inspection {
	farm: Farm & {
		farmer: Farmer;
	};
	checklist: (InspectionChecklist & {
		question: ChecklistQuestion;
	})[];
}

// DTO for creating a new inspection
export interface CreateInspectionDto {
	farmId: string;
	inspectorName: string;
	checklist: {
		questionId: number;
		answer: boolean;
	}[];
}

// DTO for updating an inspection
export interface UpdateInspectionDto {
	inspectorName?: string;
	checklist?: {
		questionId: number;
		answer: boolean;
	}[];
}

// DTO for approving an inspection
export interface ApproveInspectionDto {
	approved: boolean;
}

// Statistics and summary data
export interface InspectionStats {
	totalInspections: number;
	draftInspections: number;
	submittedInspections: number;
	approvedInspections: number;
	rejectedInspections: number;
	averageComplianceScore: number;
}

export { InspectionStatus };

export type { ApiResponse, PaginatedResponse };
