import { PrismaClient } from '@prisma/client';

// Declare Node.js globals
declare let process: {
	exit: (code?: number) => never;
};

const prisma = new PrismaClient();

async function main(): Promise<void> {
	console.log('🌱 Seeding database...');

	// Seed checklist questions
	const questions = [
		{
			order: 1,
			question: 'Any synthetic inputs in the last 36 months?',
			description:
				'Check if any synthetic fertilizers, pesticides, or other prohibited substances have been used on the farm in the past 36 months.',
		},
		{
			order: 2,
			question: 'Adequate buffer zones?',
			description:
				'Verify that there are sufficient buffer zones between organic fields and conventional farms or other potential contamination sources.',
		},
		{
			order: 3,
			question: 'Organic seed or permitted exceptions?',
			description:
				'Confirm that organic seeds are used, or that any exceptions are properly documented and justified.',
		},
		{
			order: 4,
			question: 'Compost/soil fertility managed organically?',
			description:
				'Ensure that soil fertility is maintained through organic methods such as composting, crop rotation, and organic amendments.',
		},
		{
			order: 5,
			question: 'Recordkeeping/logs available?',
			description:
				'Verify that comprehensive records of all farming activities, inputs, and practices are maintained and available for inspection.',
		},
		{
			order: 6,
			question: 'Water sources protected from contamination?',
			description:
				'Confirm that irrigation and water sources are safeguarded from chemical runoff or other contamination risks.',
		},
		{
			order: 7,
			question: 'Post-harvest handling compliant?',
			description:
				'Verify that harvested crops are handled, stored, and transported in a way that prevents contamination with prohibited substances.',
		},
		{
			order: 8,
			question: 'Proper crop rotation or biodiversity practices?',
			description:
				'Ensure that crop rotation or intercropping practices are used to maintain soil health and reduce pest and disease pressure.',
		},
		{
			order: 9,
			question: 'Inputs and materials approved for organic use?',
			description:
				'Check that all fertilizers, pest controls, and soil amendments are listed as permitted under organic regulations.',
		},
		{
			order: 10,
			question: 'Field boundaries clearly defined?',
			description:
				'Verify that field boundaries are clearly marked and managed to prevent mixing or contamination with non-organic crops.',
		},
	];

	console.log('📝 Creating checklist questions...');

	for (const questionData of questions) {
		const question = await prisma.checklistQuestion.upsert({
			where: { order: questionData.order },
			update: {
				question: questionData.question,
				description: questionData.description,
				isActive: true,
			},
			create: {
				order: questionData.order,
				question: questionData.question,
				description: questionData.description,
				isActive: true,
			},
		});

		console.log(`✅ Created/Updated question ${question.order}: ${question.question}`);
	}

	console.log('🎉 Seeding completed successfully!');
}

main()
	.catch((e: unknown) => {
		console.error('❌ Error during seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
