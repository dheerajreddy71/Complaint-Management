import { body, param, ValidationChain } from "express-validator";

export const registerValidation: ValidationChain[] = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("Name is required")
		.isLength({ min: 2, max: 100 })
		.withMessage("Name must be between 2 and 100 characters"),
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Please provide a valid email address")
		.normalizeEmail(),
	body("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 6 })
		.withMessage("Password must be at least 6 characters long"),
	body("role")
		.notEmpty()
		.withMessage("Role is required")
		.isIn(["User", "Staff", "Admin"])
		.withMessage("Role must be User, Staff, or Admin"),
	body("contact_info")
		.optional()
		.trim()
		.isLength({ max: 100 })
		.withMessage("Contact info cannot exceed 100 characters"),
];

export const loginValidation: ValidationChain[] = [
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Please provide a valid email address"),
	body("password").notEmpty().withMessage("Password is required"),
];

export const createComplaintValidation: ValidationChain[] = [
	body("title")
		.trim()
		.notEmpty()
		.withMessage("Title is required")
		.isLength({ min: 5, max: 200 })
		.withMessage("Title must be between 5 and 200 characters"),
	body("description")
		.trim()
		.notEmpty()
		.withMessage("Description is required")
		.isLength({ min: 10 })
		.withMessage("Description must be at least 10 characters long"),
	body("category")
		.notEmpty()
		.withMessage("Category is required")
		.isIn([
			"plumbing",
			"electrical",
			"facility",
			"cleaning",
			"security",
			"other",
		])
		.withMessage("Invalid category selected"),
	body("priority")
		.optional()
		.isIn(["Low", "Medium", "High", "Critical"])
		.withMessage("Invalid priority selected"),
	body("location")
		.optional()
		.trim()
		.isLength({ max: 200 })
		.withMessage("Location cannot exceed 200 characters"),
	body("attachments")
		.optional()
		.isString()
		.withMessage("Attachments must be a string (file path/URL)"),
];

export const updateComplaintValidation: ValidationChain[] = [
	param("id").isInt({ min: 1 }).withMessage("Invalid complaint ID"),
	body("status")
		.optional()
		.isIn(["Open", "Assigned", "In-progress", "Resolved"])
		.withMessage("Invalid status value"),
	body("resolution_notes")
		.optional()
		.trim()
		.isString()
		.withMessage("Resolution notes must be a string"),
	body("staff_id").optional().isInt({ min: 1 }).withMessage("Invalid staff ID"),
];

export const assignComplaintValidation: ValidationChain[] = [
	param("id").isInt({ min: 1 }).withMessage("Invalid complaint ID"),
	body("staff_id")
		.notEmpty()
		.withMessage("Staff ID is required")
		.isInt({ min: 1 })
		.withMessage("Invalid staff ID"),
];

export const feedbackValidation: ValidationChain[] = [
	param("id").isInt({ min: 1 }).withMessage("Invalid complaint ID"),
	body("feedback")
		.trim()
		.notEmpty()
		.withMessage("Feedback is required")
		.isLength({ min: 5 })
		.withMessage("Feedback must be at least 5 characters"),
	body("feedback_rating")
		.notEmpty()
		.withMessage("Rating is required")
		.isInt({ min: 1, max: 5 })
		.withMessage("Rating must be between 1 and 5"),
];

export const idParamValidation: ValidationChain[] = [
	param("id").isInt({ min: 1 }).withMessage("Invalid ID parameter"),
];
