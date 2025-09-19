'use client';

import React from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui';
import { toast } from 'sonner';
import { LuLoaderCircle } from 'react-icons/lu';
import type { InspectionWithFarm } from '@/types/inspection';

interface DeleteInspectionConfirmDialogProps {
	inspection: InspectionWithFarm | null;
	isOpen: boolean;
	onClose: () => void;
	onInspectionDeleted: () => void;
	isDeleting?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteInspectionConfirmDialog({
	inspection,
	isOpen,
	onClose,
	onInspectionDeleted,
	isDeleting = false,
}: DeleteInspectionConfirmDialogProps) {
	// Handle delete inspection
	const handleDeleteInspection = async () => {
		if (!inspection) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/inspections/${inspection.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete inspection');
			}

			toast.success(`Inspection for "${inspection.farm.farmName}" deleted successfully!`);
			onClose();
			onInspectionDeleted();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to delete inspection. Please try again.';

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

	if (!inspection) {
		return null;
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className='bg-accent border-border animate-fadeIn gap-6 rounded-lg border-0 shadow-md sm:max-w-[500px] dark:border dark:shadow-none'>
				<AlertDialogHeader>
					<AlertDialogTitle className='t-style-h3 text-error !font-bold'>Delete Inspection</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className='space-y-2'>
							<p className='t-style-caption text-text-muted !font-medium'>
								Are you sure you want to delete this inspection for{' '}
								<strong className='text-error'>{inspection.farm.farmName}</strong>?
							</p>
							<div className='bg-error/10 border-error/50 rounded-lg border p-3' role='alert'>
								<p className='t-style-caption text-text-muted/70'>
									<strong>⚠️ Warning:</strong> This action cannot be undone. This will permanently
									remove the inspection and all associated data from the system.
									{inspection.status === 'APPROVED' && (
										<span className='text-error mt-1 block font-bold'>
											Note: This is an APPROVED inspection. Deleting it may affect certificates
											and compliance records.
										</span>
									)}
								</p>
							</div>
							<div className='rounded-2 mt-3 space-y-2 p-3 text-sm'>
								<h4 className='sr-only'>Inspection Details</h4>
								<dl className='space-y-2'>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Farm:</dt>
										<dd className='ml-1 inline'>{inspection.farm.farmName}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Inspector:</dt>
										<dd className='ml-1 inline'>{inspection.inspectorName}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Date:</dt>
										<dd className='ml-1 inline'>{formatDate(inspection.date)}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Status:</dt>
										<dd className='ml-1 inline'>
											<span
												className={`font-medium ${
													inspection.status === 'APPROVED'
														? 'text-green-600'
														: inspection.status === 'REJECTED'
															? 'text-red-600'
															: inspection.status === 'SUBMITTED'
																? 'text-blue-600'
																: 'text-gray-600'
												}`}
											>
												{inspection.status}
											</span>
										</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Compliance Score:</dt>
										<dd className='ml-1 inline'>
											{inspection.complianceScore !== null &&
											inspection.complianceScore !== undefined
												? `${inspection.complianceScore.toFixed(1)}%`
												: 'N/A'}
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className='flex w-full justify-between gap-10 pt-2 md:gap-20'>
					<AlertDialogCancel
						disabled={isDeleting}
						className='t-style-link rounded-2 text-text-muted bg-accent border-border hover:bg-accent/80 focus:ring-border focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center border px-4 py-2 shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDeleteInspection}
						disabled={isDeleting}
						aria-describedby={isDeleting ? 'delete-status' : undefined}
						aria-label={
							isDeleting
								? `Deleting inspection for ${inspection.farm.farmName}`
								: `Delete inspection for ${inspection.farm.farmName}`
						}
						style={{ backgroundColor: '#dc2626' }}
						className='t-style-link rounded-2 focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all hover:opacity-90 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isDeleting && <LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />}
						{isDeleting ? 'Deleting...' : 'Delete Inspection'}
						{isDeleting && (
							<span id='delete-status' className='sr-only' aria-live='polite'>
								Deletion in progress for inspection at {inspection.farm.farmName}
							</span>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
