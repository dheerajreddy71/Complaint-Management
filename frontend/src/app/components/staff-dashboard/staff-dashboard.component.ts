import { Component, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import {
	Complaint,
	ComplaintStatus,
	PRIORITY_OPTIONS,
} from "../../models/complaint.model";
import { User } from "../../models/user.model";

@Component({
	selector: "app-staff-dashboard",
	templateUrl: "./staff-dashboard.component.html",
	styleUrls: ["./staff-dashboard.component.scss"],
})
export class StaffDashboardComponent implements OnInit {
	@ViewChild("complaintsPaginator") complaintsPaginator!: MatPaginator;

	user: User | null = null;
	complaints: Complaint[] = [];
	filteredComplaints: Complaint[] = [];
	pagedComplaints: Complaint[] = [];
	pageSize = 9;
	pageIndex = 0;
	pageSizeOptions = [6, 9, 12, 24];
	isLoading = true;
	selectedComplaint: Complaint | null = null;
	statusFilter = "all";
	isUpdating = false;
	currentView = "overview";

	resolutionNotes = "";
	priorities = PRIORITY_OPTIONS;
	avgRating = 0;

	stats = {
		total: 0,
		assigned: 0,
		inProgress: 0,
		resolved: 0,
		overdue: 0,
	};

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private complaintService: ComplaintService,
		public authService: AuthService,
		private snackBar: MatSnackBar
	) {}

	ngOnInit(): void {
		this.user = this.authService.getCurrentUser();
		this.loadComplaints();

		this.route.queryParams.subscribe((params) => {
			this.currentView = params["view"] || "overview";
		});
	}

	loadComplaints(): void {
		this.isLoading = true;
		this.complaintService.getComplaints().subscribe({
			next: (response) => {
				if (response.success && response.complaints) {
					this.complaints = response.complaints;
					this.calculateStats();
					this.applyFilter();
				}
				this.isLoading = false;
			},
			error: (error) => {
				this.isLoading = false;
				this.snackBar.open(
					error?.error?.message || "Failed to load complaints",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	calculateStats(): void {
		const now = new Date();
		this.stats = {
			total: this.complaints.length,
			assigned: this.complaints.filter((c) => c.status === "Assigned").length,
			inProgress: this.complaints.filter((c) => c.status === "In-progress")
				.length,
			resolved: this.complaints.filter((c) => c.status === "Resolved").length,
			overdue: this.complaints.filter((c) => {
				if (c.status === "Resolved" || !c.deadline_at) return false;
				return new Date(c.deadline_at) < now;
			}).length,
		};

		// Calculate average rating from resolved complaints with feedback
		const ratedComplaints = this.complaints.filter(
			(c) =>
				c.status === "Resolved" && c.feedback_rating && c.feedback_rating > 0
		);
		if (ratedComplaints.length > 0) {
			this.avgRating =
				ratedComplaints.reduce((sum, c) => sum + (c.feedback_rating || 0), 0) /
				ratedComplaints.length;
		} else {
			this.avgRating = 0;
		}
	}

	getResolutionRate(): number {
		if (this.stats.total === 0) return 0;
		return Math.round((this.stats.resolved / this.stats.total) * 100);
	}

	applyFilter(): void {
		if (this.statusFilter === "all") {
			this.filteredComplaints = [...this.complaints];
		} else if (this.statusFilter === "overdue") {
			const now = new Date();
			this.filteredComplaints = this.complaints.filter((c) => {
				if (c.status === "Resolved" || !c.deadline_at) return false;
				return new Date(c.deadline_at) < now;
			});
		} else {
			this.filteredComplaints = this.complaints.filter(
				(c) => c.status === this.statusFilter
			);
		}
		this.pageIndex = 0;
		this.updatePagedComplaints();
	}

	updatePagedComplaints(): void {
		const start = this.pageIndex * this.pageSize;
		this.pagedComplaints = this.filteredComplaints.slice(
			start,
			start + this.pageSize
		);
	}

	onPageChange(event: PageEvent): void {
		this.pageIndex = event.pageIndex;
		this.pageSize = event.pageSize;
		this.updatePagedComplaints();
	}

	onFilterChange(): void {
		this.applyFilter();
	}

	viewComplaintDetails(complaint: Complaint): void {
		this.router.navigate(["/staff/complaint", complaint.id]);
	}

	closeDetails(): void {
		this.selectedComplaint = null;
		this.resolutionNotes = "";
	}

	getNextStatus(currentStatus: ComplaintStatus): ComplaintStatus | null {
		const flow: Record<ComplaintStatus, ComplaintStatus | null> = {
			Open: "Assigned",
			Assigned: "In-progress",
			"In-progress": "Resolved",
			Resolved: null,
		};
		return flow[currentStatus];
	}

	updateStatus(): void {
		if (!this.selectedComplaint) return;

		const nextStatus = this.getNextStatus(this.selectedComplaint.status);
		if (!nextStatus) return;

		this.isUpdating = true;

		const updateData: any = { status: nextStatus };
		if (this.resolutionNotes.trim()) {
			updateData.resolution_notes = this.resolutionNotes;
		}

		this.complaintService
			.updateComplaintStatus(this.selectedComplaint.id, updateData)
			.subscribe({
				next: (response) => {
					this.isUpdating = false;
					if (response.success && response.complaint) {
						const index = this.complaints.findIndex(
							(c) => c.id === response.complaint!.id
						);
						if (index !== -1) {
							this.complaints[index] = response.complaint;
						}
						this.selectedComplaint = response.complaint;
						this.calculateStats();
						this.applyFilter();

						this.snackBar.open(`Status updated to ${nextStatus}`, "Close", {
							duration: 3000,
							panelClass: ["success-snackbar"],
						});
					}
				},
				error: (error) => {
					this.isUpdating = false;
					this.snackBar.open(
						error?.error?.message || "Failed to update status",
						"Close",
						{ duration: 5000, panelClass: ["error-snackbar"] }
					);
				},
			});
	}

	saveNotes(): void {
		if (!this.selectedComplaint || !this.resolutionNotes.trim()) return;

		this.isUpdating = true;

		this.complaintService
			.updateComplaintStatus(this.selectedComplaint.id, {
				resolution_notes: this.resolutionNotes,
			})
			.subscribe({
				next: (response) => {
					this.isUpdating = false;
					if (response.success && response.complaint) {
						const index = this.complaints.findIndex(
							(c) => c.id === response.complaint!.id
						);
						if (index !== -1) {
							this.complaints[index] = response.complaint;
						}
						this.selectedComplaint = response.complaint;

						this.snackBar.open("Notes saved successfully", "Close", {
							duration: 3000,
							panelClass: ["success-snackbar"],
						});
					}
				},
				error: (error) => {
					this.isUpdating = false;
					this.snackBar.open(
						error?.error?.message || "Failed to save notes",
						"Close",
						{ duration: 5000, panelClass: ["error-snackbar"] }
					);
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

	isOverdue(complaint: Complaint): boolean {
		if (complaint.status === "Resolved" || !complaint.deadline_at) return false;
		return new Date(complaint.deadline_at) < new Date();
	}

	getTimeRemaining(deadline: Date | string | null | undefined): string {
		if (!deadline) return "No deadline";
		const now = new Date();
		const deadlineDate = new Date(deadline);
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

	goToProfile(): void {
		this.router.navigate(["/profile"]);
	}

	goToComplaints(status: string): void {
		this.statusFilter = status;
		this.router.navigate(["/staff"], { queryParams: { view: "complaints" } });
		this.applyFilter();
	}
}
