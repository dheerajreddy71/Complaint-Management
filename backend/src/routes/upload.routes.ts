import { Router, Request, Response } from "express";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import multer from "multer";
import config from "../config";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadLimiter } from "../middleware/rateLimit.middleware";
import logger from "../utils/logger";

const router: Router = Router();

cloudinary.config({
	cloud_name: config.cloudinary.cloudName,
	api_key: config.cloudinary.apiKey,
	api_secret: config.cloudinary.apiSecret,
});

const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = [
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"application/pdf",
		];

		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only images and PDFs are allowed."));
		}
	},
});

router.post(
	"/",
	authenticateToken,
	uploadLimiter,
	upload.single("file"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.file) {
				res.status(400).json({
					success: false,
					message: "No file uploaded",
				});
				return;
			}

			const fileBuffer = req.file.buffer;
			const mimetype = req.file.mimetype;
			const isPdf = mimetype === "application/pdf";

			const uploadResult = await new Promise<UploadApiResponse>(
				(resolve, reject) => {
					const uploadStream = cloudinary.uploader.upload_stream(
						{
							resource_type: isPdf ? "raw" : "image",
							folder: "complaint_portal",
							allowed_formats: isPdf
								? ["pdf"]
								: ["jpg", "jpeg", "png", "gif", "webp"],
						},
						(error, result) => {
							if (error) {
								reject(error);
							} else if (result) {
								resolve(result);
							} else {
								reject(new Error("Upload failed"));
							}
						}
					);

					uploadStream.end(fileBuffer);
				}
			);

			res.status(200).json({
				success: true,
				message: "File uploaded successfully",
				data: {
					url: uploadResult.secure_url,
					publicId: uploadResult.public_id,
					format: uploadResult.format,
					size: uploadResult.bytes,
				},
			});

			logger.info("File uploaded successfully", {
				publicId: uploadResult.public_id,
				format: uploadResult.format,
				size: uploadResult.bytes,
				userId: (req as any).user?.id,
			});
		} catch (error: any) {
			logger.error("Upload error", {
				error: error.message,
				userId: (req as any).user?.id,
			});
			res.status(500).json({
				success: false,
				message: "Failed to upload file. Please try again.",
			});
		}
	}
);

router.delete(
	"/:publicId",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { publicId } = req.params;

			await cloudinary.uploader.destroy(publicId);

			logger.info("File deleted", {
				publicId,
				userId: (req as any).user?.id,
			});

			res.status(200).json({
				success: true,
				message: "File deleted successfully",
			});
		} catch (error: any) {
			logger.error("Delete error", {
				error: error.message,
				publicId: req.params.publicId,
			});
			res.status(500).json({
				success: false,
				message: "Failed to delete file",
			});
		}
	}
);

export default router;
