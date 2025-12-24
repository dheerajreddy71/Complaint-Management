import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// Angular Material Modules
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatChipsModule } from "@angular/material/chips";
import { MatBadgeModule } from "@angular/material/badge";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDividerModule } from "@angular/material/divider";
import { MatTabsModule } from "@angular/material/tabs";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSliderModule } from "@angular/material/slider";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

// App Routing Module
import { AppRoutingModule } from "./app-routing.module";

// App Component
import { AppComponent } from "./app.component";

// Feature Components
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

// Shared Components
import { ConfirmDialogComponent } from "./components/shared/confirm-dialog/confirm-dialog.component";
import { PasswordStrengthComponent } from "./components/shared/password-strength/password-strength.component";

// Pipes
import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({ name: "safe" })
export class SafePipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) {}
	transform(url: string): SafeResourceUrl {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}
}

// Services
import { AuthService } from "./services/auth.service";
import { ComplaintService } from "./services/complaint.service";
import { UploadService } from "./services/upload.service";

// Guards
import { AuthGuard } from "./guards/auth.guard";
import { GuestGuard } from "./guards/guest.guard";

// Interceptors
import { AuthInterceptor } from "./interceptors/auth.interceptor";

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		RegistrationComponent,
		ComplaintListComponent,
		ComplaintDetailsComponent,
		StaffDashboardComponent,
		AdminDashboardComponent,
		UnauthorizedComponent,
		UserDashboardComponent,
		ProfileComponent,
		StaffComplaintDetailComponent,
		AdminComplaintDetailComponent,
		AdminUsersComponent,
		ConfirmDialogComponent,
		PasswordStrengthComponent,
		SafePipe,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		AppRoutingModule,

		// Angular Material
		MatToolbarModule,
		MatButtonModule,
		MatIconModule,
		MatMenuModule,
		MatSidenavModule,
		MatListModule,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatTableModule,
		MatPaginatorModule,
		MatSortModule,
		MatDialogModule,
		MatSnackBarModule,
		MatProgressSpinnerModule,
		MatProgressBarModule,
		MatChipsModule,
		MatBadgeModule,
		MatTooltipModule,
		MatDividerModule,
		MatTabsModule,
		MatExpansionModule,
		MatRadioModule,
		MatCheckboxModule,
		MatSliderModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatAutocompleteModule,
	],
	providers: [
		AuthService,
		ComplaintService,
		UploadService,
		AuthGuard,
		GuestGuard,
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptor,
			multi: true,
		},
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
