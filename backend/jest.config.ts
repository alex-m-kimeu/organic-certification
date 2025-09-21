import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	// Use ts-jest preset for TypeScript
	preset: 'ts-jest',

	// Test environment
	testEnvironment: 'node',

	// Root directories
	roots: ['<rootDir>/src', '<rootDir>/tests'],

	// Test match patterns
	testMatch: ['**/__tests__/**/*.(ts|js)', '**/*.(test|spec).(ts|js)', '**/tests/**/*.(ts|js)'],

	// File extensions to consider
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

	// Transform configuration
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},

	// Coverage settings
	collectCoverageFrom: [
		'src/**/*.(ts|js)',
		'!src/**/*.d.ts',
		'!src/server.ts', // Exclude server entry point
		'!src/types/**/*', // Exclude type definitions
		'!src/**/*.spec.ts',
		'!src/**/*.test.ts',
	],

	// Coverage thresholds (optional)
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},

	// Coverage directory
	coverageDirectory: 'coverage',

	// Coverage reporters
	coverageReporters: ['text', 'lcov', 'html'],

	// Setup files
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

	// Module name mapping for absolute imports (if needed)
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},

	// Clear mocks between tests
	clearMocks: true,

	// Restore mocks after each test
	restoreMocks: true,

	// Timeout for tests (30 seconds)
	testTimeout: 30000,

	// Verbose output
	verbose: true,

	// Detect handles that prevent Jest from exiting
	detectOpenHandles: true,

	// Force exit after tests complete
	forceExit: true,

	// Handle database connections and async operations
	maxConcurrency: 1,

	// TypeScript configuration
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.test.json',
		},
	},
};

export default config;
