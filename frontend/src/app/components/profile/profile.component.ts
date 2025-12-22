import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../services/auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
	selector: "app-profile",
	templateUrl: "./profile.component.html",
	styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit {
	profileForm!: FormGroup;
	passwordForm!: FormGroup;
	user: any = null;
	isLoadingProfile = false;
	isLoadingPassword = false;
	hideCurrentPassword = true;
	hideNewPassword = true;
	hideConfirmPassword = true;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private snackBar: MatSnackBar
	) {}

	ngOnInit(): void {
		this.user = this.authService.getCurrentUser();
		this.initForms();
	}

	initForms(): void {
		this.profileForm = this.fb.group({
			name: [
				this.user?.name || "",
				[
					Validators.required,
					Validators.minLength(2),
					Validators.maxLength(100),
				],
			],
			email: [{ value: this.user?.email || "", disabled: true }],
			contact_info: [
				this.user?.contact_info || "",
				[Validators.maxLength(200)],
			],
		});

		this.passwordForm = this.fb.group(
			{
				currentPassword: ["", [Validators.required]],
				newPassword: ["", [Validators.required, Validators.minLength(6)]],
				confirmPassword: ["", [Validators.required]],
			},
			{ validators: this.passwordMatchValidator }
		);
	}

	passwordMatchValidator(form: FormGroup) {
		const newPassword = form.get("newPassword");
		const confirmPassword = form.get("confirmPassword");
		if (
			newPassword &&
			confirmPassword &&
			newPassword.value !== confirmPassword.value
		) {
			confirmPassword.setErrors({ passwordMismatch: true });
			return { passwordMismatch: true };
		}
		return null;
	}

	updateProfile(): void {
		if (this.profileForm.invalid) return;

		this.isLoadingProfile = true;
		const formData = this.profileForm.getRawValue();

		this.authService
			.updateProfile({
				name: formData.name,
				contact_info: formData.contact_info,
			})
			.subscribe({
				next: (response: any) => {
					this.isLoadingProfile = false;
					this.user = response.user;
					this.snackBar.open("Profile updated successfully!", "Close", {
						duration: 3000,
						panelClass: ["success-snackbar"],
					});
				},
				error: (error) => {
					this.isLoadingProfile = false;
					this.snackBar.open(
						error.error?.error || "Failed to update profile",
						"Close",
						{
							duration: 4000,
							panelClass: ["error-snackbar"],
						}
					);
				},
			});
	}

	changePassword(): void {
		if (this.passwordForm.invalid) return;

		this.isLoadingPassword = true;
		const formData = this.passwordForm.value;

		this.authService
			.changePassword({
				currentPassword: formData.currentPassword,
				newPassword: formData.newPassword,
			})
			.subscribe({
				next: () => {
					this.isLoadingPassword = false;
					this.passwordForm.reset();
					this.snackBar.open("Password changed successfully!", "Close", {
						duration: 3000,
						panelClass: ["success-snackbar"],
					});
				},
				error: (error) => {
					this.isLoadingPassword = false;
					this.snackBar.open(
						error.error?.error || "Failed to change password",
						"Close",
						{
							duration: 4000,
							panelClass: ["error-snackbar"],
						}
					);
				},
			});
	}

	getRoleIcon(): string {
		switch (this.user?.role) {
			case "Admin":
				return "admin_panel_settings";
			case "Staff":
				return "support_agent";
			default:
				return "person";
		}
	}

	getRoleColor(): string {
		switch (this.user?.role) {
			case "Admin":
				return "#dc3545";
			case "Staff":
				return "#17a2b8";
			default:
				return "#28a745";
		}
	}

	formatDate(date: string): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}
}
