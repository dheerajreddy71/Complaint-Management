import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import config from "../config";

interface User {
	id?: number;
	name: string;
	email: string;
	password: string;
	role: "User" | "Staff" | "Admin";
	department?: string;
	contact_info?: string;
}

interface Complaint {
	user_id: number;
	staff_id?: number;
	title: string;
	description: string;
	category: string;
	priority: string;
	location?: string;
	status: string;
	resolution_notes?: string;
	feedback?: string;
	feedback_rating?: number;
}

async function seedDatabase(): Promise<void> {
	console.log("Connecting to database...");
	console.log("Database name:", config.database.name);

	const connection = await mysql.createConnection({
		host: config.database.host,
		user: config.database.user,
		password: config.database.password,
		database: config.database.name,
	});

	try {
		// Add department column if it doesn't exist
		try {
			await connection.query(
				`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT NULL AFTER role`
			);
			console.log("Department column ensured");
		} catch (e) {
			/* Column may already exist */
		}

		// Check existing users
		const [existingUsers] = await connection.query(
			"SELECT id, email, role FROM users"
		);
		console.log("\nExisting users:", existingUsers);

		// Check if we need to seed
		if (Array.isArray(existingUsers) && existingUsers.length > 0) {
			console.log(
				"\nUsers already exist. Clearing existing data for fresh seed..."
			);
			// Clear existing data for fresh seed
			await connection.query("SET FOREIGN_KEY_CHECKS = 0");
			await connection.query("TRUNCATE TABLE complaints");
			await connection.query("TRUNCATE TABLE users");
			await connection.query("SET FOREIGN_KEY_CHECKS = 1");
			console.log("Existing data cleared.");
		}

		console.log("\nCreating users...");
		const saltRounds = 10;

		// Define all users
		const users: User[] = [
			// Admin
			{
				name: "Admin User",
				email: "admin@portal.com",
				password: "Admin123!",
				role: "Admin",
				contact_info: "9999999999",
			},
			// Plumbing Staff
			{
				name: "Robert Johnson",
				email: "robert.plumber@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Plumbing",
				contact_info: "9111111111",
			},
			{
				name: "Sarah Williams",
				email: "sarah.plumber@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Plumbing",
				contact_info: "9111111112",
			},
			// Electrical Staff
			{
				name: "Michael Brown",
				email: "michael.electric@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Electrical",
				contact_info: "9222222221",
			},
			{
				name: "Emily Davis",
				email: "emily.electric@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Electrical",
				contact_info: "9222222222",
			},
			{
				name: "James Wilson",
				email: "james.electric@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Electrical",
				contact_info: "9222222223",
			},
			// Facility Staff
			{
				name: "David Martinez",
				email: "david.facility@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Facility",
				contact_info: "9333333331",
			},
			{
				name: "Lisa Anderson",
				email: "lisa.facility@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Facility",
				contact_info: "9333333332",
			},
			// IT Staff
			{
				name: "Kevin Thompson",
				email: "kevin.it@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "IT",
				contact_info: "9444444441",
			},
			{
				name: "Anna Garcia",
				email: "anna.it@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "IT",
				contact_info: "9444444442",
			},
			// Cleaning Staff
			{
				name: "Maria Santos",
				email: "maria.cleaning@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Cleaning",
				contact_info: "9555555551",
			},
			{
				name: "Carlos Rivera",
				email: "carlos.cleaning@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Cleaning",
				contact_info: "9555555552",
			},
			// Security Staff
			{
				name: "James Miller",
				email: "james.security@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Security",
				contact_info: "9666666661",
			},
			{
				name: "Patricia Johnson",
				email: "patricia.security@portal.com",
				password: "Staff123!",
				role: "Staff",
				department: "Security",
				contact_info: "9666666662",
			},
			// Regular Users
			{
				name: "John Smith",
				email: "john.smith@example.com",
				password: "User123!",
				role: "User",
				contact_info: "8111111111",
			},
			{
				name: "Emma Watson",
				email: "emma.watson@example.com",
				password: "User123!",
				role: "User",
				contact_info: "8222222222",
			},
			{
				name: "Oliver Robinson",
				email: "oliver.robinson@example.com",
				password: "User123!",
				role: "User",
				contact_info: "8333333333",
			},
		];

		// Insert users and store their IDs
		const userIds: Record<string, number> = {};

		for (const user of users) {
			const hashedPassword = await bcrypt.hash(user.password, saltRounds);
			const [result] = await connection.query<mysql.ResultSetHeader>(
				"INSERT INTO users (name, email, password, role, department, contact_info) VALUES (?, ?, ?, ?, ?, ?)",
				[
					user.name,
					user.email,
					hashedPassword,
					user.role,
					user.department || null,
					user.contact_info,
				]
			);
			userIds[user.email] = result.insertId;
			console.log(`Created ${user.role}: ${user.email} / ${user.password}`);
		}

		console.log("\nCreating complaints...");

		// Get user and staff IDs
		const johnId = userIds["john.smith@example.com"];
		const emmaId = userIds["emma.watson@example.com"];
		const oliverId = userIds["oliver.robinson@example.com"];

		const robertId = userIds["robert.plumber@portal.com"];
		const sarahId = userIds["sarah.plumber@portal.com"];
		const michaelId = userIds["michael.electric@portal.com"];
		const emilyId = userIds["emily.electric@portal.com"];
		const davidId = userIds["david.facility@portal.com"];
		const kevinId = userIds["kevin.it@portal.com"];
		const mariaId = userIds["maria.cleaning@portal.com"];
		const carlosId = userIds["carlos.cleaning@portal.com"];
		const jamesSecurityId = userIds["james.security@portal.com"];
		const patriciaId = userIds["patricia.security@portal.com"];

		// Create complaints
		const complaints: Complaint[] = [
			// Resolved complaints with feedback (for rating calculation)
			{
				user_id: johnId,
				staff_id: robertId,
				title: "Leaking faucet in bathroom",
				description:
					"The bathroom faucet has been leaking for 2 days. Water is dripping constantly.",
				category: "plumbing",
				priority: "Medium",
				location: "Building A, Floor 2, Room 201",
				status: "Resolved",
				resolution_notes:
					"Replaced the worn washer and tightened the faucet. No more leaks.",
				feedback: "Quick and professional service. Very satisfied!",
				feedback_rating: 5,
			},
			{
				user_id: emmaId,
				staff_id: michaelId,
				title: "Flickering lights in office",
				description:
					"The overhead lights in my office keep flickering. It's affecting my work.",
				category: "electrical",
				priority: "High",
				location: "Building B, Floor 3, Office 305",
				status: "Resolved",
				resolution_notes:
					"Replaced faulty ballast and checked all connections. Lights working normally.",
				feedback: "Excellent work! The issue was fixed within hours.",
				feedback_rating: 5,
			},
			{
				user_id: oliverId,
				staff_id: davidId,
				title: "Broken window lock",
				description:
					"The lock on my office window is broken. Security concern.",
				category: "facility",
				priority: "High",
				location: "Building A, Floor 1, Office 102",
				status: "Resolved",
				resolution_notes:
					"Replaced the entire window lock mechanism. Tested and working properly.",
				feedback: "Good service but took a bit longer than expected.",
				feedback_rating: 4,
			},
			{
				user_id: johnId,
				staff_id: emilyId,
				title: "Power outlet not working",
				description:
					"The power outlet near my desk stopped working. Can't charge my laptop.",
				category: "electrical",
				priority: "Medium",
				location: "Building C, Floor 2, Desk 15",
				status: "Resolved",
				resolution_notes:
					"Reset the circuit breaker and replaced the outlet. Tested with multiple devices.",
				feedback: "Problem solved quickly. Thank you!",
				feedback_rating: 5,
			},
			{
				user_id: emmaId,
				staff_id: sarahId,
				title: "Clogged drain in kitchen",
				description:
					"The kitchen sink drain is completely clogged. Water won't drain at all.",
				category: "plumbing",
				priority: "High",
				location: "Building A, Kitchen Area",
				status: "Resolved",
				resolution_notes:
					"Cleared the blockage using a plumber's snake. Advised staff to avoid pouring grease.",
				feedback: "Very helpful and gave good tips to prevent future issues.",
				feedback_rating: 5,
			},
			// In-progress complaints
			{
				user_id: oliverId,
				staff_id: kevinId,
				title: "Computer running slow",
				description:
					"My work computer has been extremely slow for the past week. Takes 10 minutes to boot.",
				category: "other",
				priority: "Medium",
				location: "Building B, Floor 2, Desk 25",
				status: "In-progress",
			},
			{
				user_id: johnId,
				staff_id: robertId,
				title: "Water heater not working",
				description:
					"No hot water in the bathroom. The water heater seems to be malfunctioning.",
				category: "plumbing",
				priority: "High",
				location: "Building C, Floor 1, Bathroom",
				status: "In-progress",
			},
			// Assigned complaints
			{
				user_id: emmaId,
				staff_id: michaelId,
				title: "Emergency lighting not working",
				description:
					"The emergency exit lights on floor 2 are not functioning properly.",
				category: "electrical",
				priority: "Critical",
				location: "Building A, Floor 2, Corridor",
				status: "Assigned",
			},
			{
				user_id: oliverId,
				staff_id: davidId,
				title: "AC not cooling properly",
				description:
					"The air conditioning in the conference room is blowing warm air.",
				category: "facility",
				priority: "Medium",
				location: "Building B, Conference Room 1",
				status: "Assigned",
			},
			// Cleaning complaints
			{
				user_id: johnId,
				staff_id: mariaId,
				title: "Spill in hallway needs cleaning",
				description:
					"There is a large coffee spill in the main hallway. Slippery and hazardous.",
				category: "cleaning",
				priority: "High",
				location: "Building A, Main Hallway",
				status: "Resolved",
				resolution_notes:
					"Area cleaned and dried. Warning sign placed temporarily.",
				feedback: "Very quick response! Area is clean now.",
				feedback_rating: 5,
			},
			{
				user_id: emmaId,
				staff_id: carlosId,
				title: "Restroom needs deep cleaning",
				description:
					"The ladies restroom on floor 3 needs deep cleaning. Unpleasant odor.",
				category: "cleaning",
				priority: "Medium",
				location: "Building B, Floor 3, Ladies Restroom",
				status: "In-progress",
			},
			// Security complaints
			{
				user_id: oliverId,
				staff_id: jamesSecurityId,
				title: "Suspicious person seen near parking",
				description:
					"Noticed an unknown individual lingering near the employee parking area.",
				category: "security",
				priority: "Critical",
				location: "Parking Lot B",
				status: "Resolved",
				resolution_notes:
					"Area patrolled and secured. Individual was a delivery person waiting for pickup.",
				feedback: "Security responded immediately. Felt safe.",
				feedback_rating: 5,
			},
			{
				user_id: johnId,
				staff_id: patriciaId,
				title: "Broken CCTV camera",
				description:
					"The CCTV camera near the main entrance seems to be non-functional.",
				category: "security",
				priority: "High",
				location: "Building A, Main Entrance",
				status: "Assigned",
			},
			// Open complaints (not assigned yet)
			{
				user_id: johnId,
				title: "Toilet constantly running",
				description:
					"The toilet in the men's restroom won't stop running. Wasting water.",
				category: "plumbing",
				priority: "Medium",
				location: "Building A, Floor 1, Men's Restroom",
				status: "Open",
			},
			{
				user_id: emmaId,
				title: "Ceiling light burnt out",
				description:
					"One of the ceiling lights in the break room has burnt out.",
				category: "electrical",
				priority: "Low",
				location: "Building C, Break Room",
				status: "Open",
			},
			{
				user_id: oliverId,
				title: "Door handle loose",
				description:
					"The door handle on the storage room is very loose and may fall off soon.",
				category: "facility",
				priority: "Low",
				location: "Building A, Storage Room",
				status: "Open",
			},
			{
				user_id: emmaId,
				title: "Office carpet stained",
				description:
					"There is a large stain on the carpet in the reception area. Looks unprofessional.",
				category: "cleaning",
				priority: "Low",
				location: "Building A, Reception Area",
				status: "Open",
			},
			{
				user_id: oliverId,
				title: "Access card not working",
				description:
					"My access card is not opening the side entrance door. Tried multiple times.",
				category: "security",
				priority: "Medium",
				location: "Building C, Side Entrance",
				status: "Open",
			},
		];

		// Calculate deadline (3 days from now for demo)
		const deadline = new Date();
		deadline.setDate(deadline.getDate() + 3);

		for (const complaint of complaints) {
			await connection.query(
				`INSERT INTO complaints 
				(user_id, staff_id, title, description, category, priority, location, status, resolution_notes, feedback, feedback_rating, deadline_at) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					complaint.user_id,
					complaint.staff_id || null,
					complaint.title,
					complaint.description,
					complaint.category,
					complaint.priority,
					complaint.location || null,
					complaint.status,
					complaint.resolution_notes || null,
					complaint.feedback || null,
					complaint.feedback_rating || null,
					complaint.status === "Resolved" ? null : deadline,
				]
			);
			console.log(
				`Created complaint: ${complaint.title} (${complaint.status})`
			);
		}

		// Show final state
		const [finalUsers] = await connection.query(
			"SELECT id, name, email, role, department FROM users"
		);
		console.log("\n=== All Users ===");
		console.table(finalUsers);

		const [finalComplaints] = await connection.query(
			"SELECT id, title, category, status, priority FROM complaints"
		);
		console.log("\n=== All Complaints ===");
		console.table(finalComplaints);

		console.log("\n=== Login Credentials ===");
		console.log("Admin: admin@portal.com / Admin123!");
		console.log("\nStaff by Department:");
		console.log("  Plumbing: robert.plumber@portal.com / Staff123!");
		console.log("  Electrical: michael.electric@portal.com / Staff123!");
		console.log("  Facility: david.facility@portal.com / Staff123!");
		console.log("  IT: kevin.it@portal.com / Staff123!");
		console.log("  Cleaning: maria.cleaning@portal.com / Staff123!");
		console.log("  Security: james.security@portal.com / Staff123!");
		console.log("\nUser: john.smith@example.com / User123!");
	} catch (error) {
		console.error("Seed error:", error);
	} finally {
		await connection.end();
		console.log("\nDatabase connection closed.");
	}
}

seedDatabase();
