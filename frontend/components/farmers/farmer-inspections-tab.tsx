'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
	Card,
	CardContent,
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Badge,
} from '@/components/ui';
import { Search, Calendar, User, BarChart3, Edit, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import type { InspectionWithFarm } from '@/types/inspection';
import InspectionUpdateDialog from '@/components/inspections/inspection-update-dialog';
import DeleteInspectionConfirmDialog from '@/components/inspections/delete-inspection-confirm-dialog';

interface FarmerInspectionsTabProps {
	farmerId: string;
	onDataChange?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmerInspectionsTab({ farmerId, onDataChange: _onDataChange }: FarmerInspectionsTabProps) {
	const [inspections, setInspections] = useState<InspectionWithFarm[]>([]);
	const [filteredInspections, setFilteredInspections] = useState<InspectionWithFarm[]>([]);
	const [loading, setLoading] = useState(true);

	// Update dialog state
	const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
	const [inspectionToUpdate, setInspectionToUpdate] = useState<InspectionWithFarm | null>(null);

	// Delete dialog state
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [inspectionToDelete, setInspectionToDelete] = useState<InspectionWithFarm | null>(null);

	// Search, sort, and pagination state
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState('date-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Pagination calculations
	const totalInspections = filteredInspections.length;
	const totalPages = Math.ceil(totalInspections / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedInspections = filteredInspections.slice(startIndex, endIndex);

	// Sort options for inspections
	const sortOptions = [
		{ value: 'date-desc', label: 'Date (Newest)' },
		{ value: 'date-asc', label: 'Date (Oldest)' },
		{ value: 'complianceScore-desc', label: 'Score (Highest)' },
		{ value: 'complianceScore-asc', label: 'Score (Lowest)' },
		{ value: 'inspectorName-asc', label: 'Inspector (A-Z)' },
		{ value: 'inspectorName-desc', label: 'Inspector (Z-A)' },
		{ value: 'status-asc', label: 'Status (A-Z)' },
		{ value: 'status-desc', label: 'Status (Z-A)' },
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

	// Filter and sort inspections
	useEffect(() => {
		let filtered = [...inspections];

		// Filter by search term
		if (debouncedSearchTerm) {
			filtered = filtered.filter(
				(inspection) =>
					inspection.inspectorName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
					inspection.farm.farmName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
					inspection.status.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
			);
		}

		// Sort inspections
		const [sortField, sortDirection] = sortBy.split('-');
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case 'date':
					comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
					break;
				case 'inspectorName':
					comparison = a.inspectorName.localeCompare(b.inspectorName);
					break;
				case 'complianceScore':
					comparison = (a.complianceScore || 0) - (b.complianceScore || 0);
					break;
				case 'status':
					comparison = a.status.localeCompare(b.status);
					break;
				default:
					comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		setFilteredInspections(filtered);
	}, [inspections, debouncedSearchTerm, sortBy]);

	useEffect(() => {
		setCurrentPage(1);
	}, [itemsPerPage]);

	// Generate pagination items with ellipsis
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

	// Fetch inspections for the farmer's farms
	const fetchInspections = useCallback(async () => {
		if (!farmerId) {
			return;
		}

		try {
			setLoading(true);
			const farmsResponse = await fetch(`${BASE_URL}/farmers/${farmerId}/details`);
			if (!farmsResponse.ok) {
				const errorData = await farmsResponse.json();
				throw new Error(errorData.message || 'Failed to fetch farmer details');
			}

			const farmsResult = await farmsResponse.json();
			if (!farmsResult.success || !farmsResult.data?.farms || farmsResult.data.farms.length === 0) {
				setInspections([]);

				return;
			}

			// Get inspections for all farms
			const farmIds = farmsResult.data.farms.map((farm: any) => farm.id);
			const inspectionPromises = farmIds.map(async (farmId: string) => {
				try {
					const response = await fetch(`${BASE_URL}/inspections?farmId=${farmId}&limit=100`);
					if (response.ok) {
						const result = await response.json();

						return result.success && result.data ? result.data : [];
					}

					return [];
				} catch {
					return [];
				}
			});

			const inspectionArrays = await Promise.all(inspectionPromises);
			const allInspections = inspectionArrays.flat();

			// Sort by inspection date (newest first)
			allInspections.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

			setInspections(allInspections);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch inspections. Please try again.';
			toast.error(errorMessage);
			setInspections([]);
		} finally {
			setLoading(false);
		}
	}, [farmerId]);

	useEffect(() => {
		fetchInspections();
	}, [fetchInspections]);

	// Handler for updating an inspection
	const handleUpdateInspection = (inspection: InspectionWithFarm) => {
		setInspectionToUpdate(inspection);
		setIsUpdateDialogOpen(true);
	};

	// Handler for deleting an inspection
	const handleDeleteInspection = (inspection: InspectionWithFarm) => {
		setInspectionToDelete(inspection);
		setIsDeleteDialogOpen(true);
	};

	// Handler for closing update dialog
	const handleCloseUpdateDialog = () => {
		setIsUpdateDialogOpen(false);
		setInspectionToUpdate(null);
	};

	// Handler for closing delete dialog
	const handleCloseDeleteDialog = () => {
		setIsDeleteDialogOpen(false);
		setInspectionToDelete(null);
	};

	// Handler for inspection updated
	const handleInspectionUpdated = () => {
		fetchInspections(); // Refresh the list
		handleCloseUpdateDialog();
	};

	// Handler for inspection deleted
	const handleInspectionDeleted = () => {
		fetchInspections(); // Refresh the list
		handleCloseDeleteDialog();
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

	// Format date helper
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Get status badge variant
	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'APPROVED':
				return (
					<Badge className='t-syle-link border-green-200 bg-green-100 !font-normal text-green-800'>
						Approved
					</Badge>
				);
			case 'REJECTED':
				return (
					<Badge className='t-syle-link border-red-200 bg-red-100 !font-normal text-red-800'>Rejected</Badge>
				);
			case 'SUBMITTED':
				return (
					<Badge className='t-syle-link border-blue-200 bg-blue-100 !font-normal text-blue-800'>
						Submitted
					</Badge>
				);
			case 'DRAFT':
				return (
					<Badge className='t-syle-link border-gray-200 bg-gray-100 !font-normal text-gray-800'>Draft</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	// Get compliance score color
	const getScoreColor = (score?: number) => {
		if (score === null || score === undefined) {
			return 'text-gray-500';
		}
		if (score >= 90) {
			return 'text-green-600';
		}
		if (score >= 80) {
			return 'text-yellow-600';
		}

		return 'text-red-600';
	};

	return (
		<>
			<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
				<CardContent className='p-0'>
					{/* Controls Section */}
					<div className='mb-6 flex flex-col gap-4' role='region' aria-label='Inspections table controls'>
						{/* Search and Sort Row */}
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							{/* Search Input */}
							<div className='relative max-w-sm flex-1'>
								<label htmlFor='inspection-search' className='sr-only'>
									Search inspections by inspector, farm, or status
								</label>
								<Search
									className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
									aria-hidden='true'
								/>
								<Input
									id='inspection-search'
									placeholder="Search by inspector's name or farm name..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='t-style-caption border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary bg-accent flex h-10 items-center self-stretch rounded-lg border-0 pl-10 pr-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11 dark:border'
									aria-describedby='search-description'
								/>
								<div id='search-description' className='sr-only'>
									Search will filter inspections in real-time as you type
								</div>
							</div>

							{/* Sort Dropdown */}
							<div className='flex gap-2'>
								<label htmlFor='sort-select' className='sr-only'>
									Sort inspections by
								</label>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger
										id='sort-select'
										className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-[180px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
										aria-label='Sort inspections by'
									>
										<SelectValue placeholder='Sort by' />
									</SelectTrigger>
									<SelectContent className='bg-accent border-border w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] border-0 shadow-md dark:border'>
										{sortOptions.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}
												className='text-text-muted'
											>
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
								? 'Loading inspections...'
								: totalInspections === 0
									? debouncedSearchTerm
										? 'No inspections found matching your search criteria.'
										: 'No inspections available.'
									: `Showing ${paginatedInspections.length} of ${totalInspections} inspections`}
						</div>
					</div>

					{/* Table Section */}
					<div className='overflow-x-auto' role='region' aria-label='Inspections data table'>
						<Table>
							<caption className='sr-only'>
								Table of inspections for this farmer&apos;s farms.
								{totalInspections > 0
									? `Currently showing ${paginatedInspections.length} of ${totalInspections} inspections.`
									: 'No inspections available.'}
							</caption>
							<TableHeader className='bg-accent'>
								<TableRow className='border-none'>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tl-lg !font-semibold'>
										Inspector
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Farm
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Date
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Score
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
											colSpan={6}
											className='t-style-link text-text-muted h-24 text-center !font-normal'
										>
											<div role='status' aria-label='Loading inspections data'>
												Loading inspections...
											</div>
										</TableCell>
									</TableRow>
								) : paginatedInspections.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className='t-style-link text-text-muted h-24 text-center !font-normal'
										>
											{debouncedSearchTerm
												? 'No inspections found matching your search criteria.'
												: 'No inspections found. Create your first inspection to get started.'}
										</TableCell>
									</TableRow>
								) : (
									paginatedInspections.map((inspection) => (
										<TableRow key={inspection.id} className='border-border/40 dark:border-border'>
											<TableCell>
												<div className='flex items-center gap-3'>
													<div className='bg-accent rounded-lg p-2'>
														<User className='text-primary size-4' aria-hidden='true' />
													</div>
													<div>
														<p className='t-style-link text-text-muted !font-normal'>
															{inspection.inspectorName}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<p className='t-style-link text-text-muted !font-normal'>
													{inspection.farm.farmName}
												</p>
											</TableCell>
											<TableCell>
												<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
													<Calendar className='size-3' aria-hidden='true' />
													<span>
														<span className='sr-only'>Inspection date: </span>
														{formatDate(inspection.date)}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
													<BarChart3 className='size-3' aria-hidden='true' />
													<span className={getScoreColor(inspection.complianceScore)}>
														<span className='sr-only'>Compliance score: </span>
														{inspection.complianceScore !== null &&
														inspection.complianceScore !== undefined
															? `${inspection.complianceScore.toFixed(1)}%`
															: 'N/A'}
													</span>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(inspection.status)}</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-2'>
													{/* Approve/Reject Button - only for inspections with score >= 80 and < 90 */}
													{inspection.complianceScore !== null &&
														inspection.complianceScore !== undefined &&
														inspection.complianceScore >= 80 &&
														inspection.complianceScore < 90 &&
														inspection.status === 'SUBMITTED' && (
															<>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() =>
																		handleApproveInspection(inspection.id)
																	}
																	className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-green-600 hover:bg-green-50 hover:text-green-800 focus:ring-[0.5px] focus:ring-green-500 focus:ring-offset-2'
																	aria-label={`Approve inspection for ${inspection.farm.farmName}`}
																>
																	<CheckCircle
																		className='size-4'
																		aria-hidden='true'
																	/>
																</Button>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() =>
																		handleRejectInspection(inspection.id)
																	}
																	className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-red-600 hover:bg-red-50 hover:text-red-800 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
																	aria-label={`Reject inspection for ${inspection.farm.farmName}`}
																>
																	<XCircle className='size-4' aria-hidden='true' />
																</Button>
															</>
														)}

													{/* Update Inspection Button */}
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleUpdateInspection(inspection)}
														className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-800 focus:ring-[0.5px] focus:ring-blue-500 focus:ring-offset-2'
														aria-label={`Update inspection for ${inspection.farm.farmName}`}
													>
														<Edit className='size-4' aria-hidden='true' />
													</Button>

													{/* Delete Inspection Button */}
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleDeleteInspection(inspection)}
														className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-red-600 hover:bg-red-50 hover:text-red-800 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
														aria-label={`Delete inspection for ${inspection.farm.farmName}`}
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
							<nav aria-label='Inspections table pagination' className='flex-1'>
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
			</Card>

			{/* Update Inspection Dialog */}
			<InspectionUpdateDialog
				isOpen={isUpdateDialogOpen}
				onClose={handleCloseUpdateDialog}
				inspection={inspectionToUpdate}
				onInspectionUpdated={handleInspectionUpdated}
			/>

			{/* Delete Inspection Dialog */}
			<DeleteInspectionConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				inspection={inspectionToDelete}
				onInspectionDeleted={handleInspectionDeleted}
			/>
		</>
	);
}
