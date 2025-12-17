import mysql from "mysql2/promise";
import config from "../config";
import logger from "../utils/logger";

const pool = mysql.createPool({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.name,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

// Helper to safely add index (ignores if already exists)
async function createIndexIfNotExists(
	connection: mysql.Connection,
	tableName: string,
	indexName: string,
	columns: string
): Promise<void> {
	try {
		await connection.query(
			`CREATE INDEX ${indexName} ON ${tableName} (${columns})`
		);
		logger.info(`Index ${indexName} created on ${tableName}`);
	} catch (error: any) {
		// Error 1061 = Duplicate key name (index already exists)
		if (error.errno !== 1061) {
			logger.warn(`Failed to create index ${indexName}: ${error.message}`);
		}
	}
}

export async function initializeDatabase(): Promise<void> {
	try {
		const connection = await mysql.createConnection({
			host: config.database.host,
			user: config.database.user,
			password: config.database.password,
		});

		await connection.query(
			`CREATE DATABASE IF NOT EXISTS ${config.database.name}`
		);
		await connection.query(`USE ${config.database.name}`);

		// Create Users Table
		await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('User', 'Staff', 'Admin') NOT NULL DEFAULT 'User',
                department VARCHAR(50) DEFAULT NULL,
                contact_info VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

		// Add department column if it doesn't exist (migration for existing databases)
		try {
			const [columns]: any = await connection.query(
				`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'department'`,
				[config.database.name]
			);
			if (columns.length === 0) {
				await connection.query(
					`ALTER TABLE users ADD COLUMN department VARCHAR(50) DEFAULT NULL AFTER role`
				);
				logger.info("Added department column to users table");
			}
		} catch (e: any) {
			logger.warn(`Department column migration: ${e.message}`);
		}

		// Create Complaints Table with priority, location, deadline
		await connection.query(`
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                staff_id INT DEFAULT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category ENUM('plumbing', 'electrical', 'facility', 'cleaning', 'security', 'other') NOT NULL,
                priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                location VARCHAR(200) DEFAULT NULL,
                status ENUM('Open', 'Assigned', 'In-progress', 'Resolved') DEFAULT 'Open',
                attachments VARCHAR(500) DEFAULT NULL,
                resolution_notes TEXT DEFAULT NULL,
                feedback TEXT DEFAULT NULL,
                feedback_rating INT DEFAULT NULL,
                deadline_at TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

		// Add new columns if table already exists (migration for existing databases)
		const migrateColumn = async (
			table: string,
			column: string,
			definition: string
		) => {
			try {
				const [cols]: any = await connection.query(
					`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
					[config.database.name, table, column]
				);
				if (cols.length === 0) {
					await connection.query(
						`ALTER TABLE ${table} ADD COLUMN ${definition}`
					);
					logger.info(`Added ${column} column to ${table} table`);
				}
			} catch (e: any) {
				logger.warn(`Migration ${table}.${column}: ${e.message}`);
			}
		};

		await migrateColumn(
			"complaints",
			"priority",
			"priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium' AFTER category"
		);
		await migrateColumn(
			"complaints",
			"location",
			"location VARCHAR(200) DEFAULT NULL AFTER priority"
		);
		await migrateColumn(
			"complaints",
			"deadline_at",
			"deadline_at TIMESTAMP DEFAULT NULL AFTER feedback_rating"
		);

		// Create indexes for better query performance
		logger.info("Creating database indexes...");

		// Users table indexes
		await createIndexIfNotExists(
			connection,
			"users",
			"idx_users_email",
			"email"
		);
		await createIndexIfNotExists(connection, "users", "idx_users_role", "role");

		// Complaints table indexes
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_user_id",
			"user_id"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_staff_id",
			"staff_id"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_status",
			"status"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_category",
			"category"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_priority",
			"priority"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_created_at",
			"created_at"
		);

		// Composite indexes for common query patterns
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_status_created",
			"status, created_at DESC"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_user_status",
			"user_id, status"
		);
		await createIndexIfNotExists(
			connection,
			"complaints",
			"idx_complaints_staff_status",
			"staff_id, status"
		);

		await connection.end();
		logger.info("Database initialized successfully");
		console.log("Database initialized successfully");
	} catch (error) {
		logger.error("Database initialization error", { error });
		console.error("Database initialization error:", error);
		throw error;
	}
}

export default pool;
