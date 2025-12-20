import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./guards/auth.guard";
import { GuestGuard } from "./guards/guest.guard";

import { LoginComponent } from "./components/login/login.component";
import { RegistrationComponent } from "./components/registration/registration.component";
import { ComplaintListComponent } from "./components/complaint-list/complaint-list.component";
import { ComplaintDetailsComponent } from "./components/complaint-details/complaint-details.component";
import { StaffDashboardComponent } from "./components/staff-dashboard/staff-dashboard.component";
import { AdminDashboardComponent } from "./components/admin-dashboard/admin-dashboard.component";
import { UnauthorizedComponent } from "./components/unauthorized/unauthorized.component";
import { UserDashboardComponent } from "./components/user-dashboard/user-dashboard.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { StaffComplaintDetailComponent } from "./components/staff-complaint-detail/staff-complaint-detail.component";
import { AdminComplaintDetailComponent } from "./components/admin-complaint-detail/admin-complaint-detail.component";
import { AdminUsersComponent } from "./components/admin-users/admin-users.component";

const routes: Routes = [
	{
		path: "",
		redirectTo: "/login",
		pathMatch: "full",
	},
	{
		path: "login",
		component: LoginComponent,
		canActivate: [GuestGuard],
	},
	{
		path: "register",
		component: RegistrationComponent,
		canActivate: [GuestGuard],
	},
	{
		path: "dashboard",
		component: UserDashboardComponent,
		canActivate: [AuthGuard],
		data: { roles: ["User"] },
	},
	{
		path: "profile",
		component: ProfileComponent,
		canActivate: [AuthGuard],
		data: { roles: ["User", "Staff", "Admin"] },
	},
	{
		path: "complaints",
		component: ComplaintListComponent,
		canActivate: [AuthGuard],
		data: { roles: ["User", "Admin"] },
		pathMatch: "full",
	},
	{
		path: "complaints/new",
		component: ComplaintDetailsComponent,
		canActivate: [AuthGuard],
		data: { roles: ["User"] },
	},
	{
		path: "complaints/:id",
		component: ComplaintDetailsComponent,
		canActivate: [AuthGuard],
		data: { roles: ["User", "Admin"] },
	},
	{
		path: "staff",
		component: StaffDashboardComponent,
		canActivate: [AuthGuard],
		data: { roles: ["Staff"] },
	},
	{
		path: "staff/complaint/:id",
		component: StaffComplaintDetailComponent,
		canActivate: [AuthGuard],
		data: { roles: ["Staff"] },
	},
	{
		path: "admin",
		component: AdminDashboardComponent,
		canActivate: [AuthGuard],
		data: { roles: ["Admin"] },
	},
	{
		path: "admin/complaint/:id",
		component: AdminComplaintDetailComponent,
		canActivate: [AuthGuard],
		data: { roles: ["Admin"] },
	},
	{
		path: "admin/users",
		component: AdminUsersComponent,
		canActivate: [AuthGuard],
		data: { roles: ["Admin"] },
	},
	{
		path: "unauthorized",
		component: UnauthorizedComponent,
	},
	{
		path: "**",
		redirectTo: "/login",
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
