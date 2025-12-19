import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { initializeDatabase } from "./database/connection";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { generalLimiter } from "./middleware/rateLimit.middleware";
import authRoutes from "./routes/auth.routes";
import complaintRoutes from "./routes/complaint.routes";
import uploadRoutes from "./routes/upload.routes";
import config from "./config";
import logger from "./utils/logger";

const app: Application = express();

// Security middleware - must be first
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
				fontSrc: ["'self'", "https://fonts.gstatic.com"],
				imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
				scriptSrc: ["'self'"],
			},
		},
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
);

// Response compression
app.use(compression());

// CORS configuration
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:4200",
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request ID and logging middleware
app.use(requestIdMiddleware);

// General rate limiting
app.use("/api", generalLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
		timestamp: new Date().toISOString(),
		requestId: req.requestId,
	});
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
	try {
		await initializeDatabase();

		app.listen(config.port, () => {
			logger.info("Server started successfully", {
				port: config.port,
				environment: config.nodeEnv,
				database: config.database.name,
			});
			console.log(`\n========================================`);
			console.log(`  Complaint Management Portal Backend`);
			console.log(`========================================`);
			console.log(`  Server running on port ${config.port}`);
			console.log(`  Environment: ${config.nodeEnv}`);
			console.log(`  API Base URL: http://localhost:${config.port}/api`);
			console.log(`  Database: ${config.database.name}`);
			console.log(`========================================\n`);
		});
	} catch (error) {
		logger.error("Failed to start server", { error });
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
