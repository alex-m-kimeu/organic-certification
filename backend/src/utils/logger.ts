/* eslint-disable no-console */
/**
 * Application logging utility
 * Provides structured logging for the application
 */

export enum LogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug',
}

interface LogContext {
	[key: string]: string | number | boolean | null | undefined | LogContext;
}

class Logger {
	private isProduction = process.env.NODE_ENV === 'production';

	private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
		const timestamp = new Date().toISOString();
		const baseLog = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

		if (context && Object.keys(context).length > 0) {
			return `${baseLog} ${JSON.stringify(context)}`;
		}

		return baseLog;
	}

	private log(level: LogLevel, message: string, context?: LogContext): void {
		const formattedMessage = this.formatMessage(level, message, context);
		switch (level) {
			case LogLevel.ERROR:
				console.error(formattedMessage);
				break;
			case LogLevel.WARN:
				console.warn(formattedMessage);
				break;
			case LogLevel.INFO:
				console.info(formattedMessage);
				break;
			case LogLevel.DEBUG:
				if (!this.isProduction) {
					console.debug(formattedMessage);
				}
				break;
			default:
				console.log(formattedMessage);
		}
	}

	error(message: string, context?: LogContext): void {
		this.log(LogLevel.ERROR, message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log(LogLevel.WARN, message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log(LogLevel.INFO, message, context);
	}

	debug(message: string, context?: LogContext): void {
		this.log(LogLevel.DEBUG, message, context);
	}
}

export const logger = new Logger();

export const { error, warn, info, debug } = logger;

export default logger;
