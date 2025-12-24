import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
	selector: "app-unauthorized",
	templateUrl: "./unauthorized.component.html",
	styleUrls: ["./unauthorized.component.scss"],
})
export class UnauthorizedComponent {
	constructor(private router: Router, private authService: AuthService) {}

	get userRole(): string {
		const user = this.authService.getCurrentUser();
		return user?.role || "Guest";
	}

	goBack(): void {
		const user = this.authService.getCurrentUser();

		if (!user) {
			this.router.navigate(["/login"]);
			return;
		}

		switch (user.role) {
			case "Admin":
				this.router.navigate(["/admin"]);
				break;
			case "Staff":
				this.router.navigate(["/staff"]);
				break;
			default:
				this.router.navigate(["/complaints"]);
		}
	}

	logout(): void {
		this.authService.logout();
		this.router.navigate(["/login"]);
	}
}
