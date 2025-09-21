export interface Field {
	id: string;
	farmId: string;
	name: string;
	crop: string;
	areaHa: number;
	createdAt: string;
	updatedAt: string;
}

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

export interface CreateField {
	farmId: string;
	name: string;
	crop: string;
	areaHa: number;
}

export interface UpdateField {
	farmId?: string;
	name?: string;
	crop?: string;
	areaHa?: number;
}
