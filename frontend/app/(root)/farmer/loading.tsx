import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Card, CardContent } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function FarmersLoading() {
	return (
		<main
			className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'
			aria-label='Loading farmers page'
		>
			{/* Header Skeleton */}
			<header className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<div className='flex flex-col gap-2'>
					<Skeleton className='h-8 w-32' />
					<Skeleton className='h-4 w-64' />
				</div>
				<Skeleton className='h-10 w-40 rounded-2xl' />
			</header>

			{/* Table Section Skeleton */}
			<section className='w-full' aria-label='Loading farmers table'>
				<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
					<CardContent className='p-0'>
						{/* Controls Section Skeleton */}
						<div className='mb-6 flex flex-col gap-4'>
							{/* Search and Sort Row Skeleton */}
							<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
								{/* Search Input Skeleton */}
								<div className='max-w-sm flex-1'>
									<Skeleton className='h-10 w-full rounded-lg md:h-11' />
								</div>

								{/* Sort Dropdown Skeleton */}
								<Skeleton className='h-10 w-[180px] rounded-lg md:h-11' />
							</div>

							{/* Results Info Skeleton */}
							<Skeleton className='h-4 w-48' />
						</div>

						{/* Table Section Skeleton */}
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader className='bg-accent'>
									<TableRow className='border-none'>
										<TableHead className='h-11 rounded-tl-lg'>
											<Skeleton className='h-4 w-16' />
										</TableHead>
										<TableHead className='h-11'>
											<Skeleton className='h-4 w-16' />
										</TableHead>
										<TableHead className='h-11'>
											<Skeleton className='h-4 w-16' />
										</TableHead>
										<TableHead className='h-11'>
											<Skeleton className='h-4 w-24' />
										</TableHead>
										<TableHead className='h-11 rounded-tr-lg text-right'>
											<Skeleton className='ml-auto h-4 w-16' />
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{/* Generate 10 skeleton rows */}
									{Array.from({ length: 10 }, (_, index) => (
										<TableRow
											key={`loading-farmer-${index + 1}`}
											className='border-border/40 dark:border-border'
										>
											{/* Name Column */}
											<TableCell>
												<div className='flex items-center gap-3'>
													<Skeleton className='h-10 w-10 rounded-full' />
													<div className='flex flex-col gap-1'>
														<Skeleton className='h-4 w-24' />
													</div>
												</div>
											</TableCell>

											{/* Contact Column */}
											<TableCell>
												<div className='flex flex-col gap-2'>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-20' />
													</div>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-32' />
													</div>
												</div>
											</TableCell>

											{/* County Column */}
											<TableCell>
												<div className='flex items-center gap-2'>
													<Skeleton className='h-3 w-3 rounded-full' />
													<Skeleton className='h-4 w-20' />
												</div>
											</TableCell>

											{/* Date Registered Column */}
											<TableCell>
												<div className='flex items-center gap-2'>
													<Skeleton className='h-3 w-3 rounded-full' />
													<Skeleton className='h-4 w-16' />
												</div>
											</TableCell>

											{/* Actions Column */}
											<TableCell className='text-right'>
												<div className='flex justify-end gap-2'>
													<Skeleton className='h-8 w-8 rounded' />
													<Skeleton className='h-8 w-8 rounded' />
													<Skeleton className='h-8 w-8 rounded' />
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Pagination Section Skeleton */}
						<div className='mt-6 flex w-full flex-col items-center justify-between gap-4 lg:flex-row'>
							{/* Items per page skeleton */}
							<div className='flex flex-1 items-center gap-2'>
								<Skeleton className='h-4 w-10' />
								<Skeleton className='h-8 w-16 rounded-lg' />
								<Skeleton className='h-4 w-16' />
							</div>

							{/* Pagination Controls Skeleton */}
							<div className='flex flex-1 items-center justify-end gap-2'>
								<Skeleton className='h-9 w-20 rounded' />
								{Array.from({ length: 5 }, (_, index) => (
									<Skeleton key={`pagination-${index + 1}`} className='h-9 w-9 rounded' />
								))}
								<Skeleton className='h-9 w-16 rounded' />
							</div>
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
