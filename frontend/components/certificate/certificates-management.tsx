'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CertificateWithFarm } from '@/types/certificate';
import CertificatesTable from './certificates-table';
import DeleteCertificateConfirmDialog from './delete-certificate-confirm-dialog';

interface PaginatedResponse {
	success: boolean;
	data: CertificateWithFarm[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CertificatesManagement() {
	const [certificates, setCertificates] = useState<CertificateWithFarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
	const [sortBy, setSortBy] = useState('issueDate-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCertificates, setTotalCertificates] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Delete dialog states
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [certificateToDelete, setCertificateToDelete] = useState<CertificateWithFarm | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Debounce searchTerm
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Fetch certificates function
	const fetchCertificates = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
				...(debouncedSearchTerm && { search: debouncedSearchTerm }),
			});

			const response = await fetch(`${BASE_URL}/certificates?${params}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch certificates');
			}

			const data: PaginatedResponse = await response.json();

			// Sort certificates locally based on sortBy
			const sortedCertificates = [...data.data];
			const [sortField, sortDirection] = sortBy.split('-');

			switch (sortField) {
				case 'issueDate':
					sortedCertificates.sort((a, b) => {
						const comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'expiryDate':
					sortedCertificates.sort((a, b) => {
						const comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'certificateNo':
					sortedCertificates.sort((a, b) => {
						const comparison = a.certificateNo.localeCompare(b.certificateNo);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'farmName':
					sortedCertificates.sort((a, b) => {
						const comparison = a.farm.farmName.localeCompare(b.farm.farmName);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				case 'farmerName':
					sortedCertificates.sort((a, b) => {
						const comparison = a.farm.farmer.name.localeCompare(b.farm.farmer.name);

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
				default:
					sortedCertificates.sort((a, b) => {
						const comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();

						return sortDirection === 'desc' ? -comparison : comparison;
					});
					break;
			}

			setCertificates(sortedCertificates);
			setTotalPages(data.pagination.totalPages);
			setTotalCertificates(data.pagination.total);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch certificates. Please try again.';
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy]);

	// Effect to fetch certificates
	useEffect(() => {
		fetchCertificates();
	}, [fetchCertificates]);

	// Handle delete certificate
	const handleDeleteCertificate = (certificate: CertificateWithFarm) => {
		setCertificateToDelete(certificate);
		setIsDeleteDialogOpen(true);
	};

	// Handle certificate deleted
	const handleCertificateDeleted = () => {
		setIsDeleteDialogOpen(false);
		setCertificateToDelete(null);
		setIsDeleting(false);
		fetchCertificates();
	};

	// Handle close delete dialog
	const handleCloseDeleteDialog = () => {
		if (!isDeleting) {
			setIsDeleteDialogOpen(false);
			setCertificateToDelete(null);
		}
	};

	// Handle download certificate
	const handleDownloadCertificate = (certificate: CertificateWithFarm) => {
		if (certificate.pdfUrl) {
			window.open(certificate.pdfUrl, '_blank');
		} else {
			toast.error('Certificate PDF is not available for download');
		}
	};

	return (
		<main
			className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'
			aria-labelledby='certificates-heading'
		>
			{/* Header */}
			<header className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<div>
					<h1 id='certificates-heading' className='t-style-h2 text-primary'>
						Certificates
					</h1>
					<p className='t-style-body text-text-muted'>
						Manage and view all organic certificates in the system.
					</p>
				</div>
			</header>

			{/* Certificates Table */}
			<section className='w-full' aria-label='Certificates list'>
				<CertificatesTable
					certificates={certificates}
					loading={loading}
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					sortBy={sortBy}
					setSortBy={setSortBy}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					totalPages={totalPages}
					totalCertificates={totalCertificates}
					itemsPerPage={itemsPerPage}
					setItemsPerPage={setItemsPerPage}
					onDeleteCertificate={handleDeleteCertificate}
					onDownloadCertificate={handleDownloadCertificate}
				/>
			</section>

			{/* Delete Confirmation Dialog */}
			<DeleteCertificateConfirmDialog
				certificate={certificateToDelete}
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onCertificateDeleted={handleCertificateDeleted}
				isDeleting={isDeleting}
			/>
		</main>
	);
}
