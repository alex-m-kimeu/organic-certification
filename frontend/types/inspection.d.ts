export interface Inspection {
	id: string;
	farmId: string;
	date: string;
	inspectorName: string;
	status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
	complianceScore?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface ChecklistQuestion {
	id: number;
	question: string;
	description?: string;
	order: number;
	isActive?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface InspectionChecklist {
	id: string;
	inspectionId: string;
	questionId: number;
	answer: boolean;
	question: ChecklistQuestion;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateInspectionDto {
	farmId: string;
	inspectorName: string;
	checklist: {
		questionId: number;
		answer: boolean;
	}[];
}

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
	checklist: InspectionChecklist[];
}

export interface InspectionWithDetails extends Inspection {
	farm: {
		id: string;
		farmerId: string;
		farmName: string;
		location: string;
		areaHa: number;
		farmer: {
			id: string;
			name: string;
			phone: string;
			email: string;
			county: string;
		};
	};
	checklist: InspectionChecklist[];
}
