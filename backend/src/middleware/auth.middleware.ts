import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { UserResponse } from "../models/user.model";

export interface AuthenticatedRequest extends Request {
	user?: UserResponse;
}

interface JwtPayload {
	id: number;
	email: string;
	role: string;
	name: string;
}

export function authenticateToken(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		res
			.status(401)
			.json({ success: false, message: "Access token is required" });
		return;
	}

	try {
		const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
		req.user = {
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
			name: decoded.name,
		};
		next();
	} catch (error) {
		res
			.status(403)
			.json({ success: false, message: "Invalid or expired token" });
	}
}

export function authorizeRoles(...allowedRoles: string[]) {
	return (
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): void => {
		if (!req.user) {
			res
				.status(401)
				.json({ success: false, message: "Authentication required" });
			return;
		}

		if (!allowedRoles.includes(req.user.role)) {
			res.status(403).json({
				success: false,
				message: "You do not have permission to access this resource",
			});
			return;
		}

		next();
	};
}
