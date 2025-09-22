'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { Check, X, ClipboardCheck } from 'lucide-react';
import { LuLoaderCircle } from 'react-icons/lu';
import type { InspectionWithFarm, ChecklistQuestion } from '@/types/inspection';

interface InspectionUpdateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	inspection: InspectionWithFarm | null;
	onInspectionUpdated?: () => void;
}

interface ChecklistAnswer {
	questionId: number;
	answer: boolean | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InspectionUpdateDialog({
	isOpen,
	onClose,
	inspection,
	onInspectionUpdated,
}: InspectionUpdateDialogProps) {
	const [questions, setQuestions] = useState<ChecklistQuestion[]>([]);
	const [answers, setAnswers] = useState<ChecklistAnswer[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		defaultValues: {
			inspectorName: inspection?.inspectorName || '',
		},
		mode: 'onChange',
	});

	const canSubmit = () => {
		const inspectorName = form.watch('inspectorName');
		const answeredQuestions = answers.filter((a) => a.answer !== null);

		return !isSubmitting && inspectorName?.trim() && answeredQuestions.length >= 5;
	};

	useEffect(() => {
		if (isOpen && questions.length === 0) {
			fetchQuestions();
		}
	}, [isOpen, questions.length]);

	useEffect(() => {
		if (isOpen && inspection) {
			form.reset({
				inspectorName: inspection.inspectorName,
			});

			if (questions.length > 0 && inspection.checklist) {
				const existingAnswers = questions.map((q) => {
					const existingAnswer = inspection.checklist.find((c) => c.questionId === q.id);

					return {
						questionId: q.id,
						answer: existingAnswer ? existingAnswer.answer : null,
					};
				});
				setAnswers(existingAnswers);
			}
		}
	}, [isOpen, questions, form, inspection]);

