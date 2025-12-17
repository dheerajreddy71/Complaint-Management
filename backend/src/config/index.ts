import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

interface Config {
	port: number;
	nodeEnv: string;
	database: {
		host: string;
		user: string;
		password: string;
		name: string;
	};
	jwt: {
		secret: string;
		expiresIn: string;
	};
	cloudinary: {
		cloudName: string;
		apiKey: string;
		apiSecret: string;
	};
	// Admin registration settings
	admin: {
		registrationEnabled: boolean;
		registrationKey: string;
	};
}

// Validate required environment variables in production
const validateConfig = (): void => {
	const requiredEnvVars = ["JWT_SECRET"];
	const missingVars = requiredEnvVars.filter(
		(varName) => !process.env[varName]
	);

	if (process.env.NODE_ENV === "production" && missingVars.length > 0) {
		throw new Error(
			`Missing required environment variables in production: ${missingVars.join(
				", "
			)}`
		);
	}

	// Warn about missing JWT_SECRET in development
	if (!process.env.JWT_SECRET) {
		console.warn(
			"\n⚠️  WARNING: JWT_SECRET not set. Using auto-generated secret (changes on restart).\n" +
				"   Set JWT_SECRET in .env file for persistent sessions.\n"
		);
	}
};

validateConfig();

// Generate a random secret for development if not provided
// This ensures the secret is unique per server instance
const generateDevSecret = (): string => {
	return crypto.randomBytes(64).toString("hex");
};

const config: Config = {
	port: parseInt(process.env.PORT || "3000", 10),
	nodeEnv: process.env.NODE_ENV || "development",
	database: {
		host: process.env.DB_HOST || "localhost",
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "",
		name: process.env.DB_NAME || "complaint_portal_",
	},
	jwt: {
		// Use provided secret or generate a secure random one for development
		secret: process.env.JWT_SECRET || generateDevSecret(),
		expiresIn: process.env.JWT_EXPIRES_IN || "24h",
	},
	cloudinary: {
		cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
		apiKey: process.env.CLOUDINARY_API_KEY || "",
		apiSecret: process.env.CLOUDINARY_API_SECRET || "",
	},
	admin: {
		// Admin registration requires a secret key
		registrationEnabled: process.env.ADMIN_REGISTRATION_ENABLED === "true",
		registrationKey: process.env.ADMIN_REGISTRATION_KEY || "",
	},
};

export default config;
