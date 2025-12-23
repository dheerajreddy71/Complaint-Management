import { Component, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import {
	Complaint,
	ComplaintStats,
	PRIORITY_OPTIONS,
} from "../../models/complaint.model";
import { User } from "../../models/user.model";

interface StaffStats {
	id: number;
	name: string;
	email: string;
	totalAssigned: number;
	resolved: number;
	inProgress: number;
	pending: number;
	avgRating: number;
}

@Component({
	selector: "app-admin-dashboard",
	templateUrl: "./admin-dashboard.component.html",
	styleUrls: ["./admin-dashboard.component.scss"],
})
export class AdminDashboardComponent implements OnInit {
	user: User | null = null;
	complaints: Complaint[] = [];
	filteredComplaints: Complaint[] = [];
	pagedComplaints: Complaint[] = [];
	staffMembers: User[] = [];
	allUsers: User[] = [];
	filteredUsers: User[] = [];
	pagedUsers: User[] = [];
	staffStats: StaffStats[] = [];
	filteredStaffStats: StaffStats[] = [];
	pagedStaffStats: StaffStats[] = [];
	isLoading = true;
	isAssigning = false;
	currentView = "overview";

	// Pagination
	@ViewChild("complaintsPaginator") complaintsPaginator!: MatPaginator;
	@ViewChild("usersPaginator") usersPaginator!: MatPaginator;
	@ViewChild("staffPaginator") staffPaginator!: MatPaginator;

	complaintsPageSize = 10;
	complaintsPageIndex = 0;
	usersPageSize = 10;
	usersPageIndex = 0;
	staffPageSize = 10;
	staffPageIndex = 0;
	pageSizeOptions = [5, 10, 20, 50];

	selectedComplaint: Complaint | null = null;
	selectedStaffId: number | null = null;

	searchQuery = "";
	statusFilter = "all";
	priorityFilter = "all";
	staffSearchQuery = "";
	userSearchQuery = "";
	PRIORITY_OPTIONS = PRIORITY_OPTIONS;

	// Edit user dialog state
	editingUser: User | null = null;
	editRole: string = "";
	editDepartment: string = "";
	isUpdatingUser = false;
	roles = ["User", "Staff", "Admin"];
	departments = [
		"Plumbing",
		"Electrical",
		"Facility",
		"IT",
		"Cleaning",
		"Security",
	];

	stats: ComplaintStats = {
		total: 0,
		open: 0,
		assigned: 0,
		inProgress: 0,
		resolved: 0,
		byCategory: [],
	};

	overdueCount = 0;
	avgResolutionHours = 0;
	avgRating = 0;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private complaintService: ComplaintService,
		private authService: AuthService,
		private snackBar: MatSnackBar,
		private dialog: MatDialog
	) {}

	ngOnInit(): void {
		this.user = this.authService.getCurrentUser();
		this.route.queryParams.subscribe((params) => {
			this.currentView = params["view"] || "overview";
		});
		this.loadData();
	}

	loadData(): void {
		this.isLoading = true;

		this.complaintService.getComplaints().subscribe({
			next: (response) => {
				if (response.success && response.complaints) {
					this.complaints = response.complaints;
					this.calculateOverdue();
					this.applyFilters();
					this.calculateStaffStats();
				}
			},
			error: (error) => {
				this.snackBar.open(
					error?.error?.message || "Failed to load complaints",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});

		this.complaintService.getStats().subscribe({
			next: (response) => {
				if (response.success) {
					this.stats = response.stats;
					this.avgResolutionHours = response.avgResolutionHours;
					this.avgRating = response.avgRating;
				}
				this.isLoading = false;
			},
			error: (error) => {
				this.isLoading = false;
				this.snackBar.open(
					error?.error?.message || "Failed to load statistics",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});

		this.authService.getStaffMembers().subscribe({
			next: (response) => {
				if (response.success && response.staff) {
					this.staffMembers = response.staff;
					this.calculateStaffStats();
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

		this.authService.getAllUsers().subscribe({
			next: (response) => {
				if (response.success && response.users) {
					this.allUsers = response.users.filter((u: User) => u.role === "User");
					this.filteredUsers = [...this.allUsers];
					this.updatePagedUsers();
				}
			},
			error: (error) => {
				this.snackBar.open(
					error?.error?.message || "Failed to load users",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	calculateOverdue(): void {
		const now = new Date();
		this.overdueCount = this.complaints.filter((c) => {
			if (c.status === "Resolved" || !c.deadline_at) return false;
			return new Date(c.deadline_at) < now;
		}).length;
	}

	applyFilters(): void {
		let filtered = [...this.complaints];

		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(c) =>
					c.title.toLowerCase().includes(query) ||
					c.id.toString().includes(query) ||
					c.user_name?.toLowerCase().includes(query)
			);
		}

		if (this.statusFilter === "overdue") {
			const now = new Date();
			filtered = filtered.filter((c) => {
				if (c.status === "Resolved" || !c.deadline_at) return false;
				return new Date(c.deadline_at) < now;
			});
		} else if (this.statusFilter !== "all") {
			filtered = filtered.filter((c) => c.status === this.statusFilter);
		}

		if (this.priorityFilter !== "all") {
			filtered = filtered.filter((c) => c.priority === this.priorityFilter);
		}

		this.filteredComplaints = filtered;
		this.complaintsPageIndex = 0;
		this.updatePagedComplaints();
	}

	// Pagination methods
	updatePagedComplaints(): void {
		const start = this.complaintsPageIndex * this.complaintsPageSize;
		this.pagedComplaints = this.filteredComplaints.slice(
			start,
			start + this.complaintsPageSize
		);
	}

	updatePagedUsers(): void {
		const start = this.usersPageIndex * this.usersPageSize;
		this.pagedUsers = this.filteredUsers.slice(
			start,
			start + this.usersPageSize
		);
	}

	updatePagedStaffStats(): void {
		const start = this.staffPageIndex * this.staffPageSize;
		this.pagedStaffStats = this.filteredStaffStats.slice(
			start,
			start + this.staffPageSize
		);
	}

	onComplaintsPageChange(event: PageEvent): void {
		this.complaintsPageIndex = event.pageIndex;
		this.complaintsPageSize = event.pageSize;
		this.updatePagedComplaints();
	}

	onUsersPageChange(event: PageEvent): void {
		this.usersPageIndex = event.pageIndex;
		this.usersPageSize = event.pageSize;
		this.updatePagedUsers();
	}

	onStaffPageChange(event: PageEvent): void {
		this.staffPageIndex = event.pageIndex;
		this.staffPageSize = event.pageSize;
		this.updatePagedStaffStats();
	}

	applyFilter(): void {
		this.applyFilters();
	}

	onSearchChange(): void {
		this.applyFilters();
	}

	onFilterChange(): void {
		this.applyFilters();
	}

	viewComplaintDetails(complaint: Complaint): void {
		this.router.navigate(["/admin/complaint", complaint.id]);
	}

	closeDetails(): void {
		this.selectedComplaint = null;
		this.selectedStaffId = null;
	}

	assignComplaint(): void {
		if (!this.selectedComplaint || !this.selectedStaffId) return;

		this.isAssigning = true;

		this.complaintService
			.assignComplaint(this.selectedComplaint.id, {
				staff_id: this.selectedStaffId,
			})
			.subscribe({
				next: (response) => {
					this.isAssigning = false;
					if (response.success && response.complaint) {
						const index = this.complaints.findIndex(
							(c) => c.id === response.complaint!.id
						);
						if (index !== -1) {
							this.complaints[index] = response.complaint;
						}
						this.selectedComplaint = response.complaint;
						this.applyFilters();

						this.snackBar.open("Complaint assigned successfully", "Close", {
							duration: 3000,
							panelClass: ["success-snackbar"],
						});

						this.loadData();
					}
				},
				error: () => {
					this.isAssigning = false;
					this.snackBar.open(
						"Failed to assign complaint. Please try again.",
						"Close",
						{ duration: 5000, panelClass: ["error-snackbar"] }
					);
				},
			});
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
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

	getResolutionRate(): number {
		if (this.stats.total === 0) return 0;
		return Math.round((this.stats.resolved / this.stats.total) * 100);
	}

	formatResolutionTime(hours: number): string {
		if (!hours || hours === 0) return "0h";
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		if (h === 0) return `${m}m`;
		if (m === 0) return `${h}h`;
		return `${h}h ${m}m`;
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

	// User Management Methods
	calculateStaffStats(): void {
		if (!this.staffMembers.length) return;

		this.staffStats = this.staffMembers.map((staff) => {
			const staffComplaints = this.complaints.filter(
				(c) => c.staff_id === staff.id
			);
			const resolved = staffComplaints.filter((c) => c.status === "Resolved");
			const ratedComplaints = resolved.filter(
				(c) => c.feedback_rating && c.feedback_rating > 0
			);
			const avgRating =
				ratedComplaints.length > 0
					? ratedComplaints.reduce(
							(sum, c) => sum + (c.feedback_rating || 0),
							0
					  ) / ratedComplaints.length
					: 0;

			return {
				id: staff.id,
				name: staff.name,
				email: staff.email,
				totalAssigned: staffComplaints.length,
				resolved: resolved.length,
				inProgress: staffComplaints.filter((c) => c.status === "In-progress")
					.length,
				pending: staffComplaints.filter((c) => c.status === "Assigned").length,
				avgRating: Math.round(avgRating * 10) / 10,
			};
		});
		this.filteredStaffStats = [...this.staffStats];
		this.updatePagedStaffStats();
	}

	onStaffSearchChange(): void {
		if (!this.staffSearchQuery.trim()) {
			this.filteredStaffStats = [...this.staffStats];
			this.staffPageIndex = 0;
			this.updatePagedStaffStats();
			return;
		}
		const query = this.staffSearchQuery.toLowerCase();
		this.filteredStaffStats = this.staffStats.filter(
			(s) =>
				s.name.toLowerCase().includes(query) ||
				s.email.toLowerCase().includes(query)
		);
		this.staffPageIndex = 0;
		this.updatePagedStaffStats();
	}

	onUserSearchChange(): void {
		if (!this.userSearchQuery.trim()) {
			this.filteredUsers = [...this.allUsers];
			this.usersPageIndex = 0;
			this.updatePagedUsers();
			return;
		}
		const query = this.userSearchQuery.toLowerCase();
		this.filteredUsers = this.allUsers.filter(
			(u) =>
				u.name.toLowerCase().includes(query) ||
				u.email.toLowerCase().includes(query)
		);
		this.usersPageIndex = 0;
		this.updatePagedUsers();
	}

	getWorkloadLevel(staff: StaffStats): string {
		const active = staff.inProgress + staff.pending;
		if (active >= 10) return "High";
		if (active >= 5) return "Medium";
		return "Low";
	}

	getWorkloadColor(staff: StaffStats): string {
		const level = this.getWorkloadLevel(staff);
		const colors: Record<string, string> = {
			Low: "#28a745",
			Medium: "#ffc107",
			High: "#dc3545",
		};
		return colors[level] || "#6c757d";
	}

	getResolutionRateForStaff(staff: StaffStats): number {
		if (staff.totalAssigned === 0) return 0;
		return Math.round((staff.resolved / staff.totalAssigned) * 100);
	}

	getUserComplaintsCount(userId: number): number {
		return this.complaints.filter((c) => c.user_id === userId).length;
	}

	formatDateShort(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	goToComplaints(status: string): void {
		this.statusFilter = status;
		this.router.navigate(["/admin"], { queryParams: { view: "complaints" } });
		this.applyFilters();
	}

	// Edit User Methods
	editUser(user: User, event: Event): void {
		event.stopPropagation();
		this.editingUser = user;
		this.editRole = user.role;
		this.editDepartment = user.department || "";
	}

	cancelEditUser(): void {
		this.editingUser = null;
		this.editRole = "";
		this.editDepartment = "";
	}

	saveUser(): void {
		if (!this.editingUser) return;

		// Validate: Staff must have department
		if (this.editRole === "Staff" && !this.editDepartment) {
			this.snackBar.open(
				"Staff members must have a department assigned",
				"Close",
				{ duration: 3000, panelClass: ["error-snackbar"] }
			);
			return;
		}

		this.isUpdatingUser = true;

		const updateData = {
			role: this.editRole,
			department: this.editRole === "Staff" ? this.editDepartment : null,
		};

		this.authService.updateUser(this.editingUser.id, updateData).subscribe({
			next: (response) => {
				this.isUpdatingUser = false;
				if (response.success) {
					// Update local data
					const index = this.allUsers.findIndex(
						(u) => u.id === this.editingUser!.id
					);
					if (index !== -1) {
						this.allUsers[index] = {
							...this.allUsers[index],
							role: this.editRole as "User" | "Staff" | "Admin",
							department:
								this.editRole === "Staff" ? this.editDepartment : undefined,
						};
						this.filteredUsers = this.allUsers.filter(
							(u: User) => u.role === "User"
						);
						this.updatePagedUsers();
					}
					this.cancelEditUser();
					this.snackBar.open("User updated successfully", "Close", {
						duration: 3000,
						panelClass: ["success-snackbar"],
					});
					// Reload to refresh staff list if user was promoted
					if (this.editRole === "Staff") {
						this.loadData();
					}
				}
			},
			error: (error) => {
				this.isUpdatingUser = false;
				this.snackBar.open(
					error?.error?.message || "Failed to update user",
					"Close",
					{ duration: 3000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}
}
