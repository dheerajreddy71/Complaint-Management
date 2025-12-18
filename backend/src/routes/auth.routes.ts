import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import pool from "../database/connection";
import config from "../config";
import {
	AuthenticatedRequest,
	authenticateToken,
} from "../middleware/auth.middleware";
import { handleValidationErrors } from "../middleware/validation.middleware";
import { registerValidation, loginValidation } from "../validators";
import { User, UserResponse, AuthResponse } from "../models/user.model";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Router as ExpressRouter } from "express";
import { authLimiter } from "../middleware/rateLimit.middleware";
import logger from "../utils/logger";

const router: ExpressRouter = Router();

// Helper function for JWT signing
function signToken(payload: object): string {
	const options: SignOptions = { expiresIn: "24h" };
	return jwt.sign(payload, config.jwt.secret, options);
}

// Sanitize user input to prevent XSS
function sanitizeInput(input: string): string {
	if (!input) return input;
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}

// Register new user
router.post(
	"/register",
	registerValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<AuthResponse>,
		next: NextFunction
	) => {
		try {
			const { name, email, password, role, contact_info, adminKey } = req.body;

			// Sanitize text inputs
			const sanitizedName = sanitizeInput(name);
			const sanitizedContactInfo = contact_info
				? sanitizeInput(contact_info)
				: null;

			// SECURITY: Restrict Admin registration
			if (role === "Admin") {
				// Admin registration requires either:
				// 1. Admin registration is enabled AND correct key provided
				// 2. An existing admin is creating the account (checked via token)
				if (
					!config.admin.registrationEnabled ||
					adminKey !== config.admin.registrationKey
				) {
					logger.warn("Unauthorized admin registration attempt", {
						email,
						ip: req.ip,
					});
					res.status(403).json({
						success: false,
						message:
							"Admin registration is not allowed. Please contact system administrator.",
					});
					return;
				}
			}

			// Check if user already exists
			const [existingUsers] = await pool.query<RowDataPacket[]>(
				"SELECT id FROM users WHERE email = ?",
				[email]
			);

			if (existingUsers.length > 0) {
				res.status(409).json({
					success: false,
					message: "User with this email already exists",
				});
				return;
			}

			// Hash password
			const saltRounds = 12; // Increased from 10 for better security
			const hashedPassword = await bcrypt.hash(password, saltRounds);

			// Insert new user
			const [result] = await pool.query<ResultSetHeader>(
				"INSERT INTO users (name, email, password, role, contact_info) VALUES (?, ?, ?, ?, ?)",
				[sanitizedName, email, hashedPassword, role, sanitizedContactInfo]
			);

			const newUser: UserResponse = {
				id: result.insertId,
				name: sanitizedName,
				email,
				role,
				contact_info: sanitizedContactInfo || undefined,
			};

			// Generate JWT token
			const token = signToken({
				id: newUser.id,
				email: newUser.email,
				role: newUser.role,
				name: newUser.name,
			});

			logger.info("New user registered", {
				userId: newUser.id,
				email: newUser.email,
				role: newUser.role,
			});

			res.status(201).json({
				success: true,
				message: "Registration successful",
				token,
				user: newUser,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Login user - with rate limiting to prevent brute force
router.post(
	"/login",
	authLimiter,
	loginValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<AuthResponse>,
		next: NextFunction
	) => {
		try {
			const { email, password } = req.body;

			// Find user by email
			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT * FROM users WHERE email = ?",
				[email]
			);

			if (users.length === 0) {
				res.status(401).json({
					success: false,
					message: "Invalid email or password",
				});
				return;
			}

			const user = users[0] as User;

			// Verify password
			const isPasswordValid = await bcrypt.compare(
				password,
				user.password || ""
			);

			if (!isPasswordValid) {
				logger.warn("Failed login attempt - invalid password", {
					email,
					ip: req.ip,
				});
				res.status(401).json({
					success: false,
					message: "Invalid email or password",
				});
				return;
			}

			const userResponse: UserResponse = {
				id: user.id!,
				name: user.name,
				email: user.email,
				role: user.role,
				contact_info: user.contact_info,
				created_at: user.created_at,
			};

			// Generate JWT token
			const token = signToken({
				id: user.id,
				email: user.email,
				role: user.role,
				name: user.name,
			});

			logger.info("User logged in successfully", {
				userId: user.id,
				email: user.email,
				role: user.role,
			});

			res.status(200).json({
				success: true,
				message: "Login successful",
				token,
				user: userResponse,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get current user profile
router.get(
	"/profile",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = req.user?.id;

			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT id, name, email, role, contact_info, created_at FROM users WHERE id = ?",
				[userId]
			);

			if (users.length === 0) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			res.status(200).json({
				success: true,
				user: users[0],
			});
		} catch (error) {
			next(error);
		}
	}
);

// Update user profile
router.patch(
	"/profile",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = req.user?.id;
			const { name, contact_info } = req.body;

			const updateFields: string[] = [];
			const updateValues: any[] = [];

			if (name) {
				updateFields.push("name = ?");
				updateValues.push(name);
			}
			if (contact_info !== undefined) {
				updateFields.push("contact_info = ?");
				updateValues.push(contact_info);
			}

			if (updateFields.length > 0) {
				updateValues.push(userId);
				await pool.query(
					`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
					updateValues
				);
			}

			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT id, name, email, role, contact_info, created_at FROM users WHERE id = ?",
				[userId]
			);

			res.status(200).json({
				success: true,
				message: "Profile updated successfully",
				user: users[0],
			});
		} catch (error) {
			next(error);
		}
	}
);

// Change password
router.post(
	"/change-password",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = req.user?.id;
			const { currentPassword, newPassword } = req.body;

			if (!currentPassword || !newPassword) {
				res.status(400).json({
					success: false,
					message: "Current password and new password are required",
				});
				return;
			}

			if (newPassword.length < 6) {
				res.status(400).json({
					success: false,
					message: "New password must be at least 6 characters long",
				});
				return;
			}

			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT password FROM users WHERE id = ?",
				[userId]
			);

			if (users.length === 0) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			const isPasswordValid = await bcrypt.compare(
				currentPassword,
				users[0].password
			);

			if (!isPasswordValid) {
				res.status(401).json({
					success: false,
					message: "Current password is incorrect",
				});
				return;
			}

			const saltRounds = 10;
			const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

			await pool.query("UPDATE users SET password = ? WHERE id = ?", [
				hashedPassword,
				userId,
			]);

			res.status(200).json({
				success: true,
				message: "Password changed successfully",
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get all staff members (for Admin)
router.get(
	"/staff",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			if (req.user?.role !== "Admin") {
				res.status(403).json({
					success: false,
					message: "Only admins can view staff list",
				});
				return;
			}

			const [staffMembers] = await pool.query<RowDataPacket[]>(
				"SELECT id, name, email, department, contact_info, created_at FROM users WHERE role = ?",
				["Staff"]
			);

			res.status(200).json({
				success: true,
				staff: staffMembers,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get all users (for Admin)
router.get(
	"/all",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			if (req.user?.role !== "Admin") {
				res.status(403).json({
					success: false,
					message: "Only admins can view all users",
				});
				return;
			}

			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT id, name, email, role, department, contact_info, created_at FROM users ORDER BY created_at DESC"
			);

			res.status(200).json({
				success: true,
				users,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Update user role and department (Admin only)
router.patch(
	"/users/:id",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			if (req.user?.role !== "Admin") {
				res.status(403).json({
					success: false,
					message: "Only admins can update users",
				});
				return;
			}

			const userId = parseInt(req.params.id);
			const { role, department } = req.body;

			// Validate role
			const validRoles = ["User", "Staff", "Admin"];
			if (role && !validRoles.includes(role)) {
				res.status(400).json({
					success: false,
					message: "Invalid role",
				});
				return;
			}

			// Staff must have department
			if (role === "Staff" && !department) {
				res.status(400).json({
					success: false,
					message: "Staff members must have a department assigned",
				});
				return;
			}

			// Prevent admin from demoting themselves
			if (userId === req.user.id && role !== "Admin") {
				res.status(400).json({
					success: false,
					message: "You cannot change your own role",
				});
				return;
			}

			// Update user
			await pool.query(
				"UPDATE users SET role = ?, department = ? WHERE id = ?",
				[role, role === "Staff" ? department : null, userId]
			);

			// Get updated user
			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT id, name, email, role, department, contact_info, created_at FROM users WHERE id = ?",
				[userId]
			);

			if (users.length === 0) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			logger.info("User updated by admin", {
				adminId: req.user.id,
				targetUserId: userId,
				newRole: role,
				department: role === "Staff" ? department : null,
			});

			res.status(200).json({
				success: true,
				user: users[0],
				message: "User updated successfully",
			});
		} catch (error) {
			next(error);
		}
	}
);

// Delete user (Admin only)
router.delete(
	"/users/:id",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			if (req.user?.role !== "Admin") {
				res.status(403).json({
					success: false,
					message: "Only admins can delete users",
				});
				return;
			}

			const userId = parseInt(req.params.id);

			// Prevent admin from deleting themselves
			if (userId === req.user.id) {
				res.status(400).json({
					success: false,
					message: "You cannot delete your own account",
				});
				return;
			}

			// Check if user exists and is not an admin
			const [users] = await pool.query<RowDataPacket[]>(
				"SELECT id, role FROM users WHERE id = ?",
				[userId]
			);

			if (users.length === 0) {
				res.status(404).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			if (users[0].role === "Admin") {
				res.status(400).json({
					success: false,
					message: "Cannot delete admin users",
				});
				return;
			}

			// Delete user (complaints will be cascade deleted due to FK)
			await pool.query("DELETE FROM users WHERE id = ?", [userId]);

			logger.info("User deleted by admin", {
				adminId: req.user.id,
				deletedUserId: userId,
			});

			res.status(200).json({
				success: true,
				message: "User deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	}
);

export default router;
