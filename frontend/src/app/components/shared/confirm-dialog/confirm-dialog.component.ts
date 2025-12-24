import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface ConfirmDialogData {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmColor?: "primary" | "accent" | "warn";
	icon?: string;
}

@Component({
	selector: "app-confirm-dialog",
	template: `
		<div class="confirm-dialog">
			<div class="dialog-icon" *ngIf="data.icon">
				<mat-icon [style.color]="getIconColor()">{{ data.icon }}</mat-icon>
			</div>
			<h2 mat-dialog-title>{{ data.title }}</h2>
			<mat-dialog-content>
				<p>{{ data.message }}</p>
			</mat-dialog-content>
			<mat-dialog-actions align="end">
				<button mat-button (click)="onCancel()">
					{{ data.cancelText || "Cancel" }}
				</button>
				<button
					mat-raised-button
					[color]="data.confirmColor || 'primary'"
					(click)="onConfirm()"
				>
					{{ data.confirmText || "Confirm" }}
				</button>
			</mat-dialog-actions>
		</div>
	`,
	styles: [
		`
			.confirm-dialog {
				padding: 8px;
				min-width: 300px;
			}

			.dialog-icon {
				text-align: center;
				margin-bottom: 16px;
			}

			.dialog-icon mat-icon {
				font-size: 48px;
				width: 48px;
				height: 48px;
			}

			h2[mat-dialog-title] {
				margin-bottom: 8px;
				font-weight: 500;
			}

			mat-dialog-content p {
				color: #666;
				margin: 0;
				line-height: 1.5;
			}

			mat-dialog-actions {
				margin-top: 16px;
				padding: 8px 0 0;
			}

			mat-dialog-actions button {
				margin-left: 8px;
			}
		`,
	],
})
export class ConfirmDialogComponent {
	constructor(
		public dialogRef: MatDialogRef<ConfirmDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
	) {}

	getIconColor(): string {
		const colors: Record<string, string> = {
			warn: "#f44336",
			accent: "#ff4081",
			primary: "#3f51b5",
		};
		return colors[this.data.confirmColor || "primary"] || "#3f51b5";
	}

	onCancel(): void {
		this.dialogRef.close(false);
	}

	onConfirm(): void {
		this.dialogRef.close(true);
	}
}
