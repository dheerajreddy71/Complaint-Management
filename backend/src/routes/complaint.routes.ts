import { Router, Response, NextFunction } from "express";
import pool from "../database/connection";
import {
	AuthenticatedRequest,
	authenticateToken,
	authorizeRoles,
} from "../middleware/auth.middleware";
import { handleValidationErrors } from "../middleware/validation.middleware";
import {
	createComplaintValidation,
	updateComplaintValidation,
	assignComplaintValidation,
	feedbackValidation,
	idParamValidation,
} from "../validators";
import {
	ComplaintResponse,
	ComplaintStats,
	ComplaintStatus,
	ComplaintPriority,
	PRIORITY_DEADLINE_HOURS,
} from "../models/complaint.model";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Router as ExpressRouter } from "express";
import logger from "../utils/logger";

const router: ExpressRouter = Router();

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

// Pagination interface
interface PaginationParams {
	page: number;
	limit: number;
	offset: number;
}

// Parse pagination parameters from query
function parsePaginationParams(query: any): PaginationParams {
	const page = Math.max(1, parseInt(query.page as string, 10) || 1);
	const limit = Math.min(
		100,
		Math.max(1, parseInt(query.limit as string, 10) || 10)
	);
	const offset = (page - 1) * limit;
	return { page, limit, offset };
}

// Status transition validation
const validStatusTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
	Open: ["Assigned"],
	Assigned: ["In-progress"],
	"In-progress": ["Resolved"],
	Resolved: [],
};

function isValidStatusTransition(
	currentStatus: ComplaintStatus,
	newStatus: ComplaintStatus
): boolean {
	return validStatusTransitions[currentStatus]?.includes(newStatus) || false;
}

// Calculate deadline based on priority
function calculateDeadline(priority: ComplaintPriority): Date {
	const hours = PRIORITY_DEADLINE_HOURS[priority] || 72;
	const deadline = new Date();
	deadline.setHours(deadline.getHours() + hours);
	return deadline;
}

