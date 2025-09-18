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
import type { Farmer } from '@/types/farmer';

interface DeleteConfirmDialogProps {
	farmer: Farmer | null;
	isOpen: boolean;
	onClose: () => void;
	onFarmerDeleted: () => void;
	isDeleting?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteConfirmDialog({
	farmer,
	isOpen,
	onClose,
	onFarmerDeleted,
	isDeleting = false,
}: DeleteConfirmDialogProps) {
	// Handle delete farmer
	const handleDeleteFarmer = async () => {
		if (!farmer) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/farmers/${farmer.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete farmer');
			}

			toast.success(`Farmer "${farmer.name}" deleted successfully!`);
			onClose();
			onFarmerDeleted();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete farmer. Please try again.';

			toast.error(errorMessage);
		}
	};

	if (!farmer) {
		return null;
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className='bg-accent border-border animate-fadeIn gap-6 rounded-lg border-0 shadow-md sm:max-w-[500px] dark:border dark:shadow-none'>
				<AlertDialogHeader>
					<AlertDialogTitle className='t-style-h3 text-error !font-bold'>Delete Farmer</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className='space-y-2'>
							<p className='t-style-caption text-text-muted !font-medium'>
								Are you sure you want to delete <strong className='text-error'>{farmer.name}</strong>?
							</p>
							<div className='bg-error/10 border-error/50 rounded-lg border p-3' role='alert'>
								<p className='t-style-caption text-text-muted/70'>
									<strong>⚠️ Warning:</strong> This action cannot be undone. This will permanently
									remove the farmer and all associated data from the system.
								</p>
							</div>
							<div className='rounded-2 mt-3 space-y-2 p-3 text-sm'>
								<h4 className='sr-only'>Farmer Details</h4>
								<dl className='space-y-2'>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Name:</dt>
										<dd className='ml-1 inline'>{farmer.name}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Email:</dt>
										<dd className='ml-1 inline'>{farmer.email}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Phone:</dt>
										<dd className='ml-1 inline'>{farmer.phone}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>County:</dt>
										<dd className='ml-1 inline'>{farmer.county}</dd>
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
						onClick={handleDeleteFarmer}
						disabled={isDeleting}
						aria-describedby={isDeleting ? 'delete-status' : undefined}
						aria-label={isDeleting ? `Deleting farmer ${farmer.name}` : `Delete farmer ${farmer.name}`}
						style={{ backgroundColor: '#dc2626' }}
						className='t-style-link rounded-2 focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all hover:opacity-90 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isDeleting && <LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />}
						{isDeleting ? 'Deleting...' : 'Delete Farmer'}
						{isDeleting && (
							<span id='delete-status' className='sr-only' aria-live='polite'>
								Deletion in progress for farmer {farmer.name}
							</span>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
