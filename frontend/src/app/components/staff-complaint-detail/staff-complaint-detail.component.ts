import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import {
	Complaint,
	ComplaintStatus,
	PRIORITY_OPTIONS,
} from "../../models/complaint.model";
import { User } from "../../models/user.model";
import { ConfirmDialogComponent } from "../shared/confirm-dialog/confirm-dialog.component";

@Component({
	selector: "app-staff-complaint-detail",
	templateUrl: "./staff-complaint-detail.component.html",
	styleUrls: ["./staff-complaint-detail.component.scss"],
})
export class StaffComplaintDetailComponent implements OnInit {
	user: User | null = null;
	complaint: Complaint | null = null;
	isLoading = true;
	isUpdating = false;
	complaintId: number = 0;

	resolutionNotes = "";
	newStatus: ComplaintStatus = "Assigned";
	priorities = PRIORITY_OPTIONS;

	statusOptions: ComplaintStatus[] = ["Assigned", "In-progress", "Resolved"];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private complaintService: ComplaintService,
		private authService: AuthService,
		private snackBar: MatSnackBar,
		private dialog: MatDialog
	) {}

	ngOnInit(): void {
		this.user = this.authService.getCurrentUser();
		this.route.params.subscribe((params) => {
			this.complaintId = +params["id"];
			this.loadComplaint();
		});
	}

	loadComplaint(): void {
		this.isLoading = true;
		this.complaintService.getComplaintById(this.complaintId).subscribe({
			next: (response) => {
				if (response.success && response.complaint) {
					this.complaint = response.complaint;
					this.resolutionNotes = this.complaint.resolution_notes || "";
					this.newStatus = this.complaint.status;
				}
				this.isLoading = false;
			},
			error: () => {
				this.snackBar.open("Failed to load complaint", "Close", {
					duration: 3000,
				});
				this.isLoading = false;
				this.router.navigate(["/staff"]);
			},
		});
	}

	updateStatus(): void {
		if (!this.complaint) return;

		// Show confirmation dialog
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			width: "400px",
			data: {
				title: "Update Status",
				message: `Are you sure you want to update the status to "${
					this.newStatus
				}"?${
					this.newStatus === "Resolved"
						? " This will mark the complaint as resolved."
						: ""
				}`,
				confirmText: "Update",
				cancelText: "Cancel",
				confirmColor: this.newStatus === "Resolved" ? "accent" : "primary",
				icon: this.newStatus === "Resolved" ? "check_circle" : "edit",
			},
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result) {
				this.performStatusUpdate();
			}
		});
	}

	private performStatusUpdate(): void {
		if (!this.complaint) return;

		this.isUpdating = true;
		this.complaintService
			.updateComplaintStatus(this.complaint.id, {
				status: this.newStatus,
				resolution_notes: this.resolutionNotes,
			})
			.subscribe({
				next: (response) => {
					if (response.success) {
						this.snackBar.open("Complaint updated successfully!", "Close", {
							duration: 3000,
							panelClass: ["success-snackbar"],
						});
						this.loadComplaint();
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

	goBack(): void {
		this.router.navigate(["/staff"]);
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
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
			Open: "#ffc107",
			Assigned: "#17a2b8",
			"In-progress": "#007bff",
			Resolved: "#28a745",
		};
		return colors[status] || "#6c757d";
	}

	isOverdue(): boolean {
		if (
			!this.complaint ||
			this.complaint.status === "Resolved" ||
			!this.complaint.deadline_at
		)
			return false;
		return new Date(this.complaint.deadline_at) < new Date();
	}

	getTimeRemaining(): string {
		if (!this.complaint?.deadline_at) return "No deadline";
		const now = new Date();
		const deadlineDate = new Date(this.complaint.deadline_at);
		const diff = deadlineDate.getTime() - now.getTime();

		if (diff < 0) {
			const overdueDiff = Math.abs(diff);
			const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
			const days = Math.floor(hours / 24);
			if (days > 0) return `Overdue by ${days} day(s)`;
			return `Overdue by ${hours} hour(s)`;
		}

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);
		if (days > 0) return `${days} day(s) remaining`;
		if (hours > 0) return `${hours} hour(s) remaining`;
		return "Less than an hour";
	}

	getCategoryIcon(category: string): string {
		const icons: Record<string, string> = {
			plumbing: "plumbing",
			electrical: "electrical_services",
			facility: "business",
			cleaning: "cleaning_services",
			security: "security",
			other: "more_horiz",
		};
		return icons[category] || "category";
	}

	isPdf(url: string): boolean {
		return url?.toLowerCase().includes(".pdf");
	}

	getAttachmentUrl(): string {
		if (!this.complaint?.attachments) return "";
		const url = this.complaint.attachments;
		if (this.isPdf(url)) {
			return `https://docs.google.com/viewer?url=${encodeURIComponent(
				url
			)}&embedded=true`;
		}
		return url;
	}
}
