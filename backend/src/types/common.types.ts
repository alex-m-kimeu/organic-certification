/**
 * Shared type definitions used across the application
 */

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

export interface ErrorResponse {
	success: false;
	message: string;
	error?: string;
	code?: string;
	details?: unknown;
}

// Base entity timestamps
export interface BaseEntity {
	id: string;
	createdAt: Date;
	updatedAt: Date;
}

// Query parameters for pagination and search
export interface PaginationQuery {
	page?: number;
	limit?: number;
	search?: string;
}

// Sort options
export interface SortOptions {
	field: string;
	order: 'asc' | 'desc';
}
