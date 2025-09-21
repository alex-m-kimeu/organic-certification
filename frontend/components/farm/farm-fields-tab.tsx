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
} from '@/components/ui';
import { Sprout, Search, Edit, Trash2, Plus } from 'lucide-react';
import type { Field } from '@/types/field';
import FieldDialog from '../field/field-dialog';
import DeleteFieldConfirmDialog from '../field/delete-field-confirm-dialog';

interface FarmFieldsTabProps {
	farmId: string;
	onDataChange?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function FarmFieldsTab({ farmId, onDataChange }: FarmFieldsTabProps) {
	const [fields, setFields] = useState<Field[]>([]);
	const [filteredFields, setFilteredFields] = useState<Field[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [fieldToEdit, setFieldToEdit] = useState<Field | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);

	// Search, sort, and pagination state
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState('createdAt-desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Pagination calculations
	const totalFields = filteredFields.length;
	const totalPages = Math.ceil(totalFields / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedFields = filteredFields.slice(startIndex, endIndex);

	// Debounce search term
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
			setCurrentPage(1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	// Filter and sort fields
	useEffect(() => {
		let filtered = [...fields];

		// Filter by search term
		if (debouncedSearchTerm) {
			filtered = filtered.filter(
				(field) =>
					field.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
					field.crop.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
			);
		}

		// Sort fields
		const [sortField, sortDirection] = sortBy.split('-');
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'crop':
					comparison = a.crop.localeCompare(b.crop);
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

		setFilteredFields(filtered);
	}, [fields, debouncedSearchTerm, sortBy]);

	// Sort options for fields
	const sortOptions = [
		{ value: 'createdAt-desc', label: 'Newest First' },
		{ value: 'createdAt-asc', label: 'Oldest First' },
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'crop-asc', label: 'Crop (A-Z)' },
		{ value: 'crop-desc', label: 'Crop (Z-A)' },
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

	const fetchFields = useCallback(async () => {
		try {
			setIsLoading(true);

			const response = await fetch(`${BASE_URL}/fields/farm/${farmId}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Error: ${response.status}`);
			}

			const result = await response.json();
			if (result.success && result.data) {
				setFields(result.data);
			} else {
				throw new Error(result.message || 'Failed to fetch fields');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch fields. Please try again.';
			toast.error(errorMessage);
			setFields([]);
		} finally {
			setIsLoading(false);
		}
	}, [farmId]);

	useEffect(() => {
		fetchFields();
	}, [fetchFields]);

	const handleAddField = () => {
		setFieldToEdit(null);
		setIsDialogOpen(true);
	};

	const handleEditField = (field: Field) => {
		setFieldToEdit(field);
		setIsDialogOpen(true);
	};

	const handleDeleteClick = (field: Field) => {
		setFieldToDelete(field);
		setIsDeleteDialogOpen(true);
	};

	const handleFieldAdded = () => {
		setFieldToEdit(null);
		setIsDialogOpen(false);
		fetchFields();
		onDataChange?.();
	};

	const handleCloseDialog = () => {
		setFieldToEdit(null);
		setIsDialogOpen(false);
	};

	const handleCloseDeleteDialog = () => {
		setIsDeleteDialogOpen(false);
		setFieldToDelete(null);
	};

	const handleFieldDeleted = async () => {
		await fetchFields();
		setIsDeleteDialogOpen(false);
		setFieldToDelete(null);
		onDataChange?.();
	};

	return (
		<>
			<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
				<CardHeader className='bg-background flex items-center justify-end space-y-0 px-0'>
					{/* Add Field Button */}
					<Button
						onClick={handleAddField}
						className='t-style-link rounded-2 bg-primary hover:bg-primary/70 focus:ring-primary focus:ring-offset-accent flex items-center gap-2 px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
					>
						<Plus className='size-4' aria-hidden='true' />
						Add Field
					</Button>
				</CardHeader>
				<CardContent className='p-0'>
					{/* Controls Section */}
					<div className='mb-6 flex flex-col gap-4' role='region' aria-label='Fields table controls'>
						{/* Search and Sort Row */}
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							{/* Search Input */}
							<div className='relative max-w-sm flex-1'>
								<label htmlFor='field-search' className='sr-only'>
									Search fields by name or crop
								</label>
								<Search
									className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
									aria-hidden='true'
								/>
								<Input
									id='field-search'
									placeholder='Search fields by name or crop...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='t-style-caption border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary bg-accent flex h-10 items-center self-stretch rounded-lg border-0 pl-10 pr-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11 dark:border'
									aria-describedby='search-description'
								/>
								<div id='search-description' className='sr-only'>
									Search will filter fields in real-time as you type
								</div>
							</div>

							{/* Sort Dropdown */}
							<div className='flex gap-2'>
								<label htmlFor='sort-select' className='sr-only'>
									Sort fields by
								</label>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger
										id='sort-select'
										className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-[180px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
										aria-label='Sort fields by'
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
								? 'Loading fields...'
								: totalFields === 0
									? debouncedSearchTerm
										? 'No fields found matching your search criteria.'
										: 'No fields available.'
									: `Showing ${paginatedFields.length} of ${totalFields} fields`}
						</div>
					</div>

					{/* Table Section */}
					<div className='overflow-x-auto' role='region' aria-label='Fields data table'>
						<Table>
							<caption className='sr-only'>
								Table of fields with their details.
								{totalFields > 0
									? `Currently showing ${paginatedFields.length} of ${totalFields} fields.`
									: 'No fields available.'}
							</caption>
							<TableHeader className='bg-accent'>
								<TableRow className='border-none'>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tl-lg !font-semibold'>
										Field Name
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Crop
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Area (ha)
									</TableHead>
									<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
										Created
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
											<div role='status' aria-label='Loading fields data'>
												Loading fields...
											</div>
										</TableCell>
									</TableRow>
								) : paginatedFields.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className='t-style-link text-text-muted h-24 text-center !font-normal'
										>
											{debouncedSearchTerm
												? 'No fields found matching your search criteria.'
												: 'No fields found. No fields have been added to this farm yet.'}
										</TableCell>
									</TableRow>
								) : (
									paginatedFields.map((field) => (
										<TableRow key={field.id} className='border-border/40 dark:border-border'>
											<TableCell>
												<div className='flex items-center gap-3'>
													<div className='bg-accent rounded-lg p-2'>
														<Sprout className='text-primary size-4' aria-hidden='true' />
													</div>
													<p className='t-style-link text-text-muted !font-normal'>
														{field.name}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
													<span>
														<span className='sr-only'>Crop: </span>
														{field.crop}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
													<span>
														<span className='sr-only'>Area: </span>
														{field.areaHa.toFixed(3)}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
													<span>
														<span className='sr-only'>Created on: </span>
														{field.createdAt
															? new Date(field.createdAt).toLocaleDateString('en-US', {
																	year: 'numeric',
																	month: 'short',
																	day: 'numeric',
																})
															: 'N/A'}
													</span>
												</div>
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-2'>
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleEditField(field)}
														className='text-primary focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
														aria-label={`Edit field ${field.name}`}
													>
														<Edit className='size-4' aria-hidden='true' />
													</Button>
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleDeleteClick(field)}
														className='text-error focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
														aria-label={`Delete field ${field.name}`}
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
							<nav aria-label='Fields table pagination' className='flex-1'>
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

			{/* Add/Edit Field Dialog */}
			<FieldDialog
				farmId={farmId}
				field={fieldToEdit}
				isOpen={isDialogOpen}
				onFieldAdded={handleFieldAdded}
				onClose={handleCloseDialog}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteFieldConfirmDialog
				field={fieldToDelete}
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onFieldDeleted={handleFieldDeleted}
			/>
		</>
	);
}
