import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import config from "../config";

export interface AppError extends Error {
	statusCode?: number;
	status?: string;
}

export function errorHandler(
	err: AppError,
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const statusCode = err.statusCode || 500;
	const status = err.status || "error";

	// Use request logger if available, otherwise use main logger
	const log = req.logger || logger;

	log.error("Request error", {
		error: err.message,
		statusCode,
		path: req.path,
		method: req.method,
		ip: req.ip,
		userId: (req as any).user?.id,
		stack: config.nodeEnv === "development" ? err.stack : undefined,
	});

	// Don't expose stack traces in production
	const response: any = {
		success: false,
		status,
		message: err.message || "Internal server error",
		requestId: req.requestId,
	};

	// Only include stack trace in development
	if (config.nodeEnv === "development") {
		response.stack = err.stack;
	}

	res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
	const log = req.logger || logger;
	log.warn("Route not found", {
		path: req.originalUrl,
		method: req.method,
		ip: req.ip,
	});

	res.status(404).json({
		success: false,
		message: `Route ${req.originalUrl} not found`,
		requestId: req.requestId,
	});
}

export class CustomError extends Error {
	statusCode: number;
	status: string;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
		Error.captureStackTrace(this, this.constructor);
	}
}
