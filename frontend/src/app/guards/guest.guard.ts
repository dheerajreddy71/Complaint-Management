import { Injectable } from "@angular/core";
import { CanActivate, Router, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({
	providedIn: "root",
})
export class GuestGuard implements CanActivate {
	constructor(private authService: AuthService, private router: Router) {}

	canActivate():
		| Observable<boolean | UrlTree>
		| Promise<boolean | UrlTree>
		| boolean
		| UrlTree {
		if (this.authService.isLoggedIn()) {
			const user = this.authService.getCurrentUser();

			if (user) {
				switch (user.role) {
					case "Admin":
						this.router.navigate(["/admin/dashboard"]);
						break;
					case "Staff":
						this.router.navigate(["/staff/dashboard"]);
						break;
					default:
						this.router.navigate(["/complaints"]);
				}
			}

			return false;
		}

		return true;
	}
}
