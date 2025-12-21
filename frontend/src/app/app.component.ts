import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Subscription, filter } from "rxjs";
import { AuthService } from "./services/auth.service";
import { User } from "./models/user.model";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
	currentUser: User | null = null;
	isAuthenticated = false;
	showNav = true;
	isMobileMenuOpen = false;

	private subscriptions = new Subscription();

	constructor(public authService: AuthService, private router: Router) {}

	ngOnInit(): void {
		this.subscriptions.add(
			this.authService.currentUser$.subscribe((user) => {
				this.currentUser = user;
			})
		);

		this.subscriptions.add(
			this.authService.isAuthenticated$.subscribe((isAuth) => {
				this.isAuthenticated = isAuth;
			})
		);

		this.subscriptions.add(
			this.router.events
				.pipe(filter((event) => event instanceof NavigationEnd))
				.subscribe((event: any) => {
					const hideNavRoutes = ["/login", "/register"];
					this.showNav = !hideNavRoutes.includes(event.urlAfterRedirects);
					this.isMobileMenuOpen = false;
				})
		);
	}

	ngOnDestroy(): void {
		this.subscriptions.unsubscribe();
	}

	toggleMobileMenu(): void {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	logout(): void {
		this.authService.logout();
		this.isMobileMenuOpen = false;
	}

	getDashboardLink(): string {
		if (!this.currentUser) return "/login";

		switch (this.currentUser.role) {
			case "Admin":
				return "/admin";
			case "Staff":
				return "/staff";
			default:
				return "/dashboard";
		}
	}

	getRoleLabel(): string {
		if (!this.currentUser) return "";
		return this.currentUser.role;
	}
}
