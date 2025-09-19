'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { InspectionWithFarm } from '@/types/inspection';
import InspectionsTable from './inspections-table';
import DeleteInspectionConfirmDialog from './delete-inspection-confirm-dialog';
import InspectionUpdateDialog from './inspection-update-dialog';

interface PaginatedResponse {
	success: boolean;
	data: InspectionWithFarm[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InspectionsManagement() {
	const [inspections, setInspections] = useState<InspectionWithFarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
	const [sortBy, setSortBy] = useState('date-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalInspections, setTotalInspections] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Delete dialog states
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [inspectionToDelete, setInspectionToDelete] = useState<InspectionWithFarm | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Edit dialog states
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [inspectionToEdit, setInspectionToEdit] = useState<InspectionWithFarm | null>(null);

	// Debounce searchTerm
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Fetch inspections function
	const fetchInspections = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				...(debouncedSearchTerm && { search: debouncedSearchTerm }),
			});

			const response = await fetch(`${BASE_URL}/inspections?${params}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch inspections');
			}

			const data: PaginatedResponse = await response.json();

			// Sort inspections locally based on sortBy
			const sortedInspections = [...data.data];
			const [sortField, sortOrder] = sortBy.split('-');

			switch (sortField) {
				case 'date':
					sortedInspections.sort((a, b) => {
						const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();

						return sortOrder === 'desc' ? -comparison : comparison;
					});
					break;
				case 'farm':
					sortedInspections.sort((a, b) => {
						const comparison = a.farm.farmName.localeCompare(b.farm.farmName);

						return sortOrder === 'desc' ? -comparison : comparison;
					});
					break;
				case 'inspector':
					sortedInspections.sort((a, b) => {
						const comparison = a.inspectorName.localeCompare(b.inspectorName);

						return sortOrder === 'desc' ? -comparison : comparison;
					});
					break;
				case 'status':
					sortedInspections.sort((a, b) => {
						const comparison = a.status.localeCompare(b.status);

						return sortOrder === 'desc' ? -comparison : comparison;
					});
					break;
				default:
					sortedInspections.sort((a, b) => {
						const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();

						return sortOrder === 'desc' ? -comparison : comparison;
					});
					break;
			}

			setInspections(sortedInspections);
			setTotalPages(data.pagination.totalPages);
			setTotalInspections(data.pagination.total);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch inspections. Please try again.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy]);

	// Effect to fetch inspections
	useEffect(() => {
		fetchInspections();
	}, [fetchInspections]);

	// Handle inspection updated
	const handleInspectionUpdated = () => {
		setIsEditDialogOpen(false);
		setInspectionToEdit(null);
		fetchInspections();
	};

	// Handle delete inspection
	const handleDeleteInspection = (inspection: InspectionWithFarm) => {
		setInspectionToDelete(inspection);
		setIsDeleteDialogOpen(true);
	};

	// Handle inspection deleted
	const handleInspectionDeleted = () => {
		setIsDeleteDialogOpen(false);
		setInspectionToDelete(null);
		setIsDeleting(false);
		fetchInspections();
	};

	// Handle close delete dialog
	const handleCloseDeleteDialog = () => {
		if (!isDeleting) {
			setIsDeleteDialogOpen(false);
			setInspectionToDelete(null);
		}
	};

	// Handle edit inspection
	const handleEditInspection = (inspection: InspectionWithFarm) => {
		setInspectionToEdit(inspection);
		setIsEditDialogOpen(true);
	};

	// Handle close edit dialog
	const handleCloseEditDialog = () => {
		setIsEditDialogOpen(false);
		setInspectionToEdit(null);
	};

	// Handler for approving an inspection
	const handleApproveInspection = async (inspectionId: string) => {
		try {
			const response = await fetch(`${BASE_URL}/inspections/${inspectionId}/approve`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ approved: true }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Failed to approve inspection: ${response.status}`);
			}

			await response.json();
			toast.success('Inspection approved successfully!');
			fetchInspections();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to approve inspection';
			toast.error(errorMessage);
		}
	};

	// Handler for rejecting an inspection
	const handleRejectInspection = async (inspectionId: string) => {
		try {
			const response = await fetch(`${BASE_URL}/inspections/${inspectionId}/approve`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ approved: false }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Failed to reject inspection: ${response.status}`);
			}

			await response.json();
			toast.success('Inspection rejected successfully!');
			fetchInspections();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to reject inspection';
			toast.error(errorMessage);
		}
	};

	return (
		<main
			className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'
			aria-labelledby='inspections-heading'
		>
			{/* Header */}
			<header className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 id='inspections-heading' className='t-style-h2 text-primary'>
						Inspections
					</h1>
					<p className='t-style-body text-text-muted'>Manage and view all farm inspections in the system.</p>
				</div>
			</header>

			{/* Inspections Table */}
			<section className='w-full' aria-label='Inspections list'>
				<InspectionsTable
					inspections={inspections}
					loading={loading}
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					sortBy={sortBy}
					setSortBy={setSortBy}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					totalPages={totalPages}
					totalInspections={totalInspections}
					itemsPerPage={itemsPerPage}
					setItemsPerPage={setItemsPerPage}
					onDeleteInspection={handleDeleteInspection}
					onEditInspection={handleEditInspection}
					onApproveInspection={handleApproveInspection}
					onRejectInspection={handleRejectInspection}
				/>
			</section>

			{/* Delete Confirmation Dialog */}
			<DeleteInspectionConfirmDialog
				inspection={inspectionToDelete}
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onInspectionDeleted={handleInspectionDeleted}
				isDeleting={isDeleting}
			/>

			{/* Edit Inspection Dialog */}
			{inspectionToEdit && (
				<InspectionUpdateDialog
					inspection={inspectionToEdit}
					isOpen={isEditDialogOpen}
					onInspectionUpdated={handleInspectionUpdated}
					onClose={handleCloseEditDialog}
				/>
			)}
		</main>
	);
}
