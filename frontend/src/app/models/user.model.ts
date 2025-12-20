export interface User {
	id: number;
	name: string;
	email: string;
	role: "User" | "Staff" | "Admin";
	department?: string;
	contact_info?: string;
	created_at?: Date;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
	role: "User" | "Staff" | "Admin";
	department?: string;
	contact_info?: string;
}

export interface AuthResponse {
	success: boolean;
	message: string;
	token?: string;
	user?: User;
}
