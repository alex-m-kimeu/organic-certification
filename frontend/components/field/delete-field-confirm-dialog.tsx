'use client';

import React from 'react';
import { toast } from 'sonner';
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
import { LuLoaderCircle } from 'react-icons/lu';
import type { Field } from '@/types/field';

interface DeleteFieldConfirmDialogProps {
	field: Field | null;
	isOpen: boolean;
	onClose: () => void;
	onFieldDeleted: () => void;
	isDeleting?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteFieldConfirmDialog({
	field,
	isOpen,
	onClose,
	onFieldDeleted,
	isDeleting = false,
}: DeleteFieldConfirmDialogProps) {
	// Handle delete field
	const handleDeleteField = async () => {
		if (!field) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/fields/${field.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete field');
			}

			toast.success(`Field "${field.name}" deleted successfully!`);
			onClose();
			onFieldDeleted();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete field. Please try again.';

			toast.error(errorMessage);
		}
	};

	if (!field) {
		return null;
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className='bg-accent border-border animate-fadeIn gap-6 rounded-lg border-0 shadow-md sm:max-w-[500px] dark:border dark:shadow-none'>
				<AlertDialogHeader>
					<AlertDialogTitle className='t-style-h3 text-error !font-bold'>Delete Field</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className='space-y-2'>
							<p className='t-style-caption text-text-muted !font-medium'>
								Are you sure you want to delete <strong className='text-error'>{field.name}</strong>?
							</p>
							<div className='bg-error/10 border-error/50 rounded-lg border p-3' role='alert'>
								<p className='t-style-caption text-text-muted/70'>
									<strong>⚠️ Warning:</strong> This action cannot be undone. This will permanently
									remove the field and all associated data from the system.
								</p>
							</div>
							<div className='rounded-2 mt-3 space-y-2 p-3 text-sm'>
								<h4 className='sr-only'>Field Details</h4>
								<dl className='space-y-2'>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Field Name:</dt>
										<dd className='ml-1 inline'>{field.name}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Crop:</dt>
										<dd className='ml-1 inline'>{field.crop}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Area:</dt>
										<dd className='ml-1 inline'>{field.areaHa.toFixed(3)} hectares</dd>
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
						onClick={handleDeleteField}
						disabled={isDeleting}
						aria-describedby={isDeleting ? 'delete-status' : undefined}
						aria-label={isDeleting ? `Deleting field ${field.name}` : `Delete field ${field.name}`}
						style={{ backgroundColor: '#dc2626' }}
						className='t-style-link rounded-2 focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all hover:opacity-90 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isDeleting && <LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />}
						{isDeleting ? 'Deleting...' : 'Delete Field'}
						{isDeleting && (
							<span id='delete-status' className='sr-only' aria-live='polite'>
								Deletion in progress for field {field.name}
							</span>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
