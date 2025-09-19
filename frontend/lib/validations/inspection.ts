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

// Schema for creating a new inspection
export const createInspectionSchema = z.object({
	farmId: z.string().min(1, 'Farm ID is required'),
	inspectorName: inspectorNameSchema,
	checklist: checklistSchema,
});

export type CreateInspection = z.infer<typeof createInspectionSchema>;