// Create a new complaint (User only)
router.post(
	"/",
	authenticateToken,
	authorizeRoles("User"),
	createComplaintValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<ComplaintResponse>,
		next: NextFunction
	) => {
		try {
			const {
				title,
				description,
				category,
				priority = "Medium",
				location,
				attachments,
			} = req.body;
			const userId = req.user?.id;
			const deadline = calculateDeadline(priority);

			// Sanitize text inputs
			const sanitizedTitle = sanitizeInput(title);
			const sanitizedDescription = sanitizeInput(description);
			const sanitizedLocation = location ? sanitizeInput(location) : null;

			const [result] = await pool.query<ResultSetHeader>(
				`INSERT INTO complaints (user_id, title, description, category, priority, location, attachments, status, deadline_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?)`,
				[
					userId,
					sanitizedTitle,
					sanitizedDescription,
					category,
					priority,
					sanitizedLocation,
					attachments || null,
					deadline,
				]
			);

			const [complaints] = await pool.query<RowDataPacket[]>(
				`SELECT c.*, u.name as user_name, u.email as user_email 
                 FROM complaints c 
                 JOIN users u ON c.user_id = u.id 
                 WHERE c.id = ?`,
				[result.insertId]
			);

			logger.info("New complaint created", {
				complaintId: result.insertId,
				userId,
				category,
				priority,
			});

			res.status(201).json({
				success: true,
				message: "Complaint registered successfully",
				complaint: complaints[0] as any,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get complaints (filtered by role) with pagination
router.get(
	"/",
	authenticateToken,
	async (
		req: AuthenticatedRequest,
		res: Response<ComplaintResponse>,
		next: NextFunction
	) => {
		try {
			const userRole = req.user?.role;
			const userId = req.user?.id;
			const { page, limit, offset } = parsePaginationParams(req.query);

			// Optional filters from query params
			const { status, category, priority, search } = req.query;

			let baseQuery: string;
			let countQuery: string;
			let params: any[] = [];
			let countParams: any[] = [];
			let whereConditions: string[] = [];

			// Base query parts
			const selectFields = `
				c.*, u.name as user_name, u.email as user_email,
				s.name as staff_name
			`;
			const fromClause = `
				FROM complaints c 
				JOIN users u ON c.user_id = u.id 
				LEFT JOIN users s ON c.staff_id = s.id
			`;

			// Role-based filtering
			if (userRole === "Admin") {
				// Admin sees all complaints - no additional where clause
			} else if (userRole === "Staff") {
				whereConditions.push("c.staff_id = ?");
				params.push(userId);
				countParams.push(userId);
			} else {
				// Regular users see only their complaints
				whereConditions.push("c.user_id = ?");
				params.push(userId);
				countParams.push(userId);
			}

			// Optional filters
			if (status && typeof status === "string") {
				whereConditions.push("c.status = ?");
				params.push(status);
				countParams.push(status);
			}

			if (category && typeof category === "string") {
				whereConditions.push("c.category = ?");
				params.push(category);
				countParams.push(category);
			}

			if (priority && typeof priority === "string") {
				whereConditions.push("c.priority = ?");
				params.push(priority);
				countParams.push(priority);
			}

			if (search && typeof search === "string") {
				whereConditions.push("(c.title LIKE ? OR c.description LIKE ?)");
				const searchTerm = `%${search}%`;
				params.push(searchTerm, searchTerm);
				countParams.push(searchTerm, searchTerm);
			}

			// Build final queries
			const whereClause =
				whereConditions.length > 0
					? "WHERE " + whereConditions.join(" AND ")
					: "";

			baseQuery = `
				SELECT ${selectFields}
				${fromClause}
				${whereClause}
				ORDER BY c.created_at DESC
				LIMIT ? OFFSET ?
			`;
			params.push(limit, offset);

			countQuery = `
				SELECT COUNT(*) as total
				${fromClause}
				${whereClause}
			`;

			// Execute queries
			const [complaints] = await pool.query<RowDataPacket[]>(baseQuery, params);
			const [countResult] = await pool.query<RowDataPacket[]>(
				countQuery,
				countParams
			);

			const total = countResult[0]?.total || 0;
			const totalPages = Math.ceil(total / limit);

			res.status(200).json({
				success: true,
				message: "Complaints retrieved successfully",
				complaints: complaints as any[],
				pagination: {
					page,
					limit,
					total,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get single complaint by ID
router.get(
	"/:id",
	authenticateToken,
	idParamValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<ComplaintResponse>,
		next: NextFunction
	) => {
		try {
			const complaintId = parseInt(req.params.id, 10);
			const userRole = req.user?.role;
			const userId = req.user?.id;

			const [complaints] = await pool.query<RowDataPacket[]>(
				`SELECT c.*, u.name as user_name, u.email as user_email,
                        s.name as staff_name
                 FROM complaints c 
                 JOIN users u ON c.user_id = u.id 
                 LEFT JOIN users s ON c.staff_id = s.id
                 WHERE c.id = ?`,
				[complaintId]
			);

			if (complaints.length === 0) {
				res.status(404).json({
					success: false,
					message: "Complaint not found",
				});
				return;
			}

			const complaint = complaints[0];

			// Check access rights
			if (userRole === "User" && complaint.user_id !== userId) {
				res.status(403).json({
					success: false,
					message: "You can only view your own complaints",
				});
				return;
			}

			if (userRole === "Staff" && complaint.staff_id !== userId) {
				res.status(403).json({
					success: false,
					message: "This complaint is not assigned to you",
				});
				return;
			}

			res.status(200).json({
				success: true,
				message: "Complaint retrieved successfully",
				complaint: complaint as any,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Update complaint status (Staff/Admin)
router.patch(
	"/:id/status",
	authenticateToken,
	authorizeRoles("Staff", "Admin"),
	updateComplaintValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<ComplaintResponse>,
		next: NextFunction
	) => {
		try {
			const complaintId = parseInt(req.params.id, 10);
			const { status, resolution_notes } = req.body;
			const userRole = req.user?.role;
			const userId = req.user?.id;

			// Get current complaint
			const [complaints] = await pool.query<RowDataPacket[]>(
				"SELECT * FROM complaints WHERE id = ?",
				[complaintId]
			);

			if (complaints.length === 0) {
				res.status(404).json({
					success: false,
					message: "Complaint not found",
				});
				return;
			}

			const complaint = complaints[0];

			// Staff can only update their assigned complaints
			if (userRole === "Staff" && complaint.staff_id !== userId) {
				res.status(403).json({
					success: false,
					message: "This complaint is not assigned to you",
				});
				return;
			}

			// Validate status transition
			if (status && !isValidStatusTransition(complaint.status, status)) {
				res.status(400).json({
					success: false,
					message: `Invalid status transition from ${
						complaint.status
					} to ${status}. Valid next status: ${
						validStatusTransitions[complaint.status as ComplaintStatus].join(
							", "
						) || "None"
					}`,
				});
				return;
			}

			// Update complaint
			const updateFields: string[] = [];
			const updateValues: any[] = [];

			if (status) {
				updateFields.push("status = ?");
				updateValues.push(status);
			}

			if (resolution_notes) {
				updateFields.push("resolution_notes = ?");
				updateValues.push(resolution_notes);
			}

			if (updateFields.length > 0) {
				updateValues.push(complaintId);
				await pool.query(
					`UPDATE complaints SET ${updateFields.join(", ")} WHERE id = ?`,
					updateValues
				);
			}

			// Get updated complaint
			const [updatedComplaints] = await pool.query<RowDataPacket[]>(
				`SELECT c.*, u.name as user_name, u.email as user_email,
                        s.name as staff_name
                 FROM complaints c 
                 JOIN users u ON c.user_id = u.id 
                 LEFT JOIN users s ON c.staff_id = s.id
                 WHERE c.id = ?`,
				[complaintId]
			);

			res.status(200).json({
				success: true,
				message: "Complaint status updated successfully",
				complaint: updatedComplaints[0] as any,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Assign complaint to staff (Admin only)
router.patch(
	"/:id/assign",
	authenticateToken,
	authorizeRoles("Admin"),
	assignComplaintValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<ComplaintResponse>,
		next: NextFunction
	) => {
		try {
			const complaintId = parseInt(req.params.id, 10);
			const { staff_id } = req.body;

			// Verify complaint exists
			const [complaints] = await pool.query<RowDataPacket[]>(
				"SELECT * FROM complaints WHERE id = ?",
				[complaintId]
			);

			if (complaints.length === 0) {
				res.status(404).json({
					success: false,
					message: "Complaint not found",
				});
				return;
			}

			// Verify staff exists and has Staff role
			const [staff] = await pool.query<RowDataPacket[]>(
				"SELECT * FROM users WHERE id = ? AND role = ?",
				[staff_id, "Staff"]
			);

			if (staff.length === 0) {
				res.status(404).json({
					success: false,
					message: "Staff member not found",
				});
				return;
			}

			// Update complaint
			await pool.query(
				"UPDATE complaints SET staff_id = ?, status = 'Assigned' WHERE id = ?",
				[staff_id, complaintId]
			);

			// Get updated complaint
			const [updatedComplaints] = await pool.query<RowDataPacket[]>(
				`SELECT c.*, u.name as user_name, u.email as user_email,
                        s.name as staff_name
                 FROM complaints c 
                 JOIN users u ON c.user_id = u.id 
                 LEFT JOIN users s ON c.staff_id = s.id
                 WHERE c.id = ?`,
				[complaintId]
			);

			res.status(200).json({
				success: true,
				message: "Complaint assigned successfully",
				complaint: updatedComplaints[0] as any,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Add feedback to resolved complaint (User only)
router.patch(
	"/:id/feedback",
	authenticateToken,
	authorizeRoles("User"),
	feedbackValidation,
	handleValidationErrors,
	async (
		req: AuthenticatedRequest,
		res: Response<ComplaintResponse>,
		next: NextFunction
	) => {
		try {
			const complaintId = parseInt(req.params.id, 10);
			const { feedback, feedback_rating } = req.body;
			const userId = req.user?.id;

			// Get complaint
			const [complaints] = await pool.query<RowDataPacket[]>(
				"SELECT * FROM complaints WHERE id = ? AND user_id = ?",
				[complaintId, userId]
			);

			if (complaints.length === 0) {
				res.status(404).json({
					success: false,
					message: "Complaint not found or not yours",
				});
				return;
			}

			const complaint = complaints[0];

			if (complaint.status !== "Resolved") {
				res.status(400).json({
					success: false,
					message: "Feedback can only be given for resolved complaints",
				});
				return;
			}

			// Update feedback
			await pool.query(
				"UPDATE complaints SET feedback = ?, feedback_rating = ? WHERE id = ?",
				[feedback, feedback_rating, complaintId]
			);

			// Get updated complaint
			const [updatedComplaints] = await pool.query<RowDataPacket[]>(
				`SELECT c.*, u.name as user_name, u.email as user_email,
                        s.name as staff_name
                 FROM complaints c 
                 JOIN users u ON c.user_id = u.id 
                 LEFT JOIN users s ON c.staff_id = s.id
                 WHERE c.id = ?`,
				[complaintId]
			);

			res.status(200).json({
				success: true,
				message: "Feedback submitted successfully",
				complaint: updatedComplaints[0] as any,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get complaint statistics (Admin only)
router.get(
	"/stats/overview",
	authenticateToken,
	authorizeRoles("Admin"),
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			// Get total counts by status
			const [statusCounts] = await pool.query<RowDataPacket[]>(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
                    SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned_count,
                    SUM(CASE WHEN status = 'In-progress' THEN 1 ELSE 0 END) as in_progress_count,
                    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
                FROM complaints
            `);

			// Get counts by category
			const [categoryCounts] = await pool.query<RowDataPacket[]>(`
                SELECT category, COUNT(*) as count
                FROM complaints
                GROUP BY category
            `);

			// Get average resolution time
			const [avgResolution] = await pool.query<RowDataPacket[]>(`
                SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours
                FROM complaints
                WHERE status = 'Resolved'
            `);

			// Get average rating
			const [avgRating] = await pool.query<RowDataPacket[]>(`
                SELECT AVG(feedback_rating) as avg_rating
                FROM complaints
                WHERE feedback_rating IS NOT NULL
            `);

			const stats: ComplaintStats = {
				total: statusCounts[0].total || 0,
				open: statusCounts[0].open_count || 0,
				assigned: statusCounts[0].assigned_count || 0,
				inProgress: statusCounts[0].in_progress_count || 0,
				resolved: statusCounts[0].resolved_count || 0,
				byCategory: categoryCounts as any[],
			};

			res.status(200).json({
				success: true,
				stats,
				avgResolutionHours: avgResolution[0]?.avg_hours || 0,
				avgRating: avgRating[0]?.avg_rating || 0,
			});
		} catch (error) {
			next(error);
		}
	}
);

export default router;
