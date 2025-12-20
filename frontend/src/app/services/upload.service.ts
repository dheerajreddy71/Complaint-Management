import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpEventType } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { environment } from "../../environments/environment";

export interface UploadResponse {
	success: boolean;
	message: string;
	data?: {
		url: string;
		publicId: string;
		format: string;
		size: number;
	};
}

export interface UploadProgress {
	progress: number;
	completed: boolean;
	url?: string;
}

@Injectable({
	providedIn: "root",
})
export class UploadService {
	private apiUrl = `${environment.apiUrl}/upload`;

	constructor(private http: HttpClient) {}

	uploadFile(file: File): Observable<UploadProgress> {
		const formData = new FormData();
		formData.append("file", file);

		return this.http
			.post<UploadResponse>(this.apiUrl, formData, {
				reportProgress: true,
				observe: "events",
			})
			.pipe(
				map((event: HttpEvent<UploadResponse>) => {
					switch (event.type) {
						case HttpEventType.UploadProgress:
							const progress = event.total
								? Math.round((100 * event.loaded) / event.total)
								: 0;
							return { progress, completed: false };
						case HttpEventType.Response:
							return {
								progress: 100,
								completed: true,
								url: event.body?.data?.url,
							};
						default:
							return { progress: 0, completed: false };
					}
				})
			);
	}

	deleteFile(
		publicId: string
	): Observable<{ success: boolean; message: string }> {
		return this.http.delete<{ success: boolean; message: string }>(
			`${this.apiUrl}/${encodeURIComponent(publicId)}`
		);
	}

	isImage(file: File): boolean {
		return file.type.startsWith("image/");
	}

	isPdf(file: File): boolean {
		return file.type === "application/pdf";
	}

	isValidFile(file: File): boolean {
		return this.isImage(file) || this.isPdf(file);
	}

	formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
}