	const fetchQuestions = async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`${BASE_URL}/inspections/questions`);
			if (!response.ok) {
				throw new Error(`Failed to fetch questions: ${response.status}`);
			}

			const result = await response.json();
			if (result.success && result.data) {
				const sortedQuestions = result.data.sort(
					(a: ChecklistQuestion, b: ChecklistQuestion) => a.order - b.order,
				);
				setQuestions(sortedQuestions);
			} else {
				throw new Error('Failed to load questions');
			}
		} catch {
			toast.error('Failed to load inspection questions. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleAnswerChange = (questionId: number, answer: boolean | null) => {
		setAnswers((prev) => prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a)));
	};

	const handleSubmit = async (values: any) => {
		if (!inspection) {
			toast.error('No inspection selected for update');

			return;
		}

		// Check if at least 5 questions are answered
		const answeredQuestions = answers.filter((a) => a.answer !== null);

		if (answeredQuestions.length < 5) {
			toast.error('Please answer at least 5 questions');

			return;
		}

		try {
			setIsSubmitting(true);

			const updatePayload = {
				inspectorName: values.inspectorName.trim(),
				checklist: answeredQuestions.map((a) => ({
					questionId: a.questionId,
					answer: a.answer as boolean,
				})),
			};

			const response = await fetch(`${BASE_URL}/inspections/${inspection.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatePayload),
			});

			if (!response.ok) {
				const errorText = await response.text();

				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { message: errorText };
				}

				throw new Error(errorData?.message || `Failed to update inspection: ${response.status}`);
			}

			const result = await response.json();

			if (result.success) {
				toast.success('Inspection updated successfully!');
				onInspectionUpdated?.();
				onClose();
			} else {
				throw new Error(result.message || 'Failed to update inspection');
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update inspection. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			onClose();
			form.reset({
				inspectorName: inspection?.inspectorName || '',
			});
			setAnswers([]);
		}
	};

	const getCompliancePercentage = () => {
		const answeredQuestions = answers.filter((a) => a.answer !== null);
		const yesAnswers = answers.filter((a) => a.answer === true);

		return answeredQuestions.length > 0 ? Math.round((yesAnswers.length / answeredQuestions.length) * 100) : 0;
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
			<DialogContent className='bg-accent animate-fadeIn !h-[90vh] !max-h-none !w-[90vw] !max-w-none gap-4 overflow-y-auto rounded-lg border-none px-5 py-8 shadow-md lg:!w-[65vw] lg:px-6 lg:py-6 dark:shadow-none'>
				<DialogHeader>
					<DialogTitle className='t-style-h3 text-primary flex items-center gap-2 !font-bold'>
						<ClipboardCheck className='text-primary size-6' />
						Update Inspection - {inspection?.farm.farmName}
					</DialogTitle>
					<p className='t-style-caption text-text-muted'>
						Update the inspection details for{' '}
						<span className='font-semibold'>{inspection?.farm.farmName}</span> at{' '}
						<span className='font-semibold'>{inspection?.farm.location}</span>. Modify inspector name and
						checklist answers as needed. At least 5 questions are required.
						<span className='sr-only'>. All fields marked with asterisk are required.</span>
					</p>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className='flex w-full flex-col items-start gap-[24px]'
						noValidate
						aria-label='Update inspection form'
					>
						{/* Inspector Name */}
						<FormField
							control={form.control}
							name='inspectorName'
							render={({ field, fieldState }) => (
								<FormItem className='flex w-full flex-col gap-[8px] space-y-0'>
									<FormLabel className='t-style-link text-text-muted self-stretch !font-semibold'>
										Inspector Name
										<span className='text-error' aria-label='required'>
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter inspector name'
											className='t-style-link rounded-2 border-border text-text-muted placeholder:text-text-muted/70 focus-visible:border-primary focus-visible:ring-primary flex h-10 items-center self-stretch border px-2 shadow-none outline-none focus-visible:ring-[0.5px] focus-visible:ring-offset-0 md:h-11'
											{...field}
											disabled={isSubmitting}
											aria-invalid={fieldState.invalid}
											aria-describedby={fieldState.error ? `inspectorName-error` : undefined}
										/>
									</FormControl>
									<FormMessage
										className='t-style-caption text-error'
										id='inspectorName-error'
										role='alert'
									/>
								</FormItem>
							)}
						/>

						{/* Inspection Checklist */}
						<Card className='bg-accent text-text-muted flex w-full flex-col gap-6 rounded-none border-none py-0 shadow-none'>
							<CardHeader className='!items-center p-0 md:!items-start'>
								<div className='flex flex-col items-center justify-normal gap-2 md:flex-row md:justify-between md:gap-1'>
									<CardTitle className='text-xl font-bold'>Update Inspection Checklist</CardTitle>
									<div className='space-y-1 text-center md:text-right'>
										<div className='text-primary text-lg font-bold'>
											Compliance: {getCompliancePercentage()}%
										</div>
										<div className='text-text-muted text-sm'>
											{answers.filter((a) => a.answer === true).length} Yes /{' '}
											{answers.filter((a) => a.answer !== null).length} Answered
										</div>
									</div>
								</div>
								<div className='mt-2 text-center md:text-start'>
									<div
										className={`text-sm font-medium ${answers.filter((a) => a.answer !== null).length >= 5 ? 'text-green-600' : 'text-red-600'}`}
									>
										Progress: {answers.filter((a) => a.answer !== null).length} of 5+ required
										questions answered
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-0'>
								{isLoading ? (
									<div className='text-text-muted t-style-caption py-12 text-center'>
										Loading inspection questions...
									</div>
								) : questions.length > 0 ? (
									<>
										{/* Table Layout for Large Devices */}
										<div className='hidden overflow-hidden lg:block'>
											<Table>
												<TableHeader className='bg-primary'>
													<TableRow className='border-none'>
														<TableHead className='t-style-link h-11 rounded-tl-lg !font-semibold text-white'>
															No
														</TableHead>
														<TableHead className='t-style-link h-11 !font-semibold text-white'>
															Question & Description
														</TableHead>
														<TableHead className='t-style-link h-11 px-4 !font-semibold text-white'>
															Yes
														</TableHead>
														<TableHead className='t-style-link h-11 px-4 !font-semibold text-white'>
															No
														</TableHead>
														<TableHead className='t-style-link h-11 rounded-tr-lg px-4 !font-semibold text-white'>
															Skip
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{questions.map((question) => {
														const answer = answers.find(
															(a) => a.questionId === question.id,
														);

														return (
															<TableRow
																key={question.id}
																className='border-border/40 dark:border-border'
															>
																<TableCell>
																	<div className='bg-primary/10 text-primary t-style-caption flex h-8 w-8 items-center justify-center rounded-full !font-bold'>
																		{question.order}
																	</div>
																</TableCell>
																<TableCell>
																	<div className='space-y-2'>
																		<p className='t-style-link text-text-muted !font-bold'>
																			{question.question}
																		</p>
																		<p className='t-style-caption text-text-muted !font-normal'>
																			{question.description}
																		</p>
																	</div>
																</TableCell>
																<TableCell className='px-4'>
																	<Button
																		type='button'
																		onClick={() =>
																			handleAnswerChange(question.id, true)
																		}
																		className={`bg-accent border-border focus:ring-primary size-10 rounded-lg border transition-all focus:outline-none focus:ring-[0.5px] ${
																			answer?.answer === true
																				? 'border-primary bg-primary text-white'
																				: 'hover:border-primary hover:bg-primary/5'
																		}`}
																		disabled={isSubmitting}
																		title='Mark as Yes'
																	>
																		<Check
																			className={`mx-auto size-5 ${
																				answer?.answer === true
																					? 'text-white'
																					: 'text-primary'
																			}`}
																		/>
																	</Button>
																</TableCell>
																<TableCell className='px-4'>
																	<Button
																		type='button'
																		onClick={() =>
																			handleAnswerChange(question.id, false)
																		}
																		className={`bg-accent border-border size-10 rounded-lg border transition-all focus:outline-none focus:ring-[0.5px] focus:ring-red-500 ${
																			answer?.answer === false
																				? 'border-red-500 bg-red-500 text-white'
																				: 'hover:border-red-400 hover:bg-red-50'
																		}`}
																		disabled={isSubmitting}
																		title='Mark as No'
																	>
																		<X
																			className={`mx-auto size-5 ${
																				answer?.answer === false
																					? 'text-white'
																					: 'text-red-500'
																			}`}
																		/>
																	</Button>
																</TableCell>
																<TableCell className='px-4'>
																	<Button
																		type='button'
																		onClick={() =>
																			handleAnswerChange(question.id, null)
																		}
																		className={`bg-accent border-border size-10 rounded-lg border transition-all focus:outline-none focus:ring-[0.5px] focus:ring-gray-400 ${
																			answer?.answer === null
																				? 'border-gray-500 bg-gray-500 text-white'
																				: 'hover:border-gray-400 hover:bg-gray-50'
																		}`}
																		disabled={isSubmitting}
																		title='Skip this question'
																	>
																		<span
																			className={`t-style-caption !font-bold ${
																				answer?.answer === null
																					? 'text-white'
																					: 'text-gray-500'
																			}`}
																		>
																			N/A
																		</span>
																	</Button>
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
										</div>

										{/* Card Layout for Medium and Smaller Devices */}
										<div className='space-y-4 lg:hidden'>
											{questions.map((question) => {
												const answer = answers.find((a) => a.questionId === question.id);

												return (
													<Card
														key={question.id}
														className='bg-background border-border/40 rounded-lg border p-4 shadow-md'
													>
														<div className='mb-3 flex items-start gap-3'>
															<div className='bg-primary/10 text-primary t-style-caption flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full !font-bold'>
																{question.order}
															</div>
															<div className='flex-1 space-y-2'>
																<h4 className='t-style-link text-text-muted !font-bold leading-tight'>
																	{question.question}
																</h4>
																<p className='t-style-caption text-text-muted !font-normal leading-relaxed'>
																	{question.description}
																</p>
															</div>
														</div>

														<div className='flex justify-center gap-3'>
															<Button
																type='button'
																onClick={() => handleAnswerChange(question.id, true)}
																className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-all focus:outline-none focus:ring-[0.5px] ${
																	answer?.answer === true
																		? 'border-primary bg-primary focus:ring-primary text-white'
																		: 'bg-accent border-border/40 dark:border-border focus:ring-primary'
																}`}
																disabled={isSubmitting}
																title='Mark as Yes'
															>
																<Check className='size-4' />
																<span className='t-style-link'>Yes</span>
															</Button>

															<Button
																type='button'
																onClick={() => handleAnswerChange(question.id, false)}
																className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-all focus:outline-none focus:ring-[0.5px] ${
																	answer?.answer === false
																		? 'border-red-500 bg-red-500 text-white focus:ring-red-500'
																		: 'bg-accent border-border/40 dark:border-border focus:ring-red-500'
																}`}
																disabled={isSubmitting}
																title='Mark as No'
															>
																<X className='size-4' />
																<span className='t-style-link'>No</span>
															</Button>

															<Button
																type='button'
																onClick={() => handleAnswerChange(question.id, null)}
																className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-all focus:outline-none focus:ring-[0.5px] ${
																	answer?.answer === null
																		? 'border-gray-500 bg-gray-500 text-white focus:ring-gray-400'
																		: 'bg-accent border-border/40 dark:border-border focus:ring-gray-400'
																}`}
																disabled={isSubmitting}
																title='Skip this question'
															>
																<span className='t-style-link'>N/A</span>
															</Button>
														</div>
													</Card>
												);
											})}
										</div>
									</>
								) : (
									<div className='text-text-muted t-style-caption py-12 text-center'>
										<ClipboardCheck className='mx-auto mb-4 h-12 w-12 text-gray-400' />
										No inspection questions available
									</div>
								)}
							</CardContent>
						</Card>

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
								disabled={!canSubmit()}
								className='t-style-link rounded-2 focus:ring-primary focus:ring-offset-accent bg-primary hover:bg-primary/90 flex flex-1 cursor-pointer items-center justify-center px-4 py-2 text-white shadow-none transition-all focus:ring-[0.5px] focus:ring-offset-2'
							>
								{isSubmitting && (
									<LuLoaderCircle className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
								)}
								{isSubmitting ? 'Updating...' : 'Update Inspection'}
								{isSubmitting && (
									<span id='submit-status' className='sr-only' aria-live='polite'>
										Updating inspection
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
