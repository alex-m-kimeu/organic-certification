import { Certificate as PrismaCertificate, Farm, Farmer } from '@prisma/client';
import { ApiResponse, PaginatedResponse } from './common.types';

export interface Certificate extends PrismaCertificate {}

// Certificate with farm and farmer details
export interface CertificateWithDetails extends Certificate {
	farm: Farm & {
		farmer: Farmer;
	};
}

// Certificate with minimal farm info for listing
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

// DTO for certificate generation
export interface GenerateCertificateDto {
	farmId: string;
	complianceScore: number;
	inspectorName: string;
	inspectionDate: Date;
}

export type { ApiResponse, PaginatedResponse };
