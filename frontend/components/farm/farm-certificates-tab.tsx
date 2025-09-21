'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Card,
	CardContent,
	Badge,
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui';
import { Award, Calendar, Clock, Download, Trash2, Search } from 'lucide-react';
import type { Certificate } from '@/types/certificate';
import DeleteCertificateConfirmDialog from '../certificate/delete-certificate-confirm-dialog';

interface FarmCertificatesTabProps {
	farmId: string;
	onDataChange?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmCertificatesTab({ farmId, onDataChange: _onDataChange }: FarmCertificatesTabProps) {
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);

	// Search, sort, and pagination state
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState('issueDate-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Pagination calculations
	const totalCertificates = filteredCertificates.length;
	const totalPages = Math.ceil(totalCertificates / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedCertificates = filteredCertificates.slice(startIndex, endIndex);

	// Sort options for certificates
	const sortOptions = [
		{ value: 'issueDate-desc', label: 'Issue Date (Newest)' },
		{ value: 'issueDate-asc', label: 'Issue Date (Oldest)' },
		{ value: 'expiryDate-desc', label: 'Expiry Date (Latest)' },
		{ value: 'expiryDate-asc', label: 'Expiry Date (Earliest)' },
		{ value: 'certificateNo-asc', label: 'Certificate Number (A-Z)' },
		{ value: 'certificateNo-desc', label: 'Certificate Number (Z-A)' },
	];

	const itemsPerPageOptions = [5, 10, 25, 50];

	// Debounce search term
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Filter and sort certificates
	useEffect(() => {
		let filtered = [...certificates];

		// Filter by search term
		if (debouncedSearchTerm) {
			filtered = filtered.filter((certificate) =>
				certificate.certificateNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
			);
		}

		// Sort certificates
		const [sortField, sortDirection] = sortBy.split('-');
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case 'certificateNo':
					comparison = a.certificateNo.localeCompare(b.certificateNo);
					break;
				case 'issueDate':
					comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
					break;
				case 'expiryDate':
					comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
					break;
				default:
					comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		setFilteredCertificates(filtered);
	}, [certificates, debouncedSearchTerm, sortBy]);

	useEffect(() => {
		setCurrentPage(1);
	}, [itemsPerPage]);

	// Fetch certificates for this farm
	const fetchCertificates = useCallback(async () => {
		if (!farmId) {
			return;
		}

		try {
			setLoading(true);

			const response = await fetch(`${BASE_URL}/certificates?farmId=${farmId}&limit=100`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch certificates');
			}

			const result = await response.json();
			if (result.success && result.data) {
				const certificates = result.data.sort(
					(a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
				);
				setCertificates(certificates);
			} else {
				setCertificates([]);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch certificates. Please try again.';
			toast.error(errorMessage);
			setCertificates([]);
		} finally {
			setLoading(false);
		}
	}, [farmId]);

	useEffect(() => {
		fetchCertificates();
	}, [fetchCertificates]);

	// Get status badge by expiry date
	const getStatusBadgeByDate = (expiryDate: string) => {
		const now = new Date();
		const expiry = new Date(expiryDate);
		const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilExpiry < 0) {
			return <Badge className='t-syle-link border-red-200 bg-red-100 !font-normal text-red-800'>Expired</Badge>;
		}

		if (daysUntilExpiry <= 30) {
			return (
				<Badge className='t-syle-link border-yellow-200 bg-yellow-100 !font-normal text-yellow-800'>
					Expiring Soon
				</Badge>
			);
		}

		return <Badge className='t-syle-link border-green-200 bg-green-100 !font-normal text-green-800'>Active</Badge>;
	};

	// Format date helper
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Handle certificate download/view
	const handleDownload = (certificate: Certificate) => {
		if (certificate.pdfUrl) {
			window.open(certificate.pdfUrl, '_blank');
		} else {
			toast.error('Certificate PDF not available');
		}
	};

	// Handle delete certificate
	const handleDeleteClick = (certificate: Certificate) => {
		setCertificateToDelete(certificate);
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		await fetchCertificates();
		_onDataChange?.();

		setIsDeleteDialogOpen(false);
		setCertificateToDelete(null);
	};

	const handleDeleteCancel = () => {
		setIsDeleteDialogOpen(false);
		setCertificateToDelete(null);
	};

	const generatePaginationItems = () => {
		const items: (number | string)[] = [];
		const showEllipsis = totalPages > 7;

		if (showEllipsis) {
			if (currentPage <= 4) {
				// Show 1,2,3,4,5...last
				for (let i = 1; i <= 5; i++) {
					items.push(i);
				}
				items.push('ellipsis-end');
				items.push(totalPages);
			} else if (currentPage >= totalPages - 3) {
				// Show 1...last-4,last-3,last-2,last-1,last
				items.push(1);
				items.push('ellipsis-start');
				for (let i = totalPages - 4; i <= totalPages; i++) {
					items.push(i);
				}
			} else {
				// Show 1...current-1,current,current+1...last
				items.push(1);
				items.push('ellipsis-start');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					items.push(i);
				}
				items.push('ellipsis-end');
				items.push(totalPages);
			}
		} else {
			// Show all pages if 7 or fewer
			for (let i = 1; i <= totalPages; i++) {
				items.push(i);
			}
		}

		return items;
	};

	return (
		<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
			<CardContent className='p-0'>
				{/* Controls Section */}
				<div className='mb-6 flex flex-col gap-4' role='region' aria-label='Certificates table controls'>
					{/* Search and Sort Row */}
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						{/* Search Input */}
						<div className='relative max-w-sm flex-1'>
							<label htmlFor='certificate-search' className='sr-only'>
								Search certificates by certificate number
							</label>
							<Search
								className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
								aria-hidden='true'
							/>
							<Input
								id='certificate-search'
								placeholder='Search certificates by number...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='t-style-caption border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary bg-accent flex h-10 items-center self-stretch rounded-lg border-0 pl-10 pr-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11 dark:border'
								aria-describedby='search-description'
							/>
							<div id='search-description' className='sr-only'>
								Search will filter certificates in real-time as you type
							</div>
						</div>

						{/* Sort Dropdown */}
						<div className='flex gap-2'>
							<label htmlFor='sort-select' className='sr-only'>
								Sort certificates by
							</label>
							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger
									id='sort-select'
									className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-[180px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
									aria-label='Sort certificates by'
								>
									<SelectValue placeholder='Sort by' />
								</SelectTrigger>
								<SelectContent className='bg-accent border-border w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] border-0 shadow-md dark:border'>
									{sortOptions.map((option) => (
										<SelectItem key={option.value} value={option.value} className='text-text-muted'>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Results Info */}
					<div className='text-text-muted text-sm' aria-live='polite' aria-atomic='true' role='status'>
						{loading
							? 'Loading certificates...'
							: totalCertificates === 0
								? debouncedSearchTerm
									? 'No certificates found matching your search criteria.'
									: 'No certificates available.'
								: `Showing ${paginatedCertificates.length} of ${totalCertificates} certificates`}
					</div>
				</div>

				{/* Table Section */}
				<div className='overflow-x-auto' role='region' aria-label='Certificates data table'>
					<Table>
						<caption className='sr-only'>
							Table of certificates issued for this farm.
							{totalCertificates > 0
								? `Currently showing ${paginatedCertificates.length} of ${totalCertificates} certificates.`
								: 'No certificates available.'}
						</caption>
						<TableHeader className='bg-accent'>
							<TableRow className='border-none'>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tl-lg !font-semibold'>
									Certificate No
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Issue Date
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Expiry Date
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Status
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tr-lg text-right !font-semibold'>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className='t-style-link text-text-muted h-24 text-center !font-normal'
									>
										<div role='status' aria-label='Loading certificates data'>
											Loading certificates...
										</div>
									</TableCell>
								</TableRow>
							) : paginatedCertificates.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className='t-style-link text-text-muted h-24 text-center !font-normal'
									>
										{debouncedSearchTerm
											? 'No certificates found matching your search criteria.'
											: 'No certificates found. No certificates have been issued for this farm yet.'}
									</TableCell>
								</TableRow>
							) : (
								paginatedCertificates.map((certificate) => (
									<TableRow key={certificate.id} className='border-border/40 dark:border-border'>
										<TableCell>
											<div className='flex items-center gap-3'>
												<div className='bg-accent rounded-lg p-2'>
													<Award className='text-primary size-4' aria-hidden='true' />
												</div>
												<p className='t-style-link text-text-muted !font-normal'>
													{certificate.certificateNo}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<Calendar className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Issued on: </span>
													{formatDate(certificate.issueDate)}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<Clock className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Expires on: </span>
													{formatDate(certificate.expiryDate)}
												</span>
											</div>
										</TableCell>
										<TableCell>{getStatusBadgeByDate(certificate.expiryDate)}</TableCell>
										<TableCell className='text-right'>
											<div className='flex items-center justify-end gap-2'>
												{certificate.pdfUrl ? (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleDownload(certificate)}
														className='text-primary focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
														aria-label={`Download certificate ${certificate.certificateNo}`}
													>
														<Download className='size-4' aria-hidden='true' />
													</Button>
												) : (
													<Button
														variant='ghost'
														size='sm'
														disabled
														className='text-text-muted/50 h-8 w-8 cursor-not-allowed p-0'
														aria-label='PDF not available'
													>
														<Download className='size-4' aria-hidden='true' />
													</Button>
												)}
												<Button
													variant='ghost'
													size='sm'
													onClick={() => handleDeleteClick(certificate)}
													className='text-error focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
													aria-label={`Delete certificate ${certificate.certificateNo}`}
												>
													<Trash2 className='size-4' aria-hidden='true' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				<div className='mt-6 flex w-full flex-col items-center justify-between gap-4 lg:flex-row'>
					{/* Items per page */}
					<div className='t-style-link text-text-muted flex flex-1 items-center gap-2'>
						<label htmlFor='items-per-page' className='sr-only'>
							Items per page
						</label>
						<span>Show</span>
						<Select
							value={itemsPerPage.toString()}
							onValueChange={(value) => setItemsPerPage(parseInt(value))}
						>
							<SelectTrigger
								id='items-per-page'
								className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-8 w-20 items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 dark:border'
								aria-label='Items per page'
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className='bg-accent border-border w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] border-0 shadow-md dark:border'>
								{itemsPerPageOptions.map((option) => (
									<SelectItem key={option} value={option.toString()} className='text-text-muted'>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<span>per page</span>
					</div>

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<nav aria-label='Certificates table pagination' className='flex-1'>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
											className={
												currentPage === 1 || loading
													? 'pointer-events-none opacity-50'
													: 'focus:ring-primary focus:ring-offset-background cursor-pointer focus:ring-[0.5px] focus:ring-offset-2'
											}
											aria-label={`Go to previous page, currently on page ${currentPage}`}
											tabIndex={currentPage === 1 || loading ? -1 : 0}
										/>
									</PaginationItem>

									{generatePaginationItems().map((item) => {
										if (typeof item === 'string' && item.startsWith('ellipsis')) {
											return (
												<PaginationItem key={item}>
													<PaginationEllipsis aria-label='More pages available' />
												</PaginationItem>
											);
										}

										const pageNumber = item as number;

										return (
											<PaginationItem key={pageNumber}>
												<PaginationLink
													onClick={() => setCurrentPage(pageNumber)}
													isActive={currentPage === pageNumber}
													className='focus:ring-primary focus:ring-offset-background cursor-pointer focus:ring-[0.5px] focus:ring-offset-2'
													aria-label={
														currentPage === pageNumber
															? `Current page, page ${pageNumber}`
															: `Go to page ${pageNumber}`
													}
													aria-current={currentPage === pageNumber ? 'page' : undefined}
												>
													{pageNumber}
												</PaginationLink>
											</PaginationItem>
										);
									})}

									<PaginationItem>
										<PaginationNext
											onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
											className={
												currentPage === totalPages || loading
													? 'pointer-events-none opacity-50'
													: 'focus:ring-primary focus:ring-offset-background cursor-pointer focus:ring-[0.5px] focus:ring-offset-2'
											}
											aria-label={`Go to next page, currently on page ${currentPage} of ${totalPages}`}
											tabIndex={currentPage === totalPages || loading ? -1 : 0}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</nav>
					)}
				</div>
			</CardContent>

			{/* Delete Confirmation Dialog */}
			<DeleteCertificateConfirmDialog
				certificate={certificateToDelete}
				isOpen={isDeleteDialogOpen}
				onClose={handleDeleteCancel}
				onCertificateDeleted={handleDeleteConfirm}
			/>
		</Card>
	);
}
