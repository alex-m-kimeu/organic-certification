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
	Badge,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui';
import { Calendar, Edit, MapPin, Search, Trash2, User, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import type { InspectionWithFarm } from '@/types/inspection';

interface InspectionsTableProps {
	inspections: InspectionWithFarm[];
	loading: boolean;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	sortBy: string;
	setSortBy: (sort: string) => void;
	currentPage: number;
	setCurrentPage: (page: number) => void;
	totalPages: number;
	totalInspections: number;
	itemsPerPage: number;
	setItemsPerPage: (items: number) => void;
	onDeleteInspection: (inspection: InspectionWithFarm) => void;
	onEditInspection?: (inspection: InspectionWithFarm) => void;
	onApproveInspection?: (inspectionId: string) => void;
	onRejectInspection?: (inspectionId: string) => void;
}

const sortOptions = [
	{ value: 'date-desc', label: 'Date (Newest First)' },
	{ value: 'date-asc', label: 'Date (Oldest First)' },
	{ value: 'farm-asc', label: 'Farm Name (A-Z)' },
	{ value: 'farm-desc', label: 'Farm Name (Z-A)' },
	{ value: 'inspector-asc', label: 'Inspector (A-Z)' },
	{ value: 'inspector-desc', label: 'Inspector (Z-A)' },
	{ value: 'status-asc', label: 'Status (A-Z)' },
	{ value: 'status-desc', label: 'Status (Z-A)' },
];

const itemsPerPageOptions = [10, 25, 50, 100];

const formatDate = (dateString: string): string => {
	const date = new Date(dateString);

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
};

const getStatusBadge = (status: string) => {
	switch (status) {
		case 'APPROVED':
			return (
				<Badge className='t-syle-link border-green-200 bg-green-100 !font-normal text-green-800'>
					Approved
				</Badge>
			);
		case 'REJECTED':
			return <Badge className='t-syle-link border-red-200 bg-red-100 !font-normal text-red-800'>Rejected</Badge>;
		case 'SUBMITTED':
			return (
				<Badge className='t-syle-link border-blue-200 bg-blue-100 !font-normal text-blue-800'>Submitted</Badge>
			);
		case 'DRAFT':
			return <Badge className='t-syle-link border-gray-200 bg-gray-100 !font-normal text-gray-800'>Draft</Badge>;
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

export default function InspectionsTable({
	inspections,
	loading,
	totalInspections,
	currentPage,
	itemsPerPage,
	onEditInspection,
	onDeleteInspection,
	onApproveInspection,
	onRejectInspection,
	searchTerm,
	setSearchTerm,
	sortBy,
	setSortBy,
	setCurrentPage,
	setItemsPerPage,
}: InspectionsTableProps) {
	const totalPages = Math.ceil(totalInspections / itemsPerPage);

	// Generate pagination items
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
					<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
						{/* Search Input */}
						<div className='relative max-w-lg flex-1'>
							<label htmlFor='inspection-search' className='sr-only'>
								Search inspections by farm name, inspector, or status
							</label>
							<Search
								className='text-primary absolute left-3 top-1/2 size-4 -translate-y-1/2 transform'
								aria-hidden='true'
							/>
							<Input
								id='inspection-search'
								placeholder='Search inspections by farm name, inspector, or status...'
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
									className='t-style-link border-border text-text-muted bg-accent focus-visible:border-primary focus-visible:ring-primary flex !h-10 !w-[200px] items-center self-stretch rounded-lg border-0 px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11 dark:border'
									aria-label='Sort inspections by'
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
							? 'Loading inspections...'
							: totalInspections === 0
								? 'No inspections available.'
								: `Showing ${inspections.length} of ${totalInspections} inspections`}
					</div>
				</div>

				{/* Table Section */}
				<div className='overflow-x-auto' role='region' aria-label='Inspections data table'>
					<Table>
						<caption className='sr-only'>
							Table of inspections with their details, farm information, inspector, and status.
							{totalInspections > 0
								? `Currently showing ${inspections.length} of ${totalInspections} inspections.`
								: 'No inspections available.'}
						</caption>
						<TableHeader className='bg-accent'>
							<TableRow className='border-none'>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 rounded-tl-lg !font-semibold'>
									Date
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Farm Name
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Location
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Inspector
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Status
								</TableHead>
								<TableHead className='t-style-link text-text-muted dark:text-primary h-11 !font-semibold'>
									Score
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
										colSpan={7}
										className='t-style-link text-text-muted h-24 text-center !font-normal'
									>
										<div role='status' aria-label='Loading inspections data'>
											Loading inspections...
										</div>
									</TableCell>
								</TableRow>
							) : inspections.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className='t-style-link text-text-muted h-24 text-center !font-normal'
									>
										{searchTerm
											? 'No inspections found matching your search criteria.'
											: 'No inspections found. Create your first inspection to get started.'}
									</TableCell>
								</TableRow>
							) : (
								inspections.map((inspection) => (
									<TableRow key={inspection.id} className='border-border/40 dark:border-border'>
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
											<p className='t-style-link text-text-muted !font-normal'>
												{inspection.farm.farmName}
											</p>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-1 !font-normal'>
												<MapPin className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Location: </span>
													{inspection.farm.location}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className='t-style-link text-text-muted flex items-center gap-2 !font-normal'>
												<User className='size-3' aria-hidden='true' />
												<span>
													<span className='sr-only'>Inspector: </span>
													{inspection.inspectorName}
												</span>
											</div>
										</TableCell>
										<TableCell>{getStatusBadge(inspection.status)}</TableCell>
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
										<TableCell className='text-right'>
											<div className='flex items-center justify-end gap-2'>
												{/* Approve/Reject Button - only for inspections with score >= 80 and < 90 */}
												{inspection.complianceScore !== null &&
													inspection.complianceScore !== undefined &&
													inspection.complianceScore >= 80 &&
													inspection.complianceScore < 90 &&
													inspection.status === 'SUBMITTED' &&
													onApproveInspection &&
													onRejectInspection && (
														<>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant='ghost'
																		size='sm'
																		onClick={() =>
																			onApproveInspection(inspection.id)
																		}
																		className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-green-600 hover:bg-green-50 hover:text-green-800 focus:ring-[0.5px] focus:ring-green-500 focus:ring-offset-2'
																		aria-label={`Approve inspection for ${inspection.farm.farmName}`}
																	>
																		<CheckCircle
																			className='size-4'
																			aria-hidden='true'
																		/>
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Approve Inspection</p>
																</TooltipContent>
															</Tooltip>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant='ghost'
																		size='sm'
																		onClick={() =>
																			onRejectInspection(inspection.id)
																		}
																		className='focus:ring-offset-background h-8 w-8 cursor-pointer p-0 text-red-600 hover:bg-red-50 hover:text-red-800 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
																		aria-label={`Reject inspection for ${inspection.farm.farmName}`}
																	>
																		<XCircle
																			className='size-4'
																			aria-hidden='true'
																		/>
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p>Reject Inspection</p>
																</TooltipContent>
															</Tooltip>
														</>
													)}
												{onEditInspection && (
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant='ghost'
																size='sm'
																onClick={() => onEditInspection(inspection)}
																className='text-primary focus:ring-primary focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-offset-2'
																aria-label={`Edit inspection for ${inspection.farm.farmName}`}
															>
																<Edit className='size-4' aria-hidden='true' />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Edit</p>
														</TooltipContent>
													</Tooltip>
												)}
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant='ghost'
															size='sm'
															onClick={() => onDeleteInspection(inspection)}
															className='text-error focus:ring-offset-background h-8 w-8 cursor-pointer p-0 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2'
															aria-label={`Delete inspection for ${inspection.farm.farmName}`}
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
	);
}
