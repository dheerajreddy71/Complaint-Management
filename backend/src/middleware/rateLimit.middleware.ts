import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import logger from "../utils/logger";

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // 100 requests per windowMs
	message: {
		success: false,
		message:
			"Too many requests from this IP, please try again after 15 minutes",
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	handler: (req: Request, res: Response) => {
		logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
			ip: req.ip,
			path: req.path,
		});
		res.status(429).json({
			success: false,
			message:
				"Too many requests from this IP, please try again after 15 minutes",
		});
	},
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits each IP to 5 login attempts per 15 minutes to prevent brute force
 */
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per windowMs
	message: {
		success: false,
		message: "Too many login attempts, please try again after 15 minutes",
	},
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true, // Don't count successful logins
	handler: (req: Request, res: Response) => {
		logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
			ip: req.ip,
			path: req.path,
			email: req.body?.email,
		});
		res.status(429).json({
			success: false,
			message: "Too many login attempts, please try again after 15 minutes",
		});
	},
});

/**
 * Upload rate limiter
 * Limits file uploads to 10 per hour per IP
 */
export const uploadLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // 10 uploads per hour
	message: {
		success: false,
		message: "Too many file uploads, please try again after an hour",
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req: Request, res: Response) => {
		logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`, {
			ip: req.ip,
		});
		res.status(429).json({
			success: false,
			message: "Too many file uploads, please try again after an hour",
		});
	},
});
