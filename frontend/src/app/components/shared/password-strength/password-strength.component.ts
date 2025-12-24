import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";

export interface PasswordStrength {
	score: number; // 0-4
	level: "weak" | "fair" | "good" | "strong";
	feedback: string[];
	color: string;
	percentage: number;
}

@Component({
	selector: "app-password-strength",
	template: `
		<div class="password-strength" *ngIf="password">
			<div class="strength-bar">
				<div
					class="strength-fill"
					[style.width.%]="strength.percentage"
					[style.backgroundColor]="strength.color"
				></div>
			</div>
			<div class="strength-info">
				<span class="strength-level" [style.color]="strength.color">
					{{ strength.level | titlecase }}
				</span>
				<div
					class="strength-feedback"
					*ngIf="showFeedback && strength.feedback.length > 0"
				>
					<span class="feedback-item" *ngFor="let item of strength.feedback">
						<mat-icon>info_outline</mat-icon>
						{{ item }}
					</span>
				</div>
			</div>
		</div>
	`,
	styles: [
		`
			.password-strength {
				margin-top: 8px;
			}

			.strength-bar {
				height: 4px;
				background-color: #e0e0e0;
				border-radius: 2px;
				overflow: hidden;
				margin-bottom: 8px;
			}

			.strength-fill {
				height: 100%;
				transition: width 0.3s ease, background-color 0.3s ease;
				border-radius: 2px;
			}

			.strength-info {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}

			.strength-level {
				font-size: 12px;
				font-weight: 500;
				text-transform: capitalize;
			}

			.strength-feedback {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}

			.feedback-item {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 11px;
				color: #666;
			}

			.feedback-item mat-icon {
				font-size: 14px;
				width: 14px;
				height: 14px;
				color: #999;
			}
		`,
	],
})
export class PasswordStrengthComponent implements OnChanges {
	@Input() password: string = "";
	@Input() showFeedback: boolean = true;

	strength: PasswordStrength = {
		score: 0,
		level: "weak",
		feedback: [],
		color: "#f44336",
		percentage: 0,
	};

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["password"]) {
			this.strength = this.calculateStrength(this.password);
		}
	}

	private calculateStrength(password: string): PasswordStrength {
		let score = 0;
		const feedback: string[] = [];

		if (!password) {
			return {
				score: 0,
				level: "weak",
				feedback: [],
				color: "#f44336",
				percentage: 0,
			};
		}

		// Length checks
		if (password.length >= 8) {
			score += 1;
		} else {
			feedback.push("Use at least 8 characters");
		}

		if (password.length >= 12) {
			score += 1;
		}

		// Character variety checks
		if (/[a-z]/.test(password)) {
			score += 0.5;
		} else {
			feedback.push("Add lowercase letters");
		}

		if (/[A-Z]/.test(password)) {
			score += 0.5;
		} else {
			feedback.push("Add uppercase letters");
		}

		if (/[0-9]/.test(password)) {
			score += 0.5;
		} else {
			feedback.push("Add numbers");
		}

		if (/[^a-zA-Z0-9]/.test(password)) {
			score += 0.5;
		} else {
			feedback.push("Add special characters (!@#$%^&*)");
		}

		// Penalize common patterns
		if (/^[a-zA-Z]+$/.test(password)) {
			score -= 0.5;
			feedback.push("Avoid using only letters");
		}

		if (/^[0-9]+$/.test(password)) {
			score -= 0.5;
			feedback.push("Avoid using only numbers");
		}

		if (/(.)\1{2,}/.test(password)) {
			score -= 0.5;
			feedback.push("Avoid repeated characters");
		}

		// Common patterns
		const commonPatterns = [
			"password",
			"123456",
			"qwerty",
			"abc123",
			"letmein",
			"welcome",
		];
		if (
			commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))
		) {
			score -= 1;
			feedback.push("Avoid common passwords");
		}

		// Normalize score
		score = Math.max(0, Math.min(4, score));

		// Determine level and color
		let level: "weak" | "fair" | "good" | "strong";
		let color: string;
		let percentage: number;

		if (score < 1.5) {
			level = "weak";
			color = "#f44336";
			percentage = 25;
		} else if (score < 2.5) {
			level = "fair";
			color = "#ff9800";
			percentage = 50;
		} else if (score < 3.5) {
			level = "good";
			color = "#4caf50";
			percentage = 75;
		} else {
			level = "strong";
			color = "#2e7d32";
			percentage = 100;
		}

		return {
			score: Math.round(score),
			level,
			feedback: feedback.slice(0, 3), // Limit feedback items
			color,
			percentage,
		};
	}
}
