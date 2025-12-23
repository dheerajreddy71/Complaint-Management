import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import { Complaint, ComplaintResponse } from "../../models/complaint.model";
import { User } from "../../models/user.model";
import { ConfirmDialogComponent } from "../shared/confirm-dialog/confirm-dialog.component";

@Component({
	selector: "app-admin-complaint-detail",
	templateUrl: "./admin-complaint-detail.component.html",
	styleUrls: ["./admin-complaint-detail.component.scss"],
})
export class AdminComplaintDetailComponent implements OnInit {
	complaint: Complaint | null = null;
	isLoading = true;
	isUpdating = false;

	staffMembers: User[] = [];
	selectedStaffId: number | null = null;
	selectedStatus = "";
	resolutionNotes = "";

	statusOptions = [
		"Pending",
		"Assigned",
		"In-progress",
		"Resolved",
		"Rejected",
	];

	// Category to Department mapping
	private categoryDepartmentMap: Record<string, string> = {
		plumbing: "Plumbing",
		electrical: "Electrical",
		facility: "Facility",
		cleaning: "Cleaning",
		security: "Security",
		other: "", // Shows all staff
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private complaintService: ComplaintService,
		private authService: AuthService,
		private snackBar: MatSnackBar,
		private dialog: MatDialog
	) {}

	ngOnInit(): void {
		this.loadStaffMembers();
		this.route.params.subscribe((params) => {
			const id = params["id"];
			if (id) {
				this.loadComplaint(id);
			}
		});
	}

	loadStaffMembers(): void {
		this.authService.getAllUsers().subscribe({
			next: (response) => {
				if (response.success && response.users) {
					this.staffMembers = response.users.filter(
						(u: User) => u.role === "Staff"
					);
				}
			},
			error: (error) => {
				this.snackBar.open(
					error?.error?.message || "Failed to load staff members",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	loadComplaint(id: number): void {
		this.isLoading = true;
		this.complaintService.getComplaintById(id).subscribe({
			next: (response) => {
				if (response.success && response.complaint) {
					this.complaint = response.complaint;
					this.selectedStatus = this.complaint.status;
					this.selectedStaffId = this.complaint.staff_id || null;
					this.resolutionNotes = this.complaint.resolution_notes || "";
				}
				this.isLoading = false;
			},
			error: () => {
				this.snackBar.open("Failed to load complaint", "Close", {
					duration: 3000,
				});
				this.isLoading = false;
				this.router.navigate(["/admin"]);
			},
		});
	}

	updateComplaint(): void {
		if (!this.complaint) return;

		// Show confirmation dialog for status changes
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			width: "400px",
			data: {
				title: "Update Complaint",
				message: `Are you sure you want to update this complaint? Status will be changed to "${this.selectedStatus}".`,
				confirmText: "Update",
				cancelText: "Cancel",
				confirmColor: "primary",
				icon: "edit",
			},
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result) {
				this.performUpdate();
			}
		});
	}

	private performUpdate(): void {
		if (!this.complaint) return;

		this.isUpdating = true;
		const updateData: any = {
			status: this.selectedStatus,
			resolution_notes: this.resolutionNotes,
		};

		if (this.selectedStaffId) {
			updateData.staff_id = this.selectedStaffId;
		}

		this.complaintService
			.updateComplaintStatus(this.complaint.id, updateData)
			.subscribe({
				next: (response: ComplaintResponse) => {
					if (response.success) {
						this.snackBar.open("Complaint updated successfully", "Close", {
							duration: 3000,
							panelClass: ["success-snackbar"],
						});
						this.loadComplaint(this.complaint!.id);
					}
					this.isUpdating = false;
				},
				error: (error) => {
					this.snackBar.open(
						error?.error?.message || "Failed to update complaint",
						"Close",
						{ duration: 5000, panelClass: ["error-snackbar"] }
					);
					this.isUpdating = false;
				},
			});
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	getPriorityColor(priority: string): string {
		const colors: Record<string, string> = {
			Low: "#28a745",
			Medium: "#ffc107",
			High: "#fd7e14",
			Critical: "#dc3545",
		};
		return colors[priority] || "#6c757d";
	}

	getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			Pending: "#ffc107",
			Assigned: "#17a2b8",
			"In-progress": "#007bff",
			Resolved: "#28a745",
			Rejected: "#dc3545",
		};
		return colors[status] || "#6c757d";
	}

	isOverdue(): boolean {
		if (!this.complaint?.deadline_at || this.complaint.status === "Resolved")
			return false;
		return new Date(this.complaint.deadline_at) < new Date();
	}

	getTimeRemaining(): string {
		if (!this.complaint?.deadline_at) return "";
		const deadline = new Date(this.complaint.deadline_at);
		const now = new Date();
		const diff = deadline.getTime() - now.getTime();

		if (diff < 0) {
			const overdueDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
			return `${overdueDays} day(s) overdue`;
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

		if (days > 0) return `${days}d ${hours}h remaining`;
		return `${hours}h remaining`;
	}

	getCategoryIcon(category: string): string {
		const icons: Record<string, string> = {
			IT: "computer",
			HR: "people",
			Facilities: "business",
			Finance: "attach_money",
			Other: "help_outline",
		};
		return icons[category] || "category";
	}

	/**
	 * Returns filtered staff members based on complaint category
	 * If category is "other", returns all staff
	 * Otherwise, returns staff whose department matches the category
	 */
	getFilteredStaff(): User[] {
		if (!this.complaint) return this.staffMembers;

		const category = this.complaint.category?.toLowerCase();
		const targetDepartment = this.categoryDepartmentMap[category];

		// If category is "other" or unknown, show all staff
		if (!targetDepartment) {
			return this.staffMembers;
		}

		// Filter staff by matching department
		return this.staffMembers.filter(
			(staff) =>
				staff.department?.toLowerCase() === targetDepartment.toLowerCase()
		);
	}

	isPdf(): boolean {
		if (!this.complaint?.attachments) return false;
		return this.complaint.attachments.toLowerCase().endsWith(".pdf");
	}

	getAttachmentUrl(): string {
		return this.complaint?.attachments || "";
	}

	goBack(): void {
		this.router.navigate(["/admin"]);
	}
}
