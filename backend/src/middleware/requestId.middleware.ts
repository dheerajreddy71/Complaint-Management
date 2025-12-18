import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger, { createRequestLogger } from "../utils/logger";

// Extend Express Request to include requestId and logger
declare global {
	namespace Express {
		interface Request {
			requestId: string;
			logger: typeof logger;
		}
	}
}

/**
 * Middleware to add unique request ID and logger to each request
 * This enables request tracing across all log entries
 */
export const requestIdMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Generate unique request ID or use existing one from header
	const requestId = (req.headers["x-request-id"] as string) || uuidv4();

	// Attach to request object
	req.requestId = requestId;
	req.logger = createRequestLogger(requestId);

	// Add to response header for client-side debugging
	res.setHeader("X-Request-ID", requestId);

	// Log incoming request
	req.logger.info(`Incoming ${req.method} ${req.originalUrl}`, {
		method: req.method,
		url: req.originalUrl,
		ip: req.ip,
		userAgent: req.get("user-agent"),
	});

	// Log response on finish
	const startTime = Date.now();
	res.on("finish", () => {
		const duration = Date.now() - startTime;
		const level = res.statusCode >= 400 ? "warn" : "info";

		req.logger.log(level, `Response ${res.statusCode} sent`, {
			statusCode: res.statusCode,
			duration: `${duration}ms`,
		});
	});

	next();
};
