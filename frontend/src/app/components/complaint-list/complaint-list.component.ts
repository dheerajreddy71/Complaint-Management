import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import { Complaint, STATUS_FLOW } from "../../models/complaint.model";

@Component({
	selector: "app-complaint-list",
	templateUrl: "./complaint-list.component.html",
	styleUrls: ["./complaint-list.component.scss"],
})
export class ComplaintListComponent implements OnInit {
	complaints: Complaint[] = [];
	filteredComplaints: Complaint[] = [];
	pagedComplaints: Complaint[] = [];
	isLoading = true;
	searchQuery = "";
	statusFilter = "all";
	categoryFilter = "all";

	// Pagination
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	pageSize = 9;
	pageIndex = 0;
	pageSizeOptions = [6, 9, 12, 24];

	statusOptions = ["all", ...STATUS_FLOW];
	categoryOptions = [
		"all",
		"plumbing",
		"electrical",
		"facility",
		"cleaning",
		"security",
		"other",
	];

	constructor(
		private complaintService: ComplaintService,
		public authService: AuthService,
		private router: Router,
		private snackBar: MatSnackBar
	) {}

	ngOnInit(): void {
		this.loadComplaints();
	}

	loadComplaints(): void {
		this.isLoading = true;
		this.complaintService.getComplaints().subscribe({
			next: (response) => {
				if (response.success && response.complaints) {
					this.complaints = response.complaints;
					this.applyFilters();
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

	applyFilters(): void {
		let filtered = [...this.complaints];

		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.title.toLowerCase().includes(query) ||
					c.description.toLowerCase().includes(query) ||
					c.id.toString().includes(query)
			);
		}

		if (this.statusFilter !== "all") {
			filtered = filtered.filter((c) => c.status === this.statusFilter);
		}

		if (this.categoryFilter !== "all") {
			filtered = filtered.filter((c) => c.category === this.categoryFilter);
		}

		this.filteredComplaints = filtered;
		this.pageIndex = 0;
		this.updatePagedComplaints();
	}

	updatePagedComplaints(): void {
		const startIndex = this.pageIndex * this.pageSize;
		this.pagedComplaints = this.filteredComplaints.slice(
			startIndex,
			startIndex + this.pageSize
		);
	}

	onPageChange(event: PageEvent): void {
		this.pageIndex = event.pageIndex;
		this.pageSize = event.pageSize;
		this.updatePagedComplaints();
	}

	onSearchChange(): void {
		this.applyFilters();
	}

	onFilterChange(): void {
		this.applyFilters();
	}

	viewDetails(complaint: Complaint): void {
		this.router.navigate(["/complaints", complaint.id]);
	}

	createNew(): void {
		this.router.navigate(["/complaints/new"]);
	}

	getStatusClass(status: string): string {
		return status.toLowerCase().replace("-", "-");
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

	getStatusIcon(status: string): string {
		const icons: Record<string, string> = {
			Open: "schedule",
			Assigned: "assignment_ind",
			"In-progress": "pending",
			Resolved: "check_circle",
		};
		return icons[status] || "help";
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
}
