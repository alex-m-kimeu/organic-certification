'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Farmer } from '@/types/farmer';
import FarmersTable from './farmers-table';
import FarmerDialog from './farmer-dialog';
import DeleteConfirmDialog from './delete-confirm-dialog';

interface PaginatedResponse {
	success: boolean;
	data: Farmer[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmersManagement() {
	const router = useRouter();
	const [farmers, setFarmers] = useState<Farmer[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
	const [sortBy, setSortBy] = useState('createdAt-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalFarmers, setTotalFarmers] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Delete dialog states
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [farmerToDelete, setFarmerToDelete] = useState<Farmer | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Edit dialog states
	const [farmerToEdit, setFarmerToEdit] = useState<Farmer | null>(null);

	// Debounce searchTerm
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Fetch farmers function
	const fetchFarmers = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				...(debouncedSearchTerm && { search: debouncedSearchTerm }),
			});

			const response = await fetch(`${BASE_URL}/farmers?${params}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch farmers');
			}

			const data: PaginatedResponse = await response.json();

			// Sort farmers locally based on sortBy
			const sortedFarmers = [...data.data];
			const [sortField, sortDirection] = sortBy.split('-');

			switch (sortField) {
				case 'name':
					sortedFarmers.sort((a, b) => {
						const comparison = a.name.localeCompare(b.name);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'county':
					sortedFarmers.sort((a, b) => {
						const comparison = a.county.localeCompare(b.county);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'createdAt':
				default:
					sortedFarmers.sort((a, b) => {
						const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
						const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
						const comparison = dateA - dateB;

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
			}

			setFarmers(sortedFarmers);
			setTotalPages(data.pagination.totalPages);
			setTotalFarmers(data.pagination.total);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch farmers. Please try again.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy]);

	// Effect to fetch farmers
	useEffect(() => {
		fetchFarmers();
	}, [fetchFarmers]);

	// Handle farmer added
	const handleFarmerAdded = () => {
		fetchFarmers();
	};

	// Handle delete farmer
	const handleDeleteFarmer = (farmer: Farmer) => {
		setFarmerToDelete(farmer);
		setIsDeleteDialogOpen(true);
	};

	// Handle farmer deleted
	const handleFarmerDeleted = () => {
		setIsDeleteDialogOpen(false);
		setFarmerToDelete(null);
		setIsDeleting(false);
		fetchFarmers();
	};

	// Handle close delete dialog
	const handleCloseDeleteDialog = () => {
		if (!isDeleting) {
			setIsDeleteDialogOpen(false);
			setFarmerToDelete(null);
		}
	};

	// Handle edit farmer
	const handleEditFarmer = (farmer: Farmer) => {
		setFarmerToEdit(farmer);
	};

	// Handle view farmer
	const handleViewFarmer = (farmer: Farmer) => {
		router.push(`/farmer/${farmer.id}`);
	};

	// Handle close edit dialog
	const handleCloseEditDialog = () => {
		setFarmerToEdit(null);
	};

	return (
		<main
			className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'
			aria-labelledby='farmers-heading'
		>
			{/* Header */}
			<header className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 id='farmers-heading' className='t-style-h2 text-primary'>
						Farmers
					</h1>
					<p className='t-style-body text-text-muted'>
						Manage and view all registered farmers in the system.
					</p>
				</div>
				<FarmerDialog onFarmerAdded={handleFarmerAdded} />
			</header>

			{/* Farmers Table */}
			<section className='w-full' aria-label='Farmers list'>
				<FarmersTable
					farmers={farmers}
					loading={loading}
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					sortBy={sortBy}
					setSortBy={setSortBy}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					totalPages={totalPages}
					totalFarmers={totalFarmers}
					itemsPerPage={itemsPerPage}
					setItemsPerPage={setItemsPerPage}
					onDeleteFarmer={handleDeleteFarmer}
					onEditFarmer={handleEditFarmer}
					onViewFarmer={handleViewFarmer}
				/>
			</section>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmDialog
				farmer={farmerToDelete}
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onFarmerDeleted={handleFarmerDeleted}
				isDeleting={isDeleting}
			/>

			{/* Edit Farmer Dialog */}
			{farmerToEdit && (
				<FarmerDialog farmer={farmerToEdit} onFarmerAdded={handleFarmerAdded} onClose={handleCloseEditDialog} />
			)}
		</main>
	);
}
