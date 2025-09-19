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
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui';
import { Search, Trash2, Edit, Eye, MapPin, Calendar, Sprout } from 'lucide-react';
import type { FarmWithFieldsAndFarmer } from '@/types/farm';

interface FarmsTableProps {
	farms: FarmWithFieldsAndFarmer[];
	loading: boolean;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	sortBy: string;
	setSortBy: (sort: string) => void;
	currentPage: number;
	setCurrentPage: (page: number) => void;
	totalPages: number;
	totalFarms: number;
	itemsPerPage: number;
	setItemsPerPage: (items: number) => void;
	onDeleteFarm: (farm: FarmWithFieldsAndFarmer) => void;
	onEditFarm?: (farm: FarmWithFieldsAndFarmer) => void;
	onViewFarm?: (farm: FarmWithFieldsAndFarmer) => void;
}

export default function FarmsTable({
	farms,
	loading,
	searchTerm,
	setSearchTerm,
	sortBy,
	setSortBy,
	currentPage,
	setCurrentPage,
	totalPages,
	totalFarms,
	itemsPerPage,
	setItemsPerPage,
	onDeleteFarm,
	onEditFarm,
	onViewFarm,
}: FarmsTableProps) {
	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Format area
	const formatArea = (area: number) => {
		return `${area.toFixed(2)} Ha`;
	};

	const sortOptions = [
		{ value: 'createdAt-desc', label: 'Newest First' },
		{ value: 'createdAt-asc', label: 'Oldest First' },
		{ value: 'farmName-asc', label: 'Farm Name (A-Z)' },
		{ value: 'farmName-desc', label: 'Farm Name (Z-A)' },
		{ value: 'location-asc', label: 'Location (A-Z)' },
		{ value: 'location-desc', label: 'Location (Z-A)' },
		{ value: 'areaHa-asc', label: 'Smallest Area First' },
		{ value: 'areaHa-desc', label: 'Largest Area First' },
	];

	const itemsPerPageOptions = [10, 25, 50, 100];

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
							<label htmlFor='farm-search' className='sr-only'>
								Search farms by name, location, or farmer&apos;s name
							</label>
							<Search
								className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
								aria-hidden='true'
							/>
							<Input
								id='farm-search'
								placeholder="Search farms by name, location, or farmer's name..."
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
									className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-[180px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
									aria-label='Sort farms by'
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
							? 'Loading farms...'
							: totalFarms === 0
								? 'No farms available.'
								: `Showing ${farms.length} of ${totalFarms} farms`}
					</div>
				</div>

				{/* Table Section */}
				<div className='overflow-x-auto' role='region' aria-label='Farms data table'>
					<Table>
						<caption className='sr-only'>
							Table of farms with their details, farmer information, location, and area.
							{totalFarms > 0
								? `Currently showing ${farms.length} of ${totalFarms} farms.`
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
									Farmer&apos;s Name
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Area
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									No of Fields
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Date Created
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
										<div role='status' aria-label='Loading farms data'>
											Loading farms...
										</div>
									</TableCell>
								</TableRow>
							) : farms.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className='t-style-link text-text-muted h-24 text-center !font-normal'
									>
										{searchTerm
											? 'No farms found matching your search criteria.'
											: 'No farms found. Create your first farm to get started.'}
									</TableCell>
								</TableRow>
							) : (
								farms.map((farm) => (
									<TableRow key={farm.id} className='border-border/40 dark:border-border'>
										<TableCell>
											<p className='t-style-link text-text-muted !font-normal'>{farm.farmName}</p>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-1 !font-normal'>
												<MapPin className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Location: </span>
													{farm.location}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<p className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<span>
													<span className='sr-only'>Farmer: </span>
													{farm.farmer.name}
												</span>
											</p>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<span>
													<span className='sr-only'>Area: </span>
													{formatArea(farm.areaHa)}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<Sprout className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Fields: </span>
													{farm.fields?.length || 0} fields
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<Calendar className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Created on: </span>
													{farm.createdAt ? formatDate(farm.createdAt) : 'N/A'}
												</span>
											</div>
										</TableCell>
										<TableCell className='text-right'>
											<div className='flex items-center justify-end gap-2'>
												{onViewFarm && (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => onViewFarm(farm)}
														className='text-text-muted focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
														aria-label={`View ${farm.farmName} details`}
													>
														<Eye className='size-4' aria-hidden='true' />
													</Button>
												)}
												{onEditFarm && (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => onEditFarm(farm)}
														className='text-primary focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
														aria-label={`Edit ${farm.farmName}`}
													>
														<Edit className='size-4' aria-hidden='true' />
													</Button>
												)}
												<Button
													variant='ghost'
													size='sm'
													onClick={() => onDeleteFarm(farm)}
													className='text-error focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
													aria-label={`Delete ${farm.farmName}`}
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
						<nav aria-label='Farms table pagination' className='flex-1'>
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
