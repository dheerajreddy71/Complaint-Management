export type ComplaintCategory =
	| "plumbing"
	| "electrical"
	| "facility"
	| "cleaning"
	| "security"
	| "other";
export type ComplaintStatus = "Open" | "Assigned" | "In-progress" | "Resolved";
export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

// Priority to deadline hours mapping
export const PRIORITY_DEADLINE_HOURS: Record<ComplaintPriority, number> = {
	Low: 168, // 7 days
	Medium: 72, // 3 days
	High: 24, // 1 day
	Critical: 4, // 4 hours
};

export interface Complaint {
	id?: number;
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
	deadline_at?: Date | null;
	created_at?: Date;
	updated_at?: Date;
}

export interface ComplaintWithUser extends Complaint {
	user_name?: string;
	user_email?: string;
	staff_name?: string;
	is_overdue?: boolean;
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
	staff_id?: number;
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

export interface ComplaintResponse {
	success: boolean;
	message: string;
	complaint?: ComplaintWithUser;
	complaints?: ComplaintWithUser[];
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
