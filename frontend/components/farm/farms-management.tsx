'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { FarmWithFieldsAndFarmer } from '@/types/farm';
import FarmsTable from './farms-table';
import FarmDialog from './farm-dialog';
import DeleteFarmConfirmDialog from './delete-farm-confirm-dialog';
import { useRouter } from 'next/navigation';

interface PaginatedResponse {
	success: boolean;
	data: FarmWithFieldsAndFarmer[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmsManagement() {
	const router = useRouter();
	const [farms, setFarms] = useState<FarmWithFieldsAndFarmer[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
	const [sortBy, setSortBy] = useState('createdAt-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalFarms, setTotalFarms] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Delete dialog states
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [farmToDelete, setFarmToDelete] = useState<FarmWithFieldsAndFarmer | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Edit dialog states
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [farmToEdit, setFarmToEdit] = useState<FarmWithFieldsAndFarmer | null>(null);

	// Debounce searchTerm
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Fetch farms function
	const fetchFarms = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				...(debouncedSearchTerm && { search: debouncedSearchTerm }),
			});

			const response = await fetch(`${BASE_URL}/farms?${params}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch farms');
			}

			const data: PaginatedResponse = await response.json();

			// Sort farms locally based on sortBy
			const sortedFarms = [...data.data];
			const [sortField, sortDirection] = sortBy.split('-');

			switch (sortField) {
				case 'farmName':
					sortedFarms.sort((a, b) => {
						const comparison = a.farmName.localeCompare(b.farmName);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'location':
					sortedFarms.sort((a, b) => {
						const comparison = a.location.localeCompare(b.location);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'areaHa':
					sortedFarms.sort((a, b) => {
						const comparison = a.areaHa - b.areaHa;

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'createdAt':
				default:
					sortedFarms.sort((a, b) => {
						const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
						const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
						const comparison = dateA - dateB;

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
			}

			setFarms(sortedFarms);
			setTotalPages(data.pagination.totalPages);
			setTotalFarms(data.pagination.total);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch farms. Please try again.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy]);

	// Effect to fetch farms
	useEffect(() => {
		fetchFarms();
	}, [fetchFarms]);

	// Handle farm added/updated
	const handleFarmAdded = () => {
		setIsEditDialogOpen(false);
		setFarmToEdit(null);
		fetchFarms();
	};

	// Handle delete farm
	const handleDeleteFarm = (farm: FarmWithFieldsAndFarmer) => {
		setFarmToDelete(farm);
		setIsDeleteDialogOpen(true);
	};

	// Handle farm deleted
	const handleFarmDeleted = () => {
		setIsDeleteDialogOpen(false);
		setFarmToDelete(null);
		setIsDeleting(false);
		fetchFarms();
	};

	// Handle close delete dialog
	const handleCloseDeleteDialog = () => {
		if (!isDeleting) {
			setIsDeleteDialogOpen(false);
			setFarmToDelete(null);
		}
	};

	// Handle edit farm
	const handleEditFarm = (farm: FarmWithFieldsAndFarmer) => {
		setFarmToEdit(farm);
		setIsEditDialogOpen(true);
	};

	// Handle close edit dialog
	const handleCloseEditDialog = () => {
		setIsEditDialogOpen(false);
		setFarmToEdit(null);
	};

	// Handle view farm
	const handleViewFarm = (farm: FarmWithFieldsAndFarmer) => {
		router.push(`/farm/${farm.id}`);
	};

	return (
		<main
			className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'
			aria-labelledby='farms-heading'
		>
			{/* Header */}
			<header className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 id='farms-heading' className='t-style-h2 text-primary'>
						Farms
					</h1>
					<p className='t-style-body text-text-muted'>Manage and view all registered farms in the system.</p>
				</div>
			</header>

			{/* Farms Table */}
			<section className='w-full' aria-label='Farms list'>
				<FarmsTable
					farms={farms}
					loading={loading}
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					sortBy={sortBy}
					setSortBy={setSortBy}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					totalPages={totalPages}
					totalFarms={totalFarms}
					itemsPerPage={itemsPerPage}
					setItemsPerPage={setItemsPerPage}
					onDeleteFarm={handleDeleteFarm}
					onEditFarm={handleEditFarm}
					onViewFarm={handleViewFarm}
				/>
			</section>

			{/* Delete Confirmation Dialog */}
			<DeleteFarmConfirmDialog
				farm={farmToDelete}
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onFarmDeleted={handleFarmDeleted}
				isDeleting={isDeleting}
			/>

			{/* Edit Farm Dialog */}
			{farmToEdit && (
				<FarmDialog
					farm={farmToEdit}
					farmerId={farmToEdit.farmerId}
					isOpen={isEditDialogOpen}
					onFarmAdded={handleFarmAdded}
					onClose={handleCloseEditDialog}
				/>
			)}
		</main>
	);
}
