/* eslint-disable no-console */
import { config } from 'dotenv';
import app from './app';
import { prisma } from './config/db';

config();

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
	console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

	setTimeout(async () => {
		try {
			await prisma.$disconnect();
			console.log('✅ Database connections closed');
			process.exit(0);
		} catch (error) {
			console.error('❌ Error during shutdown:', error);
			process.exit(1);
		}
	}, 1000);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
	console.error('❌ Uncaught Exception:', error);
	console.error('🛑 Shutting down due to uncaught exception');
	process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
	console.error('❌ Unhandled Rejection at:', promise);
	console.error('❌ Reason:', reason);

	// Check if it's a network-related error that shouldn't crash the server
	const isNetworkError =
		(reason instanceof Error &&
			(reason.message.includes('ETIMEDOUT') ||
				reason.message.includes('ECONNRESET') ||
				reason.message.includes('ENOTFOUND') ||
				reason.message.includes('ECONNREFUSED') ||
				reason.message.includes('network') ||
				reason.message.includes('Cloudinary') ||
				('code' in reason &&
					(reason.code === 'ETIMEDOUT' ||
						reason.code === 'ECONNRESET' ||
						reason.code === 'ENOTFOUND' ||
						reason.code === 'ECONNREFUSED')))) ||
		(reason &&
			typeof reason === 'object' &&
			reason !== null &&
			'error' in reason &&
			reason.error instanceof Error &&
			(('code' in reason.error &&
				(reason.error.code === 'ETIMEDOUT' ||
					reason.error.code === 'ECONNRESET' ||
					reason.error.code === 'ENOTFOUND' ||
					reason.error.code === 'ECONNREFUSED')) ||
				reason.error.message.includes('ETIMEDOUT') ||
				reason.error.message.includes('ECONNRESET') ||
				reason.error.message.includes('ENOTFOUND') ||
				reason.error.message.includes('ECONNREFUSED'))) ||
		// Handle AggregateError cases
		(reason &&
			typeof reason === 'object' &&
			reason !== null &&
			'error' in reason &&
			reason.error &&
			typeof reason.error === 'object' &&
			reason.error !== null &&
			'code' in reason.error &&
			reason.error.code === 'ETIMEDOUT');

	if (isNetworkError) {
		console.warn('⚠️  Network error detected, continuing server operation...');
		console.warn('⚠️  Consider checking network connectivity to external services');
		return;
	}

	console.error('🛑 Shutting down due to unhandled promise rejection');
	process.exit(1);
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const checkDatabaseConnection = async (): Promise<void> => {
	try {
		await prisma.$connect();
		console.log('✅ Database connected successfully');
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		throw error;
	}
};

const startServer = async (): Promise<void> => {
	try {
		await checkDatabaseConnection();

		const server = app.listen(PORT, () => {
			console.log('🚀 Server Configuration:');
			console.log(`   Environment: ${NODE_ENV}`);
			console.log(`   Port: ${PORT}`);
			console.log(`   API Base URL: http://localhost:${PORT}/api`);
			console.log(`   Health Check: http://localhost:${PORT}/health`);
			console.log(`   API Documentation: http://localhost:${PORT}/api/docs`);
			console.log('🎉 Server is running successfully!');
		});

		server.on('error', (error: NodeJS.ErrnoException) => {
			if (error.code === 'EADDRINUSE') {
				console.error(`❌ Port ${PORT} is already in use`);
			} else {
				console.error('❌ Server error:', error);
			}
			process.exit(1);
		});
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
