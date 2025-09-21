import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
config({ path: '.env.test' });

// Create a test Prisma client
let prisma: PrismaClient;

// Global setup before all tests
beforeAll(async () => {
	// Initialize Prisma client for testing
	prisma = new PrismaClient({
		datasources: {
			db: {
				url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
			},
		},
	});

	// Connect to the database
	await prisma.$connect();

	// Optional: Reset database state or run migrations
	// await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
});

// Global teardown after all tests
afterAll(async () => {
	// Close database connection
	if (prisma) {
		await prisma.$disconnect();
	}
});

// Global setup before each test
beforeEach(async () => {
	// Optional: Clean up or reset specific data before each test
	// This can be useful if you want to start each test with a clean slate
});

// Global teardown after each test
afterEach(async () => {
	// Optional: Clean up after each test
	// This might include clearing specific tables or resetting state
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
	// Don't exit the process in test mode, just log the error
});

// Set test timeout globally (can be overridden in individual tests)
jest.setTimeout(30000);

// Mock console methods if needed (uncomment if you want cleaner test output)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Export prisma instance for use in tests
export { prisma };
