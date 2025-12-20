import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import {
	Complaint,
	ComplaintResponse,
	CreateComplaintRequest,
	UpdateComplaintRequest,
	AssignComplaintRequest,
	FeedbackRequest,
	StatsResponse,
	ComplaintQueryParams,
} from "../models/complaint.model";

@Injectable({
	providedIn: "root",
})
export class ComplaintService {
	private readonly apiUrl = `${environment.apiUrl}/complaints`;

	constructor(private http: HttpClient) {}

	createComplaint(data: CreateComplaintRequest): Observable<ComplaintResponse> {
		return this.http.post<ComplaintResponse>(this.apiUrl, data);
	}

	getComplaints(params?: ComplaintQueryParams): Observable<ComplaintResponse> {
		let httpParams = new HttpParams();

		if (params) {
			if (params.page)
				httpParams = httpParams.set("page", params.page.toString());
			if (params.limit)
				httpParams = httpParams.set("limit", params.limit.toString());
			if (params.status) httpParams = httpParams.set("status", params.status);
			if (params.category)
				httpParams = httpParams.set("category", params.category);
			if (params.priority)
				httpParams = httpParams.set("priority", params.priority);
			if (params.search) httpParams = httpParams.set("search", params.search);
		}

		return this.http.get<ComplaintResponse>(this.apiUrl, {
			params: httpParams,
		});
	}

	getComplaintById(id: number): Observable<ComplaintResponse> {
		return this.http.get<ComplaintResponse>(`${this.apiUrl}/${id}`);
	}

	updateComplaintStatus(
		id: number,
		data: UpdateComplaintRequest
	): Observable<ComplaintResponse> {
		return this.http.patch<ComplaintResponse>(
			`${this.apiUrl}/${id}/status`,
			data
		);
	}

	assignComplaint(
		id: number,
		data: AssignComplaintRequest
	): Observable<ComplaintResponse> {
		return this.http.patch<ComplaintResponse>(
			`${this.apiUrl}/${id}/assign`,
			data
		);
	}

	submitFeedback(
		id: number,
		data: FeedbackRequest
	): Observable<ComplaintResponse> {
		return this.http.patch<ComplaintResponse>(
			`${this.apiUrl}/${id}/feedback`,
			data
		);
	}

	getStats(): Observable<StatsResponse> {
		return this.http.get<StatsResponse>(`${this.apiUrl}/stats/overview`);
	}
}
