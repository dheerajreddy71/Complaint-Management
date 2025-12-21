import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ComplaintService } from "../../services/complaint.service";
import { AuthService } from "../../services/auth.service";
import { UploadService, UploadProgress } from "../../services/upload.service";
import {
	Complaint,
	COMPLAINT_CATEGORIES,
	STATUS_FLOW,
	ComplaintStatus,
	PRIORITY_OPTIONS,
} from "../../models/complaint.model";

@Component({
	selector: "app-complaint-details",
	templateUrl: "./complaint-details.component.html",
	styleUrls: ["./complaint-details.component.scss"],
})
export class ComplaintDetailsComponent implements OnInit {
	complaint: Complaint | null = null;
	isLoading = true;
	isSubmitting = false;
	complaintId: number | null = null;
	isNewComplaint = false;

	complaintForm: FormGroup;
	feedbackForm: FormGroup;

	categories = COMPLAINT_CATEGORIES;
	statusFlow = STATUS_FLOW;
	priorities = PRIORITY_OPTIONS;

	showFeedbackDialog = false;

	// File upload properties
	selectedFile: File | null = null;
	uploadProgress = 0;
	isUploading = false;
	uploadedFileUrl: string | null = null;
	filePreview: string | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private fb: FormBuilder,
		private complaintService: ComplaintService,
		public authService: AuthService,
		private uploadService: UploadService,
		private snackBar: MatSnackBar
	) {
		this.complaintForm = this.fb.group({
			title: [
				"",
				[
					Validators.required,
					Validators.minLength(5),
					Validators.maxLength(200),
				],
			],
			description: ["", [Validators.required, Validators.minLength(10)]],
			category: ["", [Validators.required]],
			priority: ["Medium", [Validators.required]],
			location: [""],
			attachments: [""],
		});

		this.feedbackForm = this.fb.group({
			feedback: ["", [Validators.required, Validators.minLength(5)]],
			feedback_rating: [
				5,
				[Validators.required, Validators.min(1), Validators.max(5)],
			],
		});
	}

	ngOnInit(): void {
		const url = this.router.url;

		if (url === "/complaints/new") {
			this.isNewComplaint = true;
			this.isLoading = false;
		} else {
			const idParam = this.route.snapshot.paramMap.get("id");
			if (idParam) {
				this.complaintId = parseInt(idParam, 10);
				this.loadComplaint();
			} else {
				this.router.navigate(["/complaints"]);
			}
		}
	}

	loadComplaint(): void {
		if (!this.complaintId) return;

		this.isLoading = true;
		this.complaintService.getComplaintById(this.complaintId).subscribe({
			next: (response) => {
				if (response.success && response.complaint) {
					this.complaint = response.complaint;
				}
				this.isLoading = false;
			},
			error: (error) => {
				this.isLoading = false;
				this.snackBar.open(
					error?.error?.message || "Failed to load complaint details",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
				this.router.navigate(["/complaints"]);
			},
		});
	}

	onSubmitComplaint(): void {
		if (this.complaintForm.invalid) {
			this.complaintForm.markAllAsTouched();
			return;
		}

		this.isSubmitting = true;

		this.complaintService.createComplaint(this.complaintForm.value).subscribe({
			next: (response) => {
				this.isSubmitting = false;
				if (response.success) {
					this.snackBar.open("Complaint submitted successfully!", "Close", {
						duration: 3000,
						panelClass: ["success-snackbar"],
					});
					this.router.navigate(["/complaints"]);
				}
			},
			error: (error) => {
				this.isSubmitting = false;
				this.snackBar.open(
					error?.error?.message || "Failed to submit complaint",
					"Close",
					{ duration: 5000, panelClass: ["error-snackbar"] }
				);
			},
		});
	}

	openFeedbackDialog(): void {
		this.showFeedbackDialog = true;
	}

	closeFeedbackDialog(): void {
		this.showFeedbackDialog = false;
		this.feedbackForm.reset({ feedback_rating: 5 });
	}

	submitFeedback(): void {
		if (this.feedbackForm.invalid || !this.complaintId) {
			this.feedbackForm.markAllAsTouched();
			return;
		}

		this.isSubmitting = true;

		this.complaintService
			.submitFeedback(this.complaintId, this.feedbackForm.value)
			.subscribe({
				next: (response) => {
					this.isSubmitting = false;
					if (response.success && response.complaint) {
						this.complaint = response.complaint;
						this.showFeedbackDialog = false;
						this.snackBar.open("Feedback submitted successfully!", "Close", {
							duration: 3000,
							panelClass: ["success-snackbar"],
						});
					}
				},
				error: (error) => {
					this.isSubmitting = false;
					this.snackBar.open(
						error?.error?.message || "Failed to submit feedback",
						"Close",
						{ duration: 5000, panelClass: ["error-snackbar"] }
					);
				},
			});
	}

	getStatusIndex(status: string): number {
		return this.statusFlow.indexOf(status as ComplaintStatus);
	}

	isStatusCompleted(status: string): boolean {
		if (!this.complaint) return false;
		return (
			this.getStatusIndex(status) <= this.getStatusIndex(this.complaint.status)
		);
	}

	isStatusActive(status: string): boolean {
		if (!this.complaint) return false;
		return this.complaint.status === status;
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return "N/A";
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	getErrorMessage(form: FormGroup, field: string): string {
		const control = form.get(field);

		if (control?.hasError("required")) {
			return `This field is required`;
		}
		if (control?.hasError("minlength")) {
			const minLength = control.getError("minlength").requiredLength;
			return `Minimum ${minLength} characters required`;
		}
		if (control?.hasError("maxlength")) {
			const maxLength = control.getError("maxlength").requiredLength;
			return `Maximum ${maxLength} characters allowed`;
		}
		return "";
	}

	goBack(): void {
		this.router.navigate(["/complaints"]);
	}

	getCategoryIcon(category: string): string {
		const cat = this.categories.find((c) => c.value === category);
		return cat?.icon || "category";
	}

	// File upload methods
	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];

		if (!this.uploadService.isValidFile(file)) {
			this.snackBar.open(
				"Invalid file type. Only images and PDFs are allowed.",
				"Close",
				{
					duration: 4000,
					panelClass: ["error-snackbar"],
				}
			);
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			this.snackBar.open("File size must be less than 10MB.", "Close", {
				duration: 4000,
				panelClass: ["error-snackbar"],
			});
			return;
		}

		this.selectedFile = file;

		if (this.uploadService.isImage(file)) {
			const reader = new FileReader();
			reader.onload = () => {
				this.filePreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			this.filePreview = null;
		}
	}

	uploadFile(): void {
		if (!this.selectedFile) return;

		this.isUploading = true;
		this.uploadProgress = 0;

		this.uploadService.uploadFile(this.selectedFile).subscribe({
			next: (progress: UploadProgress) => {
				this.uploadProgress = progress.progress;
				if (progress.completed && progress.url) {
					this.uploadedFileUrl = progress.url;
					this.complaintForm.patchValue({ attachments: progress.url });
					this.isUploading = false;
					this.snackBar.open("File uploaded successfully!", "Close", {
						duration: 3000,
						panelClass: ["success-snackbar"],
					});
				}
			},
			error: () => {
				this.isUploading = false;
				this.uploadProgress = 0;
				this.snackBar.open(
					"Failed to upload file. Please try again.",
					"Close",
					{
						duration: 4000,
						panelClass: ["error-snackbar"],
					}
				);
			},
		});
	}

	removeFile(): void {
		this.selectedFile = null;
		this.filePreview = null;
		this.uploadedFileUrl = null;
		this.uploadProgress = 0;
		this.complaintForm.patchValue({ attachments: "" });
	}

	getFileName(): string {
		return this.selectedFile?.name || "";
	}

	getFileSize(): string {
		if (!this.selectedFile) return "";
		return this.uploadService.formatFileSize(this.selectedFile.size);
	}

	isImageFile(): boolean {
		return this.selectedFile
			? this.uploadService.isImage(this.selectedFile)
			: false;
	}

	getPriorityColor(priority: string): string {
		const p = this.priorities.find((pr) => pr.value === priority);
		return p?.color || "#6c757d";
	}

	getPriorityIcon(priority: string): string {
		const p = this.priorities.find((pr) => pr.value === priority);
		return p?.icon || "remove";
	}

	isOverdue(): boolean {
		if (!this.complaint?.deadline_at || this.complaint.status === "Resolved") {
			return false;
		}
		return new Date(this.complaint.deadline_at) < new Date();
	}

	getTimeRemaining(): string {
		if (!this.complaint?.deadline_at) return "No deadline";
		if (this.complaint.status === "Resolved") return "Completed";

		const deadline = new Date(this.complaint.deadline_at);
		const now = new Date();
		const diff = deadline.getTime() - now.getTime();

		if (diff < 0) {
			const overdue = Math.abs(diff);
			const hours = Math.floor(overdue / (1000 * 60 * 60));
			const days = Math.floor(hours / 24);
			if (days > 0) return `Overdue by ${days} day(s)`;
			return `Overdue by ${hours} hour(s)`;
		}

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);
		if (days > 0) return `${days} day(s) remaining`;
		if (hours > 0) return `${hours} hour(s) remaining`;
		return "Less than an hour";
	}

	isPdfAttachment(): boolean {
		if (!this.complaint?.attachments) return false;
		return (
			this.complaint.attachments.toLowerCase().includes(".pdf") ||
			this.complaint.attachments.includes("/raw/upload/")
		);
	}

	getAttachmentViewUrl(): string {
		if (!this.complaint?.attachments) return "";
		// For Cloudinary PDFs, use Google Docs viewer for inline viewing
		if (this.isPdfAttachment()) {
			return `https://docs.google.com/viewer?url=${encodeURIComponent(
				this.complaint.attachments
			)}&embedded=true`;
		}
		return this.complaint.attachments;
	}
}
