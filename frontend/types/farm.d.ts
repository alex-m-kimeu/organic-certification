export interface Farm {
	id: string;
	farmerId: string;
	farmName: string;
	location: string;
	areaHa: number;
	createdAt?: string;
	updatedAt?: string;
	_count?: {
		fields: number;
		inspections?: number;
	};
	latestInspection?: {
		id: string;
		complianceScore: number | null;
		status: string;
		date: string;
	} | null;
}

export interface Field {
	id: string;
	farmId: string;
	name: string;
	crop: string;
	areaHa: number;
	createdAt?: string;
	updatedAt?: string;
}

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
