/**
 * Unit tests for compliance score calculation logic
 * Tests the compliance percentage calculation and related logic used throughout the frontend
 */

import { describe, test, expect } from '@jest/globals';

// Types for our test data
interface ChecklistAnswer {
	questionId: number;
	answer: boolean | null;
}

// compliance score calculation function
function calculateCompliancePercentage(answers: ChecklistAnswer[]): number {
	const answeredQuestions = answers.filter((a) => a.answer !== null);
	const yesAnswers = answers.filter((a) => a.answer === true);

	return answeredQuestions.length > 0 ? Math.round((yesAnswers.length / answeredQuestions.length) * 100) : 0;
}

// Helper function to determine compliance status based on score
function getComplianceStatus(score: number): 'APPROVED' | 'SUBMITTED' | 'REJECTED' {
	if (score >= 90) {
		return 'APPROVED';
	}
	if (score >= 80) {
		return 'SUBMITTED';
	}

	return 'REJECTED';
}

// Helper function to get compliance color class
function getComplianceColorClass(score: number | null): string {
	if (score === null || score === undefined) {
		return 'text-gray-500';
	}
	if (score >= 90) {
		return 'text-green-600';
	}
	if (score >= 80) {
		return 'text-yellow-600';
	}

	return 'text-red-600';
}

