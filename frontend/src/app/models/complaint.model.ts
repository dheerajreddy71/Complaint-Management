export type ComplaintCategory =
	| "plumbing"
	| "electrical"
	| "facility"
	| "cleaning"
	| "security"
	| "other";
export type ComplaintStatus = "Open" | "Assigned" | "In-progress" | "Resolved";
export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export interface Complaint {
	id: number;
	user_id: number;
	staff_id?: number | null;
	title: string;
	description: string;
	category: ComplaintCategory;
	priority: ComplaintPriority;
	location?: string | null;
	status: ComplaintStatus;
	attachments?: string | null;
	resolution_notes?: string | null;
	feedback?: string | null;
	feedback_rating?: number | null;
	deadline_at?: Date | string | null;
	created_at?: Date;
	updated_at?: Date;
	user_name?: string;
	user_email?: string;
	staff_name?: string;
}

export interface CreateComplaintRequest {
	title: string;
	description: string;
	category: ComplaintCategory;
	priority?: ComplaintPriority;
	location?: string;
	attachments?: string;
}

export interface UpdateComplaintRequest {
	status?: ComplaintStatus;
	resolution_notes?: string;
}

export interface AssignComplaintRequest {
	staff_id: number;
}

export interface FeedbackRequest {
	feedback: string;
	feedback_rating: number;
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface ComplaintQueryParams {
	page?: number;
	limit?: number;
	status?: string;
	category?: string;
	priority?: string;
	search?: string;
}

export interface ComplaintResponse {
	success: boolean;
	message: string;
	complaint?: Complaint;
	complaints?: Complaint[];
	pagination?: PaginationInfo;
}

export interface ComplaintStats {
	total: number;
	open: number;
	assigned: number;
	inProgress: number;
	resolved: number;
	byCategory: { category: string; count: number }[];
}

export interface StatsResponse {
	success: boolean;
	stats: ComplaintStats;
	avgResolutionHours: number;
	avgRating: number;
}

export const COMPLAINT_CATEGORIES: {
	value: ComplaintCategory;
	label: string;
	icon: string;
}[] = [
	{ value: "plumbing", label: "Plumbing", icon: "plumbing" },
	{ value: "electrical", label: "Electrical", icon: "electrical_services" },
	{ value: "facility", label: "Facility", icon: "business" },
	{ value: "cleaning", label: "Cleaning", icon: "cleaning_services" },
	{ value: "security", label: "Security", icon: "security" },
	{ value: "other", label: "Other", icon: "more_horiz" },
];

export const STATUS_FLOW: ComplaintStatus[] = [
	"Open",
	"Assigned",
	"In-progress",
	"Resolved",
];

export const PRIORITY_OPTIONS: {
	value: ComplaintPriority;
	label: string;
	icon: string;
	color: string;
}[] = [
	{ value: "Low", label: "Low", icon: "arrow_downward", color: "#28a745" },
	{ value: "Medium", label: "Medium", icon: "remove", color: "#ffc107" },
	{ value: "High", label: "High", icon: "arrow_upward", color: "#fd7e14" },
	{
		value: "Critical",
		label: "Critical",
		icon: "priority_high",
		color: "#dc3545",
	},
];
