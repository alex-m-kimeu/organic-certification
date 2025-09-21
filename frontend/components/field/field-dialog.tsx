'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Button,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui';
import { LuLoaderCircle } from 'react-icons/lu';
import type { Field } from '@/types/field';
import { createFieldSchema, type CreateField, COMMON_CROPS } from '@/lib/validations/field.validation';
import { cn } from '@/lib/utils';

interface FieldDialogProps {
	field?: Field | null;
	farmId: string;
	isOpen?: boolean;
	onFieldAdded: () => void;
	onClose?: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FieldDialog({ field, farmId, isOpen = false, onFieldAdded, onClose }: FieldDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!field;

	const form = useForm<CreateField>({
		resolver: zodResolver(createFieldSchema),
		defaultValues: {
			farmId: farmId,
			name: '',
			crop: 'Maize',
			areaHa: 0,
		},
		mode: 'onChange',
	});

	const {
		formState: { isValid: isFormValid },
	} = form;

	useEffect(() => {
		if (field) {
			form.reset({
				farmId: field.farmId,
				name: field.name,
				crop: field.crop as (typeof COMMON_CROPS)[number],
				areaHa: field.areaHa,
			});
		} else {
			form.reset({
				farmId: farmId,
				name: '',
				crop: 'Maize',
				areaHa: 0,
			});
		}
	}, [field, farmId, form]);

	// Form submission handler
	const onSubmit = async (values: CreateField) => {
		setIsSubmitting(true);

		try {
			const url = isEditing ? `${BASE_URL}/fields/${field.id}` : `${BASE_URL}/fields`;
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
				throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} field`);
			}

			const result = await response.json();
			if (result.success) {
				toast.success(`Field ${isEditing ? 'updated' : 'created'} successfully!`);
				handleClose();
				onFieldAdded();
			} else {
				throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} field`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to save field. Please try again.';
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
				farmId: farmId,
				name: '',
				crop: 'Maize',
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
						{isEditing ? 'Edit Field' : 'Add New Field'}
					</DialogTitle>
					<p className='t-style-caption text-text-muted'>
						{isEditing ? 'Update field details below' : 'Fill in the details to add a new field'}
						<span className='sr-only'>. All fields marked with asterisk are required.</span>
					</p>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='flex flex-col items-start gap-[24px] self-stretch'
						noValidate
						aria-label={isEditing ? 'Edit field form' : 'Add new field form'}
					>
						{/* Field Name */}
						<FormField
							control={form.control}
							name='name'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Field Name
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g., North Field, Block A'
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

						{/* Crop Type */}
						<FormField
							control={form.control}
							name='crop'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Crop Type
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onValueChange={field.onChange}
											disabled={isSubmitting}
										>
											<SelectTrigger
												className='t-style-link rounded-2 border-border text-text-muted focus-visible:border-primary focus-visible:ring-primary flex !h-10 w-full items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:!h-11'
												aria-invalid={fieldState.invalid}
												aria-describedby={fieldState.error ? `crop-error` : undefined}
											>
												<SelectValue
													placeholder='Select crop type'
													className='placeholder:text-text-muted/70'
												/>
											</SelectTrigger>
											<SelectContent className='bg-accent border-border w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] border shadow-md'>
												{COMMON_CROPS.map((crop) => (
													<SelectItem key={crop} value={crop} className='text-text-muted'>
														{crop}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage className='t-style-caption text-error' id='crop-error' role='alert' />
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
											step='0.001'
											min='0'
											max='10000'
											placeholder='e.g., 2.5'
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `areaHa-error` : undefined}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(value === '' ? '' : parseFloat(value));
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
										? `${isEditing ? 'Updating' : 'Creating'} field, please wait`
										: `${isEditing ? 'Update' : 'Create'} field${isFormValid ? '' : ' (form has errors)'}`
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
										? 'Update Field'
										: 'Create Field'}
								{isSubmitting && (
									<span id='submit-status' className='sr-only' aria-live='polite'>
										{isEditing ? 'Updating field details' : 'Creating new field'}
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
