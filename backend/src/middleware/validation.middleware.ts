import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";

export function handleValidationErrors(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const errorMessages = errors.array().map((err: ValidationError) => {
			if ("path" in err) {
				return { field: err.path, message: err.msg };
			}
			return { message: err.msg };
		});

		res.status(400).json({
			success: false,
			message: "Validation failed",
			errors: errorMessages,
		});
		return;
	}

	next();
}
