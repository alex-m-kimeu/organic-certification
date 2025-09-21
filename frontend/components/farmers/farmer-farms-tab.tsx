'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Farm } from '@/types/farm';
import {
	Card,
	CardContent,
	CardHeader,
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui';
import { Plus, Edit, Trash2, Search, ClipboardCheck } from 'lucide-react';
import { PiFarmLight } from 'react-icons/pi';
import FarmDialog from '../farm/farm-dialog';
import DeleteFarmConfirmDialog from '../farm/delete-farm-confirm-dialog';
import InspectionDialog from '../inspections/inspection-dialog';

interface FarmerFarmsTabProps {
	farmerId: string;
	onDataChange?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function FarmerFarmsTab({ farmerId, onDataChange }: FarmerFarmsTabProps) {
	const [farms, setFarms] = useState<Farm[]>([]);
	const [filteredFarms, setFilteredFarms] = useState<Farm[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [farmToEdit, setFarmToEdit] = useState<Farm | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
	const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
	const [farmToInspect, setFarmToInspect] = useState<Farm | null>(null);

	// Search, sort, and pagination state
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState('createdAt-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Pagination calculations
	const totalFarms = filteredFarms.length;
	const totalPages = Math.ceil(totalFarms / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedFarms = filteredFarms.slice(startIndex, endIndex);

	// Debounce search term
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Filter and sort farms
	useEffect(() => {
		let filtered = [...farms];

		// Filter by search term
		if (debouncedSearchTerm) {
			filtered = filtered.filter(
				(farm) =>
					farm.farmName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
					farm.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
			);
		}

		// Sort farms
		const [sortField, sortDirection] = sortBy.split('-');
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case 'farmName':
					comparison = a.farmName.localeCompare(b.farmName);
					break;
				case 'location':
					comparison = a.location.localeCompare(b.location);
					break;
				case 'areaHa':
					comparison = a.areaHa - b.areaHa;
					break;
				case 'createdAt':
				default:
					const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					comparison = dateA - dateB;
					break;
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		setFilteredFarms(filtered);
	}, [farms, debouncedSearchTerm, sortBy]);

	// Sort options for farms
	const sortOptions = [
		{ value: 'createdAt-desc', label: 'Newest First' },
		{ value: 'createdAt-asc', label: 'Oldest First' },
		{ value: 'farmName-asc', label: 'Name (A-Z)' },
		{ value: 'farmName-desc', label: 'Name (Z-A)' },
		{ value: 'location-asc', label: 'Location (A-Z)' },
		{ value: 'location-desc', label: 'Location (Z-A)' },
		{ value: 'areaHa-asc', label: 'Smallest Size First' },
		{ value: 'areaHa-desc', label: 'Largest Size First' },
	];

	const itemsPerPageOptions = [5, 10, 25, 50];

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

	const fetchFarms = useCallback(async () => {
		try {
			setIsLoading(true);

			const response = await fetch(`${BASE_URL}/farmers/${farmerId}/details`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Error: ${response.status}`);
			}

			const result = await response.json();
			if (result.success && result.data?.farms) {
				setFarms(result.data.farms);
			} else {
				throw new Error(result.message || 'Failed to fetch farms');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch farms. Please try again.';
			toast.error(errorMessage);
			setFarms([]);
		} finally {
			setIsLoading(false);
		}
	}, [farmerId]);

	useEffect(() => {
		fetchFarms();
	}, [fetchFarms]);

	const handleAddFarm = () => {
		setFarmToEdit(null);
		setIsDialogOpen(true);
	};

	const handleEditFarm = (farm: Farm) => {
		setFarmToEdit(farm);
		setIsDialogOpen(true);
	};

	const handleDeleteClick = (farm: Farm) => {
		setFarmToDelete(farm);
		setIsDeleteDialogOpen(true);
	};

	const handleInspectFarm = (farm: Farm) => {
		setFarmToInspect(farm);
		setIsInspectionDialogOpen(true);
	};

	const handleFarmAdded = () => {
		setFarmToEdit(null);
		setIsDialogOpen(false);
		fetchFarms();
		onDataChange?.();
	};

	const handleCloseDialog = () => {
		setFarmToEdit(null);
		setIsDialogOpen(false);
	};

	const handleCloseDeleteDialog = () => {
		setIsDeleteDialogOpen(false);
		setFarmToDelete(null);
	};

	const handleCloseInspectionDialog = () => {
		setFarmToInspect(null);
		setIsInspectionDialogOpen(false);
	};

	const handleInspectionCreated = () => {
		setFarmToInspect(null);
		setIsInspectionDialogOpen(false);
		fetchFarms();
		onDataChange?.();
	};

	const handleFarmDeleted = async () => {
		await fetchFarms();
		setIsDeleteDialogOpen(false);
		setFarmToDelete(null);
		onDataChange?.();
	};

	return (
		<>
			<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
				<CardHeader className='bg-background flex items-center justify-end space-y-0 px-0'>
					{/* Add Farm Button */}
					<Button
						onClick={handleAddFarm}
						className='t-style-link rounded-2 bg-primary hover:bg-primary/70 focus:ring-primary focus:ring-offset-accent flex items-center gap-2 px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
					>
						<Plus className='size-4' aria-hidden='true' />
						Add Farm
					</Button>
				</CardHeader>
				<CardContent className='p-0'>
					{/* Controls Section */}
					<div className='mb-6 flex flex-col gap-4' role='region' aria-label='Farms table controls'>
						{/* Search and Sort Row */}
						<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
							{/* Search Input */}
							<div className='relative max-w-lg flex-1'>
								<label htmlFor='farm-search' className='sr-only'>
									Search farms by name or location
								</label>
								<Search
									className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
									aria-hidden='true'
								/>
								<Input
									id='farm-search'
									placeholder='Search farms by name or location...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='t-style-caption border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary bg-accent flex h-10 items-center self-stretch rounded-lg border-0 pl-10 pr-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11 dark:border'
									aria-describedby='search-description'
								/>
								<div id='search-description' className='sr-only'>
									Search will filter farms in real-time as you type
								</div>
							</div>

							{/* Sort Dropdown */}
							<div className='flex gap-2'>
								<label htmlFor='sort-select' className='sr-only'>
									Sort farms by
								</label>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger
										id='sort-select'
										className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 !w-[200px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
										aria-label='Sort farms by'
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
							{isLoading
								? 'Loading farms...'
								: totalFarms === 0
									? debouncedSearchTerm
										? 'No farms found matching your search criteria.'
										: 'No farms available.'
									: `Showing ${paginatedFarms.length} of ${totalFarms} farms`}
						</div>
					</div>

					{/* Table Section */}
					<div className='overflow-x-auto' role='region' aria-label='Farms data table'>
						<Table>
							<caption className='sr-only'>
								Table of farms with their details.
								{totalFarms > 0
									? `Currently showing ${paginatedFarms.length} of ${totalFarms} farms.`
									: 'No farms available.'}
							</caption>
							<TableHeader className='bg-accent'>
								<TableRow className='border-none'>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tl-lg !font-semibold'>
										Farm Name
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Location
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Total Area
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Fields
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tr-lg text-right !font-semibold'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className='t-style-link text-text-muted h-24 text-center !font-normal'
										>
											<div role='status' aria-label='Loading farms data'>
												Loading farms...
											</div>
										</TableCell>
									</TableRow>
								) : paginatedFarms.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className='t-style-link text-text-muted h-24 text-center !font-normal'
										>
											{debouncedSearchTerm
												? 'No farms found matching your search criteria.'
												: 'No farms found. Create your first farm to get started.'}
										</TableCell>
									</TableRow>
								) : (
									paginatedFarms.map((farm) => (
										<TableRow key={farm.id} className='border-border/40 dark:border-border'>
											<TableCell>
												<div className='flex items-center gap-3'>
													<div className='bg-accent rounded-lg p-2'>
														<PiFarmLight
															className='text-primary size-4'
															aria-hidden='true'
														/>
													</div>
													<p className='t-style-link text-text-muted !font-normal'>
														{farm.farmName}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<p className='t-style-link text-text-muted !font-normal'>
													{farm.location}
												</p>
											</TableCell>
											<TableCell>
												<p className='t-style-link text-text-muted !font-normal'>
													{farm.areaHa} hectares
												</p>
											</TableCell>
											<TableCell>
												<p className='t-style-link text-text-muted !font-normal'>
													{farm._count?.fields || 0}
												</p>
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-2'>
													{(!farm._count?.inspections || farm._count.inspections === 0) && (
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() => handleInspectFarm(farm)}
																	className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-blue-600 focus:ring-[0.5px] focus:ring-blue-500 focus:ring-offset-2'
																	aria-label={`Inspect ${farm.farmName}`}
																>
																	<ClipboardCheck
																		className='size-4'
																		aria-hidden='true'
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>Inspect</p>
															</TooltipContent>
														</Tooltip>
													)}
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant='ghost'
																size='sm'
																onClick={() => handleEditFarm(farm)}
																className='text-primary focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
																aria-label={`Edit ${farm.farmName}`}
															>
																<Edit className='size-4' aria-hidden='true' />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Edit</p>
														</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant='ghost'
																size='sm'
																onClick={() => handleDeleteClick(farm)}
																className='text-error focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
																aria-label={`Delete ${farm.farmName}`}
															>
																<Trash2 className='size-4' aria-hidden='true' />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Delete</p>
														</TooltipContent>
													</Tooltip>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination Section */}
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
							<nav aria-label='Farms table pagination' className='flex-1'>
								<Pagination>
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
												className={
													currentPage === 1 || isLoading
														? 'pointer-events-none opacity-50'
														: 'focus:ring-primary focus:ring-offset-background cursor-pointer focus:ring-[0.5px] focus:ring-offset-2'
												}
												aria-label={`Go to previous page, currently on page ${currentPage}`}
												tabIndex={currentPage === 1 || isLoading ? -1 : 0}
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
													currentPage === totalPages || isLoading
														? 'pointer-events-none opacity-50'
														: 'focus:ring-primary focus:ring-offset-background cursor-pointer focus:ring-[0.5px] focus:ring-offset-2'
												}
												aria-label={`Go to next page, currently on page ${currentPage} of ${totalPages}`}
												tabIndex={currentPage === totalPages || isLoading ? -1 : 0}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</nav>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Add/Edit Farm Dialog */}
			<FarmDialog
				farm={farmToEdit as any}
				farmerId={farmerId}
				isOpen={isDialogOpen}
				onFarmAdded={handleFarmAdded}
				onClose={handleCloseDialog}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteFarmConfirmDialog
				farm={farmToDelete as any}
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onFarmDeleted={handleFarmDeleted}
			/>

			{/* Inspection Dialog */}
			<InspectionDialog
				farm={farmToInspect}
				isOpen={isInspectionDialogOpen}
				onClose={handleCloseInspectionDialog}
				onInspectionCreated={handleInspectionCreated}
			/>
		</>
	);
}
