'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Button,
	Input,
} from '@/components/ui';
import { toast } from 'sonner';
import { LuLoaderCircle } from 'react-icons/lu';
import { IoAdd } from 'react-icons/io5';
import { createFarmerSchema, KENYAN_COUNTIES, type CreateFarmer } from '@/lib/validations/farmer';
import type { Farmer } from '@/types/farmer';
import { cn } from '@/lib/utils';

interface FarmerDialogProps {
	farmer?: Farmer | null;
	onFarmerAdded: () => void;
	onClose?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FarmerDialog({ farmer, onFarmerAdded, onClose }: FarmerDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!farmer;

	const form = useForm<CreateFarmer>({
		resolver: zodResolver(createFarmerSchema),
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			county: '',
		},
		mode: 'onChange',
	});

	const {
		formState: { isValid: isFormValid },
	} = form;

	useEffect(() => {
		if (farmer) {
			form.reset({
				name: farmer.name,
				phone: farmer.phone.replace('+254', ''),
				email: farmer.email,
				county: farmer.county,
			});
			setIsOpen(true);
		} else {
			form.reset({
				name: '',
				phone: '',
				email: '',
				county: '',
			});
		}
	}, [farmer, form]);

	// Form submission handler
	const onSubmit = async (values: CreateFarmer) => {
		setIsSubmitting(true);

		try {
			const url = isEditing ? `${BASE_URL}/farmers/${farmer?.id}` : `${BASE_URL}/farmers`;
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
				throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} farmer`);
			}

			toast.success(`Farmer ${isEditing ? 'updated' : 'created'} successfully!`);

			form.reset();
			setIsOpen(false);

			onFarmerAdded();

			if (onClose) {
				onClose();
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: `Failed to ${isEditing ? 'update' : 'create'} farmer. Please try again.`;

			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			setIsOpen(false);
			form.reset();

			if (onClose) {
				onClose();
			}
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				} else if (!isEditing) {
					setIsOpen(true);
				}
			}}
		>
			{!isEditing && (
				<DialogTrigger asChild>
					<Button className='t-style-link rounded-2 bg-primary hover:bg-primary/70 focus:ring-primary focus:ring-offset-accent flex cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'>
						<IoAdd className='mr-1 h-4 w-4' aria-hidden='true' />
						Add New Farmer
					</Button>
				</DialogTrigger>
			)}

			<DialogContent className='bg-accent animate-fadeIn gap-6 rounded-lg border-none shadow-md sm:max-w-[500px] dark:shadow-none'>
				<DialogHeader>
					<DialogTitle className='t-style-h3 text-primary !font-bold'>
						{isEditing ? 'Edit Farmer' : 'Add New Farmer'}
					</DialogTitle>
					<p className='t-style-caption text-text-muted'>
						{isEditing ? 'Update farmer details below' : 'Fill in the details to add a new farmer'}
						<span className='sr-only'>. All fields marked with asterisk are required.</span>
					</p>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='flex flex-col items-start gap-[24px] self-stretch'
						noValidate
						aria-label={isEditing ? 'Edit farmer form' : 'Add new farmer form'}
					>
						{/* Name */}
						<FormField
							control={form.control}
							name='name'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Full Name
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter farmer's full name"
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											{...field}
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `name-error` : undefined}
										/>
									</FormControl>
									<FormMessage className='t-style-caption text-error' id='name-error' role='alert' />
								</FormItem>
							)}
						/>

						{/* Phone */}
						<FormField
							control={form.control}
							name='phone'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Phone
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<div className='relative w-full'>
											<div
												className='t-style-link text-text-muted pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center'
												aria-hidden='true'
											>
												🇰🇪 +254
											</div>
											<Input
												type='tel'
												placeholder='712345678'
												className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border pl-20 pr-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
												{...field}
												disabled={isSubmitting}
												aria-invalid={fieldState.invalid}
												aria-describedby={`phone-description ${fieldState.error ? 'phone-error' : ''}`}
												onChange={(e) => {
													const value = e.target.value.replace(/\D/g, '').slice(0, 9);
													field.onChange(value);
												}}
											/>
											<div id='phone-description' className='sr-only'>
												Enter phone number without country code. Kenya country code +254 will be
												added automatically.
											</div>
										</div>
									</FormControl>
									<FormMessage className='t-style-caption text-error' id='phone-error' role='alert' />
								</FormItem>
							)}
						/>

						{/* Email */}
						<FormField
							control={form.control}
							name='email'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Email
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											type='email'
											placeholder='farmer@example.com'
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											{...field}
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `email-error` : undefined}
										/>
									</FormControl>
									<FormMessage className='t-style-caption text-error' id='email-error' role='alert' />
								</FormItem>
							)}
						/>

						{/* County */}
						<FormField
							control={form.control}
							name='county'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										County
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={isSubmitting}
									>
										<FormControl>
											<SelectTrigger
												className='t-style-link rounded-2 border-border text-text-muted focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-full items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11'
												aria-invalid={fieldState.invalid}
												aria-describedby={fieldState.error ? `county-error` : undefined}
											>
												<SelectValue
													placeholder='Select county'
													className='placeholder:text-text-muted/70'
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent className='bg-accent border-border w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] border shadow-md'>
											{KENYAN_COUNTIES.map((county) => (
												<SelectItem
													key={county}
													value={county}
													disabled
													hidden
													className='text-text-muted'
												>
													{county}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage
										className='t-style-caption text-error'
										id='county-error'
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
										? `${isEditing ? 'Updating' : 'Creating'} farmer, please wait`
										: `${isEditing ? 'Update' : 'Create'} farmer${isFormValid ? '' : ' (form has errors)'}`
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
										? 'Update Farmer'
										: 'Create Farmer'}
								{isSubmitting && (
									<span id='submit-status' className='sr-only' aria-live='polite'>
										{isEditing ? 'Updating farmer details' : 'Creating new farmer'}
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
