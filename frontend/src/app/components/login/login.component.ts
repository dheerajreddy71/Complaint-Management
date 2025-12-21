import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "../../services/auth.service";

@Component({
	selector: "app-login",
	templateUrl: "./login.component.html",
	styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
	loginForm: FormGroup;
	isLoading = false;
	hidePassword = true;
	returnUrl: string = "/";

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
		private route: ActivatedRoute,
		private snackBar: MatSnackBar
	) {
		this.loginForm = this.fb.group({
			email: ["", [Validators.required, Validators.email]],
			password: ["", [Validators.required, Validators.minLength(6)]],
		});
	}

	ngOnInit(): void {
		this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";
	}

	onSubmit(): void {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.isLoading = true;

		this.authService.login(this.loginForm.value).subscribe({
			next: (response) => {
				this.isLoading = false;
				if (response.success && response.user) {
					this.snackBar.open("Login successful! Welcome back.", "Close", {
						duration: 3000,
						horizontalPosition: "end",
						verticalPosition: "top",
						panelClass: ["success-snackbar"],
					});

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
					error?.error?.message ||
						"Login failed. Please check your credentials.",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	getErrorMessage(field: string): string {
		const control = this.loginForm.get(field);

		if (control?.hasError("required")) {
			return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
		}
		if (control?.hasError("email")) {
			return "Please enter a valid email address";
		}
		if (control?.hasError("minlength")) {
			return "Password must be at least 6 characters";
		}
		return "";
	}
}
