import React from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';

export default function FarmerDetailsLoading() {
	return (
		<div className='bg-background container mx-auto flex flex-col items-start gap-8 px-4 py-[72px] md:px-6 md:py-10 lg:gap-10 lg:px-8'>
			{/* Header with back button skeleton */}
			<div className='flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-10 w-40 rounded-2xl' />
			</div>

			{/* Farmer Information Card Skeleton */}
			<Card className='bg-background w-full border-none p-0 shadow-none'>
				<CardHeader className='grid grid-cols-2 items-center gap-6 p-0'>
					<CardTitle className='flex items-center gap-2'>
						<Skeleton className='size-15 rounded-full' />
						<Skeleton className='h-6 w-48' />
					</CardTitle>
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
						{/* Contact info skeletons */}
						<div className='flex items-center gap-2'>
							<Skeleton className='size-3 rounded-full' />
							<Skeleton className='h-4 w-20' />
						</div>
						<div className='flex items-center gap-2'>
							<Skeleton className='size-3 rounded-full' />
							<Skeleton className='h-4 w-24' />
						</div>
						<div className='flex items-center gap-2'>
							<Skeleton className='size-3 rounded-full' />
							<Skeleton className='h-4 w-32' />
						</div>
						<div className='flex items-center gap-2'>
							<Skeleton className='size-3 rounded-full' />
							<Skeleton className='h-4 w-20' />
						</div>
					</div>
				</CardHeader>

				<CardContent className='px-0'>
					{/* Statistics Skeleton */}
					<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'>
						{Array.from({ length: 6 }, (_, index) => (
							<div key={`stat-${index + 1}`} className='bg-accent rounded-lg p-4 text-center'>
								<Skeleton className='mx-auto mb-2 h-8 w-12' />
								<Skeleton className='mx-auto h-4 w-16' />
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Tabs Skeleton */}
			<Tabs defaultValue='farms' className='w-full'>
				<TabsList className='bg-accent w-full py-2'>
					<TabsTrigger
						value='farms'
						className='t-style-link text-text-muted data-[state=active]:!border-accent dark:data-[state=active]:!border-accent focus:!ring-accent'
					>
						<Skeleton className='h-4 w-12' />
					</TabsTrigger>
					<TabsTrigger
						value='inspections'
						className='t-style-link text-text-muted data-[state=active]:!border-accent dark:data-[state=active]:!border-accent focus:!ring-accent'
					>
						<Skeleton className='h-4 w-20' />
					</TabsTrigger>
					<TabsTrigger
						value='certificates'
						className='t-style-link text-text-muted data-[state=active]:!border-accent dark:data-[state=active]:!border-accent focus:!ring-accent'
					>
						<Skeleton className='h-4 w-20' />
					</TabsTrigger>
				</TabsList>

				<TabsContent value='farms' className='mt-4'>
					<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
						<CardHeader className='bg-background flex items-center justify-end space-y-0 px-0'>
							{/* Add Farm Button */}
							<Skeleton className='h-10 w-32 rounded-2xl' />
						</CardHeader>
						<CardContent className='p-0'>
							{/* Controls Section Skeleton */}
							<div className='mb-6 flex flex-col gap-4'>
								{/* Search and Sort Row Skeleton */}
								<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
									{/* Search Input Skeleton */}
									<div className='max-w-sm flex-1'>
										<Skeleton className='h-10 w-full rounded-lg md:h-11' />
									</div>

									{/* Sort Dropdown */}
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
												<Skeleton className='h-4 w-20' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-16' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-20' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-16' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-20' />
											</TableHead>
											<TableHead className='h-11 rounded-tr-lg text-right'>
												<Skeleton className='ml-auto h-4 w-16' />
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{/* Generate 5 skeleton rows for farms/fields */}
										{Array.from({ length: 5 }, (_, index) => (
											<TableRow
												key={`farms-row-${index + 1}`}
												className='border-border/40 dark:border-border'
											>
												{/* Farm/Field Name */}
												<TableCell>
													<Skeleton className='h-4 w-24' />
												</TableCell>

												{/* Location */}
												<TableCell>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-20' />
													</div>
												</TableCell>

												{/* Crop Type */}
												<TableCell>
													<Skeleton className='h-6 w-16 rounded-full' />
												</TableCell>

												{/* Area */}
												<TableCell>
													<Skeleton className='h-4 w-16' />
												</TableCell>

												{/* Date Created */}
												<TableCell>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-16' />
													</div>
												</TableCell>

												{/* Actions */}
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
									{Array.from({ length: 3 }, (_, index) => (
										<Skeleton key={`pagination-${index + 1}`} className='h-9 w-9 rounded' />
									))}
									<Skeleton className='h-9 w-16 rounded' />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='inspections' className='mt-4'>
					<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
						<CardContent className='p-0'>
							{/* Controls Section Skeleton */}
							<div className='mb-6 flex flex-col gap-4'>
								{/* Search and Sort Row Skeleton */}
								<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
									<div className='max-w-sm flex-1'>
										<Skeleton className='h-10 w-full rounded-lg md:h-11' />
									</div>
									<Skeleton className='h-10 w-[180px] rounded-lg md:h-11' />
								</div>
								<Skeleton className='h-4 w-48' />
							</div>

							{/* Inspections Table Skeleton */}
							<div className='overflow-x-auto'>
								<Table>
									<TableHeader className='bg-accent'>
										<TableRow className='border-none'>
											<TableHead className='h-11 rounded-tl-lg'>
												<Skeleton className='h-4 w-16' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-20' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-16' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-12' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-16' />
											</TableHead>
											<TableHead className='h-11 rounded-tr-lg text-right'>
												<Skeleton className='ml-auto h-4 w-16' />
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{/* Generate 5 skeleton rows for inspections */}
										{Array.from({ length: 5 }, (_, index) => (
											<TableRow
												key={`inspections-row-${index + 1}`}
												className='border-border/40 dark:border-border'
											>
												<TableCell>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-16' />
													</div>
												</TableCell>
												<TableCell>
													<Skeleton className='h-4 w-20' />
												</TableCell>
												<TableCell>
													<Skeleton className='h-4 w-16' />
												</TableCell>
												<TableCell>
													<Skeleton className='h-6 w-16 rounded-full' />
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-4 w-8' />
														<Skeleton className='h-4 w-4' />
													</div>
												</TableCell>
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

							{/* Pagination */}
							<div className='mt-6 flex w-full flex-col items-center justify-between gap-4 lg:flex-row'>
								<div className='flex flex-1 items-center gap-2'>
									<Skeleton className='h-4 w-10' />
									<Skeleton className='h-8 w-16 rounded-lg' />
									<Skeleton className='h-4 w-16' />
								</div>
								<div className='flex flex-1 items-center justify-end gap-2'>
									<Skeleton className='h-9 w-20 rounded' />
									{Array.from({ length: 3 }, (_, index) => (
										<Skeleton
											key={`inspections-pagination-${index + 1}`}
											className='h-9 w-9 rounded'
										/>
									))}
									<Skeleton className='h-9 w-16 rounded' />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='certificates' className='mt-4'>
					<Card className='bg-background text-text-muted flex flex-col gap-6 rounded-none border-none py-0 shadow-none'>
						<CardContent className='p-0'>
							{/* Controls Section Skeleton */}
							<div className='mb-6 flex flex-col gap-4'>
								{/* Search and Sort Row Skeleton */}
								<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
									<div className='max-w-sm flex-1'>
										<Skeleton className='h-10 w-full rounded-lg md:h-11' />
									</div>
									<Skeleton className='h-10 w-[180px] rounded-lg md:h-11' />
								</div>
								<Skeleton className='h-4 w-48' />
							</div>

							{/* Certificates Table Skeleton */}
							<div className='overflow-x-auto'>
								<Table>
									<TableHeader className='bg-accent'>
										<TableRow className='border-none'>
											<TableHead className='h-11 rounded-tl-lg'>
												<Skeleton className='h-4 w-24' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-20' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-20' />
											</TableHead>
											<TableHead className='h-11'>
												<Skeleton className='h-4 w-16' />
											</TableHead>
											<TableHead className='h-11 rounded-tr-lg text-right'>
												<Skeleton className='ml-auto h-4 w-16' />
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{/* Generate 5 skeleton rows for certificates */}
										{Array.from({ length: 5 }, (_, index) => (
											<TableRow
												key={`certificates-row-${index + 1}`}
												className='border-border/40 dark:border-border'
											>
												<TableCell>
													<Skeleton className='h-4 w-32' />
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-16' />
													</div>
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-2'>
														<Skeleton className='h-3 w-3 rounded-full' />
														<Skeleton className='h-3 w-16' />
													</div>
												</TableCell>
												<TableCell>
													<Skeleton className='h-6 w-16 rounded-full' />
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex justify-end gap-2'>
														<Skeleton className='h-8 w-8 rounded' />
														<Skeleton className='h-8 w-8 rounded' />
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							<div className='mt-6 flex w-full flex-col items-center justify-between gap-4 lg:flex-row'>
								<div className='flex flex-1 items-center gap-2'>
									<Skeleton className='h-4 w-10' />
									<Skeleton className='h-8 w-16 rounded-lg' />
									<Skeleton className='h-4 w-16' />
								</div>
								<div className='flex flex-1 items-center justify-end gap-2'>
									<Skeleton className='h-9 w-20 rounded' />
									{Array.from({ length: 3 }, (_, index) => (
										<Skeleton
											key={`certificates-pagination-${index + 1}`}
											className='h-9 w-9 rounded'
										/>
									))}
									<Skeleton className='h-9 w-16 rounded' />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
