'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Button,
	Input,
} from '@/components/ui';
import { toast } from 'sonner';
import { LuLoaderCircle } from 'react-icons/lu';
import { createFarmSchema, type CreateFarm } from '@/lib/validations/farm';
import type { FarmWithFields } from '@/types/farm';
import { cn } from '@/lib/utils';

interface FarmDialogProps {
	farm?: FarmWithFields | null;
	farmerId: string;
	isOpen?: boolean;
	onFarmAdded: () => void;
	onClose?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmDialog({ farm, farmerId, isOpen = false, onFarmAdded, onClose }: FarmDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!farm;

	const form = useForm<CreateFarm>({
		resolver: zodResolver(createFarmSchema),
		defaultValues: {
			farmerId: farmerId,
			farmName: '',
			location: '',
			areaHa: 0,
		},
		mode: 'onChange',
	});

	const {
		formState: { isValid: isFormValid },
	} = form;

	useEffect(() => {
		if (farm) {
			form.reset({
				farmerId: farm.farmerId,
				farmName: farm.farmName,
				location: farm.location,
				areaHa: farm.areaHa,
			});
		} else {
			form.reset({
				farmerId: farmerId,
				farmName: '',
				location: '',
				areaHa: 0,
			});
		}
	}, [farm, farmerId, form]);

	// Form submission handler
	const onSubmit = async (values: CreateFarm) => {
		setIsSubmitting(true);

		try {
			const url = isEditing ? `${BASE_URL}/farms/${farm.id}` : `${BASE_URL}/farms`;
			const method = isEditing ? 'PATCH' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(values),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to save farm');
			}

			const result = await response.json();
			if (result.success) {
				toast.success(`Farm "${values.farmName}" ${isEditing ? 'updated' : 'created'} successfully!`);
				handleClose();
				onFarmAdded();
			} else {
				throw new Error(result.message || 'Failed to save farm');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to save farm. Please try again.';
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			if (onClose) {
				onClose();
			}
			form.reset({
				farmerId: farmerId,
				farmName: '',
				location: '',
				areaHa: 0,
			});
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				}
			}}
		>
			<DialogContent className='bg-accent animate-fadeIn gap-6 rounded-lg border-none shadow-md sm:max-w-[500px] dark:shadow-none'>
				<DialogHeader>
					<DialogTitle className='t-style-h3 text-primary !font-bold'>
						{isEditing ? 'Edit Farm' : 'Add New Farm'}
					</DialogTitle>
					<p className='t-style-caption text-text-muted'>
						{isEditing ? 'Update farm details below' : 'Fill in the details to add a new farm'}
						<span className='sr-only'>. All fields marked with asterisk are required.</span>
					</p>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='flex flex-col items-start gap-[24px] self-stretch'
						noValidate
						aria-label={isEditing ? 'Edit farm form' : 'Add new farm form'}
					>
						{/* Farm Name */}
						<FormField
							control={form.control}
							name='farmName'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Farm Name
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter farm name'
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											{...field}
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `farmName-error` : undefined}
										/>
									</FormControl>
									<FormMessage
										className='t-style-caption text-error'
										id='farmName-error'
										role='alert'
									/>
								</FormItem>
							)}
						/>

						{/* Location */}
						<FormField
							control={form.control}
							name='location'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Location
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter farm location'
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											{...field}
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `location-error` : undefined}
										/>
									</FormControl>
									<FormMessage
										className='t-style-caption text-error'
										id='location-error'
										role='alert'
									/>
								</FormItem>
							)}
						/>

						{/* Area in Hectares */}
						<FormField
							control={form.control}
							name='areaHa'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Area (Hectares)
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											type='number'
											step='0.01'
											min='0.01'
											max='50000'
											placeholder='Enter area in hectares'
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											{...field}
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `areaHa-error` : undefined}
											onChange={(e) => {
												const value = parseFloat(e.target.value);
												field.onChange(isNaN(value) ? 0 : value);
											}}
											value={field.value || ''}
										/>
									</FormControl>
									<FormMessage
										className='t-style-caption text-error'
										id='areaHa-error'
										role='alert'
									/>
								</FormItem>
							)}
						/>

						{/* Actions */}
						<DialogFooter className='flex w-full justify-between gap-10 pt-2 md:gap-20'>
							<Button
								type='button'
								variant='outline'
								onClick={handleClose}
								disabled={isSubmitting}
								className='t-style-link rounded-2 text-text-muted bg-accent border-border focus:ring-border focus:ring-offset-accent flex flex-1 cursor-pointer items-center justify-center border px-4 py-2 shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isSubmitting || !isFormValid}
								aria-describedby={isSubmitting ? 'submit-status' : undefined}
								aria-label={
									isSubmitting
										? `${isEditing ? 'Updating' : 'Creating'} farm, please wait`
										: `${isEditing ? 'Update' : 'Create'} farm${isFormValid ? '' : ' (form has errors)'}`
								}
								className={cn(
									't-style-link rounded-2 focus:ring-primary focus:ring-offset-accent flex flex-1 items-center justify-center px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2',
									isFormValid && !isSubmitting
										? 'bg-primary hover:bg-primary/90 cursor-pointer'
										: 'bg-primary/80 cursor-not-allowed',
								)}
							>
								{isSubmitting && (
									<LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
								)}
								{isSubmitting
									? isEditing
										? 'Updating...'
										: 'Creating...'
									: isEditing
										? 'Update Farm'
										: 'Create Farm'}
								{isSubmitting && (
									<span id='submit-status' className='sr-only' aria-live='polite'>
										{isEditing ? 'Updating farm details' : 'Creating new farm'}
									</span>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
