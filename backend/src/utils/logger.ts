import winston from "winston";
import path from "path";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(
	({ level, message, timestamp, requestId, stack, ...meta }) => {
		let log = `${timestamp} [${level}]`;
		if (requestId) {
			log += ` [${requestId}]`;
		}
		log += `: ${message}`;

		if (Object.keys(meta).length > 0) {
			log += ` ${JSON.stringify(meta)}`;
		}

		if (stack) {
			log += `\n${stack}`;
		}

		return log;
	}
);

// Create logs directory path
const logsDir = path.join(__dirname, "../../logs");

// Create the logger instance
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		errors({ stack: true }),
		logFormat
	),
	defaultMeta: { service: "complaint-portal-api" },
	transports: [
		// Console transport for development
		new winston.transports.Console({
			format: combine(
				colorize({ all: true }),
				timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				logFormat
			),
		}),
		// File transport for errors
		new winston.transports.File({
			filename: path.join(logsDir, "error.log"),
			level: "error",
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
		// File transport for all logs
		new winston.transports.File({
			filename: path.join(logsDir, "combined.log"),
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	],
});

// Create a child logger with request ID
export const createRequestLogger = (requestId: string) => {
	return logger.child({ requestId });
};

export default logger;
