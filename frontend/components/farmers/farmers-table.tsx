'use client';

import React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Input,
	Button,
	Card,
	CardContent,
	Avatar,
	AvatarFallback,
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui';
import { Search, Trash2, Edit, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import type { Farmer } from '@/types/farmer';

interface FarmersTableProps {
	farmers: Farmer[];
	loading: boolean;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	sortBy: string;
	setSortBy: (sort: string) => void;
	currentPage: number;
	setCurrentPage: (page: number) => void;
	totalPages: number;
	totalFarmers: number;
	itemsPerPage: number;
	setItemsPerPage: (items: number) => void;
	onDeleteFarmer: (farmer: Farmer) => void;
	onEditFarmer?: (farmer: Farmer) => void;
}

export default function FarmersTable({
	farmers,
	loading,
	searchTerm,
	setSearchTerm,
	sortBy,
	setSortBy,
	currentPage,
	setCurrentPage,
	totalPages,
	totalFarmers,
	itemsPerPage,
	setItemsPerPage,
	onDeleteFarmer,
	onEditFarmer,
}: FarmersTableProps) {
	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Format phone number
	const formatPhone = (phone: string) => {
		if (phone.startsWith('+254')) {
			return phone.replace('+254', '+254 ').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
		}

		return phone;
	};
	const sortOptions = [
		{ value: 'createdAt-desc', label: 'Newest First' },
		{ value: 'createdAt-asc', label: 'Oldest First' },
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'county-asc', label: 'County (A-Z)' },
		{ value: 'county-desc', label: 'County (Z-A)' },
	];

	const itemsPerPageOptions = [10, 25, 50, 100];

	const getFarmerInitials = (farmerName: string): string => {
		if (farmerName) {
			const farmerParts = farmerName.trim().split(' ');

			if (farmerParts.length >= 2) {
				return (farmerParts[0].charAt(0) + farmerParts[farmerParts.length - 1].charAt(0)).toUpperCase();
			}
			if (farmerParts[0].length >= 2) {
				return farmerParts[0].substring(0, 2).toUpperCase();
			}

			return farmerParts[0].charAt(0).toUpperCase();
		}

		return 'BS';
	};

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

	return (
		<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
			<CardContent className='p-0'>
				{/* Controls Section */}
				<div className='mb-6 flex flex-col gap-4' role='region' aria-label='Table controls'>
					{/* Search and Sort Row */}
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						{/* Search Input */}
						<div className='relative max-w-sm flex-1'>
							<label htmlFor='farmer-search' className='sr-only'>
								Search farmers by name, email, phone, or county
							</label>
							<Search
								className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
								aria-hidden='true'
							/>
							<Input
								id='farmer-search'
								placeholder='Search farmers by name, email, phone, or county...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='t-style-caption border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary bg-accent flex h-10 items-center self-stretch rounded-lg border-0 pl-10 pr-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11 dark:border'
								aria-describedby='search-description'
							/>
							<div id='search-description' className='sr-only'>
								Search will filter farmers in real-time as you type
							</div>
						</div>

						{/* Sort Dropdown */}
						<div className='flex gap-2'>
							<label htmlFor='sort-select' className='sr-only'>
								Sort farmers by
							</label>
							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger
									id='sort-select'
									className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-[180px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
									aria-label='Sort farmers by'
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
							? 'Loading farmers...'
							: totalFarmers === 0
								? 'No farmers available.'
								: `Showing ${farmers.length} of ${totalFarmers} farmers`}
					</div>
				</div>

				{/* Table Section */}
				<div className='overflow-x-auto' role='region' aria-label='Farmers data table'>
					<Table>
						<caption className='sr-only'>
							Table of farmers with their contact information, county, and registration date.
							{totalFarmers > 0
								? `Currently showing ${farmers.length} of ${totalFarmers} farmers.`
								: 'No farmers available.'}
						</caption>
						<TableHeader className='bg-accent'>
							<TableRow className='border-none'>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tl-lg !font-semibold'>
									Name
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Contact
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									County
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Date Registered
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
										<div role='status' aria-label='Loading farmers data'>
											Loading farmers...
										</div>
									</TableCell>
								</TableRow>
							) : farmers.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className='t-style-link text-text-muted h-24 text-center !font-normal'
									>
										{searchTerm
											? 'No farmers found matching your search criteria.'
											: 'No farmers found. Create your first farmer to get started.'}
									</TableCell>
								</TableRow>
							) : (
								farmers.map((farmer) => (
									<TableRow key={farmer.id} className='border-border'>
										<TableCell>
											<div className='flex items-center gap-3'>
												<Avatar className='size-10'>
													<AvatarFallback
														role='img'
														aria-label={`Avatar for ${farmer.name}`}
														className='t-style-caption text-text-muted bg-accent !font-semibold'
													>
														{getFarmerInitials(farmer.name)}
													</AvatarFallback>
												</Avatar>
												<p className='t-style-caption text-text-muted !font-normal'>
													{farmer.name}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<div className='space-y-1'>
												<div className='t-style-caption text-text-muted flex items-center gap-2 !font-normal'>
													<Phone className='text-text-muted size-3' aria-hidden='true' />
													<span>
														<span className='sr-only'>Phone: </span>
														{formatPhone(farmer.phone)}
													</span>
												</div>
												<div className='t-style-caption text-text-muted flex items-center gap-2 !font-normal'>
													<Mail className='size-3' aria-hidden='true' />
													<span className='max-w-[200px] truncate'>
														<span className='sr-only'>Email: </span>
														{farmer.email}
													</span>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-caption text-text-muted flex items-center gap-1 !font-normal'>
												<MapPin className='size-3' aria-hidden='true' />
												<span className='sr-only'>County: </span>
												{farmer.county}
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-caption text-text-muted flex items-center gap-2 !font-normal'>
												<Calendar className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Registered on: </span>
													{farmer.createdAt ? formatDate(farmer.createdAt) : 'N/A'}
												</span>
											</div>
										</TableCell>
										<TableCell className='text-right'>
											<div className='flex items-center justify-end gap-2'>
												{onEditFarmer && (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => onEditFarmer(farmer)}
														className='text-primary focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
														aria-label={`Edit ${farmer.name}`}
													>
														<Edit className='size-4' aria-hidden='true' />
													</Button>
												)}
												<Button
													variant='ghost'
													size='sm'
													onClick={() => onDeleteFarmer(farmer)}
													className='text-error focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
													aria-label={`Delete ${farmer.name}`}
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
						<nav aria-label='Farmers table pagination' className='flex-1'>
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
	);
}