describe('Compliance Score Calculation', () => {
	describe('calculateCompliancePercentage', () => {
		test('should return 100% when all answers are yes', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: true },
			];

			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(100);
		});

		test('should return 0% when all answers are no', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: false },
				{ questionId: 2, answer: false },
				{ questionId: 3, answer: false },
				{ questionId: 4, answer: false },
				{ questionId: 5, answer: false },
			];

			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(0);
		});

		test('should return 80% when 4 out of 5 answers are yes', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: false },
			];

			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(80);
		});

		test('should return 60% when 3 out of 5 answers are yes', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: false },
				{ questionId: 5, answer: false },
			];

			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(60);
		});

		test('should ignore null/unanswered questions in calculation', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: null }, // Unanswered - should be ignored
				{ questionId: 4, answer: false },
				{ questionId: 5, answer: null }, // Unanswered - should be ignored
			];

			// Only 3 questions answered: 2 yes, 1 no = 2/3 = 66.67% → 67%
			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(67);
		});

		test('should return 0% when no questions are answered', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: null },
				{ questionId: 2, answer: null },
				{ questionId: 3, answer: null },
				{ questionId: 4, answer: null },
				{ questionId: 5, answer: null },
			];

			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(0);
		});

		test('should return 0% when answers array is empty', () => {
			const answers: ChecklistAnswer[] = [];
			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(0);
		});

		test('should handle single question scenarios correctly', () => {
			// Single yes answer
			expect(calculateCompliancePercentage([{ questionId: 1, answer: true }])).toBe(100);

			// Single no answer
			expect(calculateCompliancePercentage([{ questionId: 1, answer: false }])).toBe(0);

			// Single unanswered
			expect(calculateCompliancePercentage([{ questionId: 1, answer: null }])).toBe(0);
		});

		test('should properly round percentages', () => {
			// 1 yes out of 3 answers = 33.33% → 33%
			const answers1: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: false },
				{ questionId: 3, answer: false },
			];
			expect(calculateCompliancePercentage(answers1)).toBe(33);

			// 2 yes out of 3 answers = 66.67% → 67%
			const answers2: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: false },
			];
			expect(calculateCompliancePercentage(answers2)).toBe(67);

			// 5 yes out of 6 answers = 83.33% → 83%
			const answers3: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: true },
				{ questionId: 6, answer: false },
			];
			expect(calculateCompliancePercentage(answers3)).toBe(83);
		});

		test('should handle mixed scenarios with multiple unanswered questions', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: null },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: false },
				{ questionId: 5, answer: null },
				{ questionId: 6, answer: true },
				{ questionId: 7, answer: null },
				{ questionId: 8, answer: false },
			];

			// Answered: 1=true, 3=true, 4=false, 6=true, 8=false
			// 3 yes out of 5 answered = 60%
			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(60);
		});
	});

	describe('Compliance Status Thresholds', () => {
		test('should return APPROVED for scores >= 90%', () => {
			expect(getComplianceStatus(90)).toBe('APPROVED');
			expect(getComplianceStatus(95)).toBe('APPROVED');
			expect(getComplianceStatus(100)).toBe('APPROVED');
		});

		test('should return SUBMITTED for scores >= 80% and < 90%', () => {
			expect(getComplianceStatus(80)).toBe('SUBMITTED');
			expect(getComplianceStatus(85)).toBe('SUBMITTED');
			expect(getComplianceStatus(89)).toBe('SUBMITTED');
		});

		test('should return REJECTED for scores < 80%', () => {
			expect(getComplianceStatus(0)).toBe('REJECTED');
			expect(getComplianceStatus(50)).toBe('REJECTED');
			expect(getComplianceStatus(79)).toBe('REJECTED');
		});

		test('should handle edge cases at threshold boundaries', () => {
			expect(getComplianceStatus(79.9)).toBe('REJECTED');
			expect(getComplianceStatus(80.0)).toBe('SUBMITTED');
			expect(getComplianceStatus(89.9)).toBe('SUBMITTED');
			expect(getComplianceStatus(90.0)).toBe('APPROVED');
		});
	});

	describe('Compliance Color Classes', () => {
		test('should return green class for scores >= 90%', () => {
			expect(getComplianceColorClass(90)).toBe('text-green-600');
			expect(getComplianceColorClass(95)).toBe('text-green-600');
			expect(getComplianceColorClass(100)).toBe('text-green-600');
		});

		test('should return yellow class for scores >= 80% and < 90%', () => {
			expect(getComplianceColorClass(80)).toBe('text-yellow-600');
			expect(getComplianceColorClass(85)).toBe('text-yellow-600');
			expect(getComplianceColorClass(89)).toBe('text-yellow-600');
		});

		test('should return red class for scores < 80%', () => {
			expect(getComplianceColorClass(0)).toBe('text-red-600');
			expect(getComplianceColorClass(50)).toBe('text-red-600');
			expect(getComplianceColorClass(79)).toBe('text-red-600');
		});

		test('should return gray class for null/undefined scores', () => {
			expect(getComplianceColorClass(null)).toBe('text-gray-500');
			expect(getComplianceColorClass(undefined as any)).toBe('text-gray-500');
		});
	});

	describe('Real-world Scenarios', () => {
		test('should handle typical inspection checklist (5 questions)', () => {
			// Scenario: Farm passes 4 out of 5 requirements
			const passingInspection: ChecklistAnswer[] = [
				{ questionId: 1, answer: true }, // Proper organic certification
				{ questionId: 2, answer: true }, // No prohibited substances
				{ questionId: 3, answer: true }, // Proper record keeping
				{ questionId: 4, answer: true }, // Buffer zones maintained
				{ questionId: 5, answer: false }, // Minor documentation issue
			];

			const score = calculateCompliancePercentage(passingInspection);
			const status = getComplianceStatus(score);
			const colorClass = getComplianceColorClass(score);

			expect(score).toBe(80);
			expect(status).toBe('SUBMITTED');
			expect(colorClass).toBe('text-yellow-600');
		});

		test('should handle excellent compliance scenario', () => {
			// Scenario: Farm meets all requirements
			const excellentInspection: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: true },
				{ questionId: 6, answer: true },
			];

			const score = calculateCompliancePercentage(excellentInspection);
			const status = getComplianceStatus(score);
			const colorClass = getComplianceColorClass(score);

			expect(score).toBe(100);
			expect(status).toBe('APPROVED');
			expect(colorClass).toBe('text-green-600');
		});

		test('should handle poor compliance scenario', () => {
			// Scenario: Farm fails most requirements
			const failingInspection: ChecklistAnswer[] = [
				{ questionId: 1, answer: false }, // Failed certification
				{ questionId: 2, answer: true }, // One passing requirement
				{ questionId: 3, answer: false }, // Poor record keeping
				{ questionId: 4, answer: false }, // No buffer zones
				{ questionId: 5, answer: false }, // Multiple violations
			];

			const score = calculateCompliancePercentage(failingInspection);
			const status = getComplianceStatus(score);
			const colorClass = getComplianceColorClass(score);

			expect(score).toBe(20);
			expect(status).toBe('REJECTED');
			expect(colorClass).toBe('text-red-600');
		});

		test('should handle partially completed inspection', () => {
			// Scenario: Inspector has only completed some questions
			const partialInspection: ChecklistAnswer[] = [
				{ questionId: 1, answer: true }, // Completed
				{ questionId: 2, answer: true }, // Completed
				{ questionId: 3, answer: null }, // Not yet answered
				{ questionId: 4, answer: false }, // Completed
				{ questionId: 5, answer: null }, // Not yet answered
				{ questionId: 6, answer: null }, // Not yet answered
			];

			// Only 3 questions answered: 2 yes, 1 no = 67%
			const score = calculateCompliancePercentage(partialInspection);
			const status = getComplianceStatus(score);
			const colorClass = getComplianceColorClass(score);

			expect(score).toBe(67);
			expect(status).toBe('REJECTED');
			expect(colorClass).toBe('text-red-600');
		});

		test('should handle inspection ready for approval (>= 90%)', () => {
			// Scenario: Farm meets 9 out of 10 requirements
			const excellentInspection: ChecklistAnswer[] = [
				{ questionId: 1, answer: true },
				{ questionId: 2, answer: true },
				{ questionId: 3, answer: true },
				{ questionId: 4, answer: true },
				{ questionId: 5, answer: true },
				{ questionId: 6, answer: true },
				{ questionId: 7, answer: true },
				{ questionId: 8, answer: true },
				{ questionId: 9, answer: true },
				{ questionId: 10, answer: false },
			];

			const score = calculateCompliancePercentage(excellentInspection);
			const status = getComplianceStatus(score);
			const colorClass = getComplianceColorClass(score);

			expect(score).toBe(90);
			expect(status).toBe('APPROVED');
			expect(colorClass).toBe('text-green-600');
		});
	});

	describe('Edge Case Handling', () => {
		test('should handle very large number of questions', () => {
			// Create 100 questions, 83 yes, 17 no
			const largeAnswerSet: ChecklistAnswer[] = [];
			for (let i = 1; i <= 100; i++) {
				largeAnswerSet.push({
					questionId: i,
					answer: i <= 83,
				});
			}

			const score = calculateCompliancePercentage(largeAnswerSet);
			expect(score).toBe(83);
			expect(getComplianceStatus(score)).toBe('SUBMITTED');
		});

		test('should handle questions with non-sequential IDs', () => {
			const answers: ChecklistAnswer[] = [
				{ questionId: 101, answer: true },
				{ questionId: 505, answer: true },
				{ questionId: 999, answer: false },
				{ questionId: 42, answer: true },
			];

			// 3 yes out of 4 = 75%
			const result = calculateCompliancePercentage(answers);
			expect(result).toBe(75);
		});

		test('should consistently return integers (no decimal places)', () => {
			// Test various scenarios that might produce decimals
			const testCases = [
				[
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: false },
					{ questionId: 3, answer: false },
				], // 33.33%
				[
					{ questionId: 1, answer: true },
					{ questionId: 2, answer: true },
					{ questionId: 3, answer: false },
				], // 66.67%
				[{ questionId: 1, answer: true }], // 100%
				[{ questionId: 1, answer: false }], // 0%
			];

			testCases.forEach((answers) => {
				const score = calculateCompliancePercentage(answers as ChecklistAnswer[]);
				expect(Number.isInteger(score)).toBe(true);
				expect(score >= 0 && score <= 100).toBe(true);
			});
		});
	});
});
