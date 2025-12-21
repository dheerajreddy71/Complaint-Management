import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "../../services/auth.service";

@Component({
	selector: "app-registration",
	templateUrl: "./registration.component.html",
	styleUrls: ["./registration.component.scss"],
})
export class RegistrationComponent {
	registerForm: FormGroup;
	isLoading = false;
	hidePassword = true;
	hideConfirmPassword = true;

	// Users can only register as User. Admin assigns Staff/Admin roles from the dashboard.
	roles = [
		{ value: "User", label: "User (Submit Complaints)", icon: "person" },
	];

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
		private snackBar: MatSnackBar
	) {
		this.registerForm = this.fb.group(
			{
				name: [
					"",
					[
						Validators.required,
						Validators.minLength(2),
						Validators.maxLength(100),
					],
				],
				email: ["", [Validators.required, Validators.email]],
				password: ["", [Validators.required, Validators.minLength(6)]],
				confirmPassword: ["", [Validators.required]],
				role: ["User", [Validators.required]],
				contact_info: ["", [Validators.maxLength(100)]],
			},
			{ validators: this.passwordMatchValidator }
		);
	}

	passwordMatchValidator(form: FormGroup) {
		const password = form.get("password");
		const confirmPassword = form.get("confirmPassword");

		if (
			password &&
			confirmPassword &&
			password.value !== confirmPassword.value
		) {
			confirmPassword.setErrors({ passwordMismatch: true });
		}
		return null;
	}

	onSubmit(): void {
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		this.isLoading = true;

		const { confirmPassword, ...formData } = this.registerForm.value;

		this.authService.register(formData).subscribe({
			next: (response) => {
				this.isLoading = false;
				if (response.success && response.user) {
					this.snackBar.open(
						"Registration successful! Welcome aboard.",
						"Close",
						{
							duration: 3000,
							horizontalPosition: "end",
							verticalPosition: "top",
							panelClass: ["success-snackbar"],
						}
					);

					switch (response.user.role) {
						case "Admin":
							this.router.navigate(["/admin"]);
							break;
						case "Staff":
							this.router.navigate(["/staff"]);
							break;
						default:
							this.router.navigate(["/dashboard"]);
					}
				}
			},
			error: (error) => {
				this.isLoading = false;
				this.snackBar.open(
					error?.error?.message || "Registration failed. Please try again.",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	getErrorMessage(field: string): string {
		const control = this.registerForm.get(field);

		if (control?.hasError("required")) {
			return `${this.getFieldLabel(field)} is required`;
		}
		if (control?.hasError("email")) {
			return "Please enter a valid email address";
		}
		if (control?.hasError("minlength")) {
			const minLength = control.getError("minlength").requiredLength;
			return `${this.getFieldLabel(
				field
			)} must be at least ${minLength} characters`;
		}
		if (control?.hasError("maxlength")) {
			const maxLength = control.getError("maxlength").requiredLength;
			return `${this.getFieldLabel(
				field
			)} cannot exceed ${maxLength} characters`;
		}
		if (control?.hasError("passwordMismatch")) {
			return "Passwords do not match";
		}
		return "";
	}

	private getFieldLabel(field: string): string {
		const labels: Record<string, string> = {
			name: "Name",
			email: "Email",
			password: "Password",
			confirmPassword: "Confirm Password",
			role: "Role",
			contact_info: "Contact Info",
		};
		return labels[field] || field;
	}
}
