import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Router } from "@angular/router";
import { environment } from "../../environments/environment";
import {
	User,
	LoginRequest,
	RegisterRequest,
	AuthResponse,
} from "../models/user.model";

@Injectable({
	providedIn: "root",
})
export class AuthService {
	private readonly apiUrl = `${environment.apiUrl}/auth`;
	private readonly tokenKey = "complaint_portal_token";
	private readonly userKey = "complaint_portal_user";

	private currentUserSubject = new BehaviorSubject<User | null>(null);
	public currentUser$ = this.currentUserSubject.asObservable();

	private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
	public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

	constructor(private http: HttpClient, private router: Router) {
		this.loadStoredUser();
	}

	private loadStoredUser(): void {
		const token = localStorage.getItem(this.tokenKey);
		const userStr = localStorage.getItem(this.userKey);

		if (token && userStr) {
			try {
				const user = JSON.parse(userStr) as User;
				this.currentUserSubject.next(user);
				this.isAuthenticatedSubject.next(true);
			} catch {
				this.clearStorage();
			}
		}
	}

	private clearStorage(): void {
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.userKey);
		this.currentUserSubject.next(null);
		this.isAuthenticatedSubject.next(false);
	}

	register(data: RegisterRequest): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
			tap((response) => {
				if (response.success && response.token && response.user) {
					this.storeAuthData(response.token, response.user);
				}
			})
		);
	}

	login(data: LoginRequest): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
			tap((response) => {
				if (response.success && response.token && response.user) {
					this.storeAuthData(response.token, response.user);
				}
			})
		);
	}

	private storeAuthData(token: string, user: User): void {
		localStorage.setItem(this.tokenKey, token);
		localStorage.setItem(this.userKey, JSON.stringify(user));
		this.currentUserSubject.next(user);
		this.isAuthenticatedSubject.next(true);
	}

	logout(): void {
		this.clearStorage();
		this.router.navigate(["/login"]);
	}

	getToken(): string | null {
		return localStorage.getItem(this.tokenKey);
	}

	getCurrentUser(): User | null {
		return this.currentUserSubject.value;
	}

	isLoggedIn(): boolean {
		return this.isAuthenticatedSubject.value;
	}

	hasRole(role: string | string[]): boolean {
		const user = this.getCurrentUser();
		if (!user) return false;

		if (Array.isArray(role)) {
			return role.includes(user.role);
		}
		return user.role === role;
	}

	getProfile(): Observable<{ success: boolean; user: User }> {
		return this.http.get<{ success: boolean; user: User }>(
			`${this.apiUrl}/profile`
		);
	}

	updateProfile(data: {
		name: string;
		contact_info?: string;
	}): Observable<{ success: boolean; user: User }> {
		return this.http
			.patch<{ success: boolean; user: User }>(`${this.apiUrl}/profile`, data)
			.pipe(
				tap((response) => {
					if (response.success && response.user) {
						const currentUser = this.getCurrentUser();
						const updatedUser = { ...currentUser, ...response.user };
						localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
						this.currentUserSubject.next(updatedUser as User);
					}
				})
			);
	}

	changePassword(data: {
		currentPassword: string;
		newPassword: string;
	}): Observable<{ success: boolean; message: string }> {
		return this.http.post<{ success: boolean; message: string }>(
			`${this.apiUrl}/change-password`,
			data
		);
	}

	getStaffMembers(): Observable<{ success: boolean; staff: User[] }> {
		return this.http.get<{ success: boolean; staff: User[] }>(
			`${this.apiUrl}/staff`
		);
	}

	getAllUsers(): Observable<{ success: boolean; users: User[] }> {
		return this.http.get<{ success: boolean; users: User[] }>(
			`${this.apiUrl}/all`
		);
	}

	updateUser(
		userId: number,
		data: { role: string; department?: string | null }
	): Observable<{ success: boolean; user?: User; message?: string }> {
		return this.http.patch<{ success: boolean; user?: User; message?: string }>(
			`${this.apiUrl}/users/${userId}`,
			data
		);
	}

	deleteUser(
		userId: number
	): Observable<{ success: boolean; message?: string }> {
		return this.http.delete<{ success: boolean; message?: string }>(
			`${this.apiUrl}/users/${userId}`
		);
	}
}
