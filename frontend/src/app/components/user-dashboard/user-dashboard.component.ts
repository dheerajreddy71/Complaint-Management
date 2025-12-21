import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import { Complaint, PRIORITY_OPTIONS } from "../../models/complaint.model";
import { User } from "../../models/user.model";

@Component({
	selector: "app-user-dashboard",
	templateUrl: "./user-dashboard.component.html",
	styleUrls: ["./user-dashboard.component.scss"],
})
export class UserDashboardComponent implements OnInit {
	user: User | null = null;
	complaints: Complaint[] = [];
	recentComplaints: Complaint[] = [];
	isLoading = true;

	stats = {
		total: 0,
		open: 0,
		inProgress: 0,
		resolved: 0,
		overdue: 0,
	};

	priorities = PRIORITY_OPTIONS;

	constructor(
		private router: Router,
		private complaintService: ComplaintService,
		private authService: AuthService,
		private snackBar: MatSnackBar
	) {}

	ngOnInit(): void {
		this.user = this.authService.getCurrentUser();
		this.loadComplaints();
	}

	loadComplaints(): void {
		this.isLoading = true;
		this.complaintService.getComplaints().subscribe({
			next: (response) => {
				if (response.success && response.complaints) {
					this.complaints = response.complaints;
					this.recentComplaints = this.complaints.slice(0, 5);
					this.calculateStats();
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
		this.stats.total = this.complaints.length;
		this.stats.open = this.complaints.filter(
			(c) => c.status === "Open" || c.status === "Assigned"
		).length;
		this.stats.inProgress = this.complaints.filter(
			(c) => c.status === "In-progress"
		).length;
		this.stats.resolved = this.complaints.filter(
			(c) => c.status === "Resolved"
		).length;
		this.stats.overdue = this.complaints.filter((c) =>
			this.isOverdue(c)
		).length;
	}

	isOverdue(complaint: Complaint): boolean {
		if (!complaint.deadline_at || complaint.status === "Resolved") {
			return false;
		}
		return new Date(complaint.deadline_at) < new Date();
	}

	getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			Open: "#ffc107",
			Assigned: "#17a2b8",
			"In-progress": "#28a745",
			Resolved: "#6c757d",
		};
		return colors[status] || "#6c757d";
	}

	getPriorityColor(priority: string): string {
		const p = this.priorities.find((pr) => pr.value === priority);
		return p?.color || "#6c757d";
	}

	getPriorityIcon(priority: string): string {
		const p = this.priorities.find((pr) => pr.value === priority);
		return p?.icon || "remove";
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	viewComplaint(id: number): void {
		this.router.navigate(["/complaints", id]);
	}

	newComplaint(): void {
		this.router.navigate(["/complaints/new"]);
	}

	viewAllComplaints(): void {
		this.router.navigate(["/complaints"]);
	}
}
