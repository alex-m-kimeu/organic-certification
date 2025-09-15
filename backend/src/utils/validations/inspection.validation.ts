import { z } from 'zod';

// Base field schema definitions
const inspectorNameSchema = z
	.string()
	.min(1, 'Inspector name is required')
	.max(100, 'Inspector name must not exceed 100 characters')
	.trim();

const checklistAnswerSchema = z.object({
	questionId: z.number().int().positive('Question ID is required'),
	answer: z.boolean({
		message: 'Answer is required and must be true or false',
	}),
});

const checklistSchema = z
	.array(checklistAnswerSchema)
	.min(5, 'At least 5 questions must be answered')
	.refine(
		(checklist) => {
			const questionIds = checklist.map((item) => item.questionId);
			const uniqueIds = new Set(questionIds);
			return uniqueIds.size === questionIds.length;
		},
		{
			message: 'Each question can only be answered once',
		},
	);

// Schema for updating checklist
const updateChecklistSchema = z
	.array(checklistAnswerSchema)
	.min(1, 'At least 1 question must be provided for update')
	.refine(
		(checklist) => {
			const questionIds = checklist.map((item) => item.questionId);
			const uniqueIds = new Set(questionIds);
			return uniqueIds.size === questionIds.length;
		},
		{
			message: 'Each question can only be answered once',
		},
	);

// Schema for creating a new inspection
export const createInspectionSchema = z.object({
	farmId: z.string().min(1, 'Farm ID is required'),
	inspectorName: inspectorNameSchema,
	checklist: checklistSchema,
});

// Schema for updating an inspection
export const updateInspectionSchema = z
	.object({
		inspectorName: inspectorNameSchema.optional(),
		checklist: updateChecklistSchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field must be provided for update',
	});

// Schema for approving an inspection
export const approveInspectionSchema = z.object({
	approved: z.boolean({
		message: 'Approval decision is required and must be true or false',
	}),
});

// Schema for query parameters
export const inspectionQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().max(100).optional(),
	search: z.string().optional(),
	farmId: z.string().optional(),
	status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
	inspectorName: z.string().optional(),
});

export type CreateInspectionDto = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionDto = z.infer<typeof updateInspectionSchema>;
export type ApproveInspectionDto = z.infer<typeof approveInspectionSchema>;
export type InspectionQueryDto = z.infer<typeof inspectionQuerySchema>;
