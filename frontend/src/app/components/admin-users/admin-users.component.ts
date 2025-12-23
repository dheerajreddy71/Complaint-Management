import { Component, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { AuthService } from "../../services/auth.service";
import { User } from "../../models/user.model";
import { ConfirmDialogComponent } from "../shared/confirm-dialog/confirm-dialog.component";

@Component({
	selector: "app-admin-users",
	templateUrl: "./admin-users.component.html",
	styleUrls: ["./admin-users.component.scss"],
})
export class AdminUsersComponent implements OnInit {
	isLoading = true;
	allUsers: User[] = [];
	filteredUsers: User[] = [];
	pagedUsers: User[] = [];
	searchQuery = "";
	roleFilter = "all";

	// Pagination
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	pageSize = 12;
	pageIndex = 0;
	pageSizeOptions = [6, 12, 24, 48];

	// Edit dialog state
	editingUser: User | null = null;
	editRole: string = "";
	editDepartment: string = "";
	isUpdating = false;

	roles = ["User", "Staff", "Admin"];
	departments = [
		"Plumbing",
		"Electrical",
		"Facility",
		"IT",
		"Cleaning",
		"Security",
	];

	constructor(
		private router: Router,
		private authService: AuthService,
		private snackBar: MatSnackBar,
		private dialog: MatDialog
	) {}

	ngOnInit(): void {
		this.loadData();
	}

	loadData(): void {
		this.isLoading = true;
		this.authService.getAllUsers().subscribe({
			next: (response) => {
				if (response.success && response.users) {
					this.allUsers = response.users;
					this.filteredUsers = [...this.allUsers];
					this.updatePagedUsers();
				}
				this.isLoading = false;
			},
			error: () => {
				this.isLoading = false;
				this.snackBar.open("Failed to load users", "Close", {
					duration: 3000,
					panelClass: ["error-snackbar"],
				});
			},
		});
	}

	onSearchChange(): void {
		let filtered = [...this.allUsers];

		if (this.roleFilter !== "all") {
			filtered = filtered.filter((u) => u.role === this.roleFilter);
		}

		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(u) =>
					u.name?.toLowerCase().includes(query) ||
					u.email.toLowerCase().includes(query)
			);
		}

		this.filteredUsers = filtered;
		this.pageIndex = 0;
		this.updatePagedUsers();
	}

	updatePagedUsers(): void {
		const startIndex = this.pageIndex * this.pageSize;
		this.pagedUsers = this.filteredUsers.slice(
			startIndex,
			startIndex + this.pageSize
		);
	}

	onPageChange(event: PageEvent): void {
		this.pageIndex = event.pageIndex;
		this.pageSize = event.pageSize;
		this.updatePagedUsers();
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	editUser(user: User): void {
		this.editingUser = user;
		this.editRole = user.role;
		this.editDepartment = user.department || "";
	}

	cancelEdit(): void {
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
				{
					duration: 3000,
					panelClass: ["error-snackbar"],
				}
			);
			return;
		}

		this.isUpdating = true;

		const updateData = {
			role: this.editRole,
			department: this.editRole === "Staff" ? this.editDepartment : null,
		};

		this.authService.updateUser(this.editingUser.id, updateData).subscribe({
			next: (response) => {
				this.isUpdating = false;
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
						this.onSearchChange();
					}
					this.cancelEdit();
					this.snackBar.open("User updated successfully", "Close", {
						duration: 3000,
						panelClass: ["success-snackbar"],
					});
				}
			},
			error: (error) => {
				this.isUpdating = false;
				this.snackBar.open(
					error?.error?.message || "Failed to update user",
					"Close",
					{ duration: 3000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	deleteUser(user: User): void {
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			width: "400px",
			data: {
				title: "Delete User",
				message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
				confirmText: "Delete",
				cancelText: "Cancel",
				icon: "delete",
				iconColor: "#f44336",
			},
		});

		dialogRef.afterClosed().subscribe((confirmed) => {
			if (confirmed) {
				this.authService.deleteUser(user.id).subscribe({
					next: (response) => {
						if (response.success) {
							this.allUsers = this.allUsers.filter((u) => u.id !== user.id);
							this.onSearchChange();
							this.snackBar.open("User deleted successfully", "Close", {
								duration: 3000,
								panelClass: ["success-snackbar"],
							});
						}
					},
					error: (error) => {
						this.snackBar.open(
							error?.error?.message || "Failed to delete user",
							"Close",
							{ duration: 3000, panelClass: ["error-snackbar"] }
						);
					},
				});
			}
		});
	}
}
