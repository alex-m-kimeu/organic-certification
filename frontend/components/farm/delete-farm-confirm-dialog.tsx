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
import type { FarmWithFields } from '@/types/farm';

interface DeleteFarmConfirmDialogProps {
	farm: FarmWithFields | null;
	isOpen: boolean;
	onClose: () => void;
	onFarmDeleted: () => void;
	isDeleting?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteFarmConfirmDialog({
	farm,
	isOpen,
	onClose,
	onFarmDeleted,
	isDeleting = false,
}: DeleteFarmConfirmDialogProps) {
	// Handle delete farm
	const handleDeleteFarm = async () => {
		if (!farm) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/farms/${farm.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete farm');
			}

			toast.success(`Farm "${farm.farmName}" deleted successfully!`);
			onClose();
			onFarmDeleted();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete farm. Please try again.';

			toast.error(errorMessage);
		}
	};

	if (!farm) {
		return null;
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className='bg-accent border-border animate-fadeIn gap-6 rounded-lg border-0 shadow-md sm:max-w-[500px] dark:border dark:shadow-none'>
				<AlertDialogHeader>
					<AlertDialogTitle className='t-style-h3 text-error !font-bold'>Delete Farm</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className='space-y-2'>
							<p className='t-style-caption text-text-muted !font-medium'>
								Are you sure you want to delete <strong className='text-error'>{farm.farmName}</strong>?
							</p>
							<div className='bg-error/10 border-error/50 rounded-lg border p-3' role='alert'>
								<p className='t-style-caption text-text-muted/70'>
									<strong>⚠️ Warning:</strong> This action cannot be undone. This will permanently
									remove the farm and all associated data from the system.
								</p>
							</div>
							<div className='rounded-2 mt-3 space-y-2 p-3 text-sm'>
								<h4 className='sr-only'>Farm Details</h4>
								<dl className='space-y-2'>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Farm Name:</dt>
										<dd className='ml-1 inline'>{farm.farmName}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Location:</dt>
										<dd className='ml-1 inline'>{farm.location}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Area:</dt>
										<dd className='ml-1 inline'>{farm.areaHa.toFixed(2)} hectares</dd>
									</div>
									{farm.fields && farm.fields.length > 0 && (
										<div className='t-style-caption text-text-muted'>
											<dt className='inline font-bold'>Fields:</dt>
											<dd className='ml-1 inline'>
												{farm.fields.length} field{farm.fields.length === 1 ? '' : 's'}
											</dd>
										</div>
									)}
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
						onClick={handleDeleteFarm}
						disabled={isDeleting}
						aria-describedby={isDeleting ? 'delete-status' : undefined}
						aria-label={isDeleting ? `Deleting farm ${farm.farmName}` : `Delete farm ${farm.farmName}`}
						style={{ backgroundColor: '#dc2626' }}
						className='t-style-link rounded-2 focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all hover:opacity-90 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isDeleting && <LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />}
						{isDeleting ? 'Deleting...' : 'Delete Farm'}
						{isDeleting && (
							<span id='delete-status' className='sr-only' aria-live='polite'>
								Deletion in progress for farm {farm.farmName}
							</span>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
