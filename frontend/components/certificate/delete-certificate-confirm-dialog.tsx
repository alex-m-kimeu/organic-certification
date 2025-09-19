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
import type { Certificate } from '@/types/certificate';

interface DeleteCertificateConfirmDialogProps {
	certificate: Certificate | null;
	isOpen: boolean;
	onClose: () => void;
	onCertificateDeleted: () => void;
	isDeleting?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DeleteCertificateConfirmDialog({
	certificate,
	isOpen,
	onClose,
	onCertificateDeleted,
	isDeleting = false,
}: DeleteCertificateConfirmDialogProps) {
	// Handle delete certificate
	const handleDeleteCertificate = async () => {
		if (!certificate) {
			return;
		}

		try {
			const response = await fetch(`${BASE_URL}/certificates/${certificate.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete certificate');
			}

			toast.success(`Certificate "${certificate.certificateNo}" deleted successfully!`);
			onClose();
			onCertificateDeleted();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to delete certificate. Please try again.';

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

	if (!certificate) {
		return null;
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className='bg-accent border-border animate-fadeIn gap-6 rounded-lg border-0 shadow-md sm:max-w-[500px] dark:border dark:shadow-none'>
				<AlertDialogHeader>
					<AlertDialogTitle className='t-style-h3 text-error !font-bold'>Delete Certificate</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className='space-y-2'>
							<p className='t-style-caption text-text-muted !font-medium'>
								Are you sure you want to delete certificate{' '}
								<strong className='text-error'>{certificate.certificateNo}</strong>?
							</p>
							<div className='bg-error/10 border-error/50 rounded-lg border p-3' role='alert'>
								<p className='t-style-caption text-text-muted/70'>
									<strong>⚠️ Warning:</strong> This action cannot be undone. This will permanently
									remove the certificate and all associated data from the system.
								</p>
							</div>
							<div className='rounded-2 mt-3 space-y-2 p-3 text-sm'>
								<h4 className='sr-only'>Certificate Details</h4>
								<dl className='space-y-2'>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Certificate Number:</dt>
										<dd className='ml-1 inline'>{certificate.certificateNo}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Issue Date:</dt>
										<dd className='ml-1 inline'>{formatDate(certificate.issueDate)}</dd>
									</div>
									<div className='t-style-caption text-text-muted'>
										<dt className='inline font-bold'>Expiry Date:</dt>
										<dd className='ml-1 inline'>{formatDate(certificate.expiryDate)}</dd>
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
						onClick={handleDeleteCertificate}
						disabled={isDeleting}
						aria-describedby={isDeleting ? 'delete-status' : undefined}
						aria-label={
							isDeleting
								? `Deleting certificate ${certificate.certificateNo}`
								: `Delete certificate ${certificate.certificateNo}`
						}
						style={{ backgroundColor: '#dc2626' }}
						className='t-style-link rounded-2 focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all hover:opacity-90 focus:ring-[0.5px] focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isDeleting && <LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />}
						{isDeleting ? 'Deleting...' : 'Delete Certificate'}
						{isDeleting && (
							<span id='delete-status' className='sr-only' aria-live='polite'>
								Deletion in progress for certificate {certificate.certificateNo}
							</span>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
