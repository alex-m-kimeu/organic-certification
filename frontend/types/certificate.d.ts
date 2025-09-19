export interface Certificate {
	id: string;
	farmId: string;
	certificateNo: string;
	issueDate: string;
	expiryDate: string;
	status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
	pdfUrl?: string;
	complianceScore: number;
	inspectorName: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CertificateWithFarm extends Certificate {
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

export interface CertificateWithDetails extends Certificate {
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
}
