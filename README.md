# 🎯 Digital Complaint Management Portal

A comprehensive full-stack web application for managing and tracking complaints efficiently with role-based access control, real-time status updates, and detailed analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Sample Users](#sample-users)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [License](#license)

## 🌟 Overview

The Digital Complaint Management Portal is a modern web application designed to streamline complaint registration, assignment, tracking, and resolution processes. It features role-based dashboards for users, staff members, and administrators, ensuring efficient workflow management.

### Key Highlights

- **Multi-Role System**: Distinct interfaces for Users, Staff, and Administrators
- **Real-Time Tracking**: Live status updates and deadline monitoring
- **Smart Assignment**: Category-based automatic staff assignment with department matching
- **Rich Analytics**: Comprehensive dashboards with statistics and performance metrics
- **File Upload Support**: Attach images and documents to complaints
- **Responsive Design**: Mobile-first, works seamlessly across all devices
- **Secure Authentication**: JWT-based auth with password hashing and rate limiting

## ✨ Features

### For Users
- Register and submit complaints with detailed descriptions
- Upload supporting documents/images
- Track complaint status in real-time
- View assigned staff information
- Provide feedback and ratings after resolution
- Personal dashboard with complaint history

### For Staff Members
- View assigned complaints filtered by department
- Update complaint status (Assigned → In-progress → Resolved)
- Add resolution notes and responses
- Track personal performance metrics
- Deadline alerts and overdue warnings
- Department-specific complaint filtering

### For Administrators
- Comprehensive overview dashboard with analytics
- Manage all users (promote users to staff, assign departments)
- Manually assign complaints to staff members
- View staff performance metrics and workload
- Category-wise complaint distribution
- System-wide statistics and trends

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 16
- **UI Library**: Angular Material
- **Language**: TypeScript 5.x
- **Styling**: SCSS
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router
- **Package Manager**: pnpm

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 8.0
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Validation**: Custom middleware
- **Security**: bcrypt, helmet, cors
- **Logging**: Winston
- **Package Manager**: pnpm

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher
- **MySQL**: v8.0 or higher
- **Git**: Latest version

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dheerajreddy71/Complaint-Management.git
cd Complaint-Management
```

### 2. Install Backend Dependencies

```bash
cd backend
pnpm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
pnpm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=complaint_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### Frontend Configuration

Update `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

## 💾 Database Setup

### 1. Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE complaint_management;
USE complaint_management;
```

### 2. Run Migrations

The application automatically creates tables on first run, or manually:

```bash
cd backend
pnpm run migrate
```

### 3. Seed Sample Data

Populate the database with sample users and complaints:

```bash
cd backend
pnpm seed
```

This creates:
- 1 Admin user
- 6 Staff members (across different departments)
- 10 Regular users
- 30 Sample complaints with various statuses

## 🏃 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd backend
pnpm dev
```

Backend runs on: `http://localhost:3000`

#### Start Frontend Server

```bash
cd frontend
pnpm start
```

Frontend runs on: `http://localhost:4200`

### Production Build

#### Build Backend

```bash
cd backend
pnpm build
pnpm start:prod
```

#### Build Frontend

```bash
cd frontend
pnpm build
```

Serve the `frontend/dist` folder using a web server (nginx, Apache, etc.)

## 👥 Sample Users

After running the seed script, use these credentials:

### Administrator Account
```
Email: admin@system.com
Password: Admin@123
Role: Admin
Access: Full system access, user management, analytics
```

### Staff Members

| Name | Email | Password | Department | Access |
|------|-------|----------|------------|--------|
| Sarah Johnson | sarah.johnson@staff.com | Staff@123 | Plumbing | Plumbing complaints |
| Mike Chen | mike.chen@staff.com | Staff@123 | Electrical | Electrical complaints |
| Emily Davis | emily.davis@staff.com | Staff@123 | Facility | Facility complaints |
| David Wilson | david.wilson@staff.com | Staff@123 | IT | IT & Security complaints |
| Lisa Anderson | lisa.anderson@staff.com | Staff@123 | Cleaning | Cleaning complaints |
| James Taylor | james.taylor@staff.com | Staff@123 | Security | Security complaints |

### Regular Users

| Name | Email | Password | Access |
|------|-------|----------|--------|
| John Smith | john.smith@example.com | User@123 | Submit & track complaints |
| Emma Watson | emma.watson@example.com | User@123 | Submit & track complaints |
| Oliver Robinson | oliver.robinson@example.com | User@123 | Submit & track complaints |
| Sophia Martinez | sophia.martinez@example.com | User@123 | Submit & track complaints |
| William Brown | william.brown@example.com | User@123 | Submit & track complaints |
| Ava Garcia | ava.garcia@example.com | User@123 | Submit & track complaints |
| Liam Miller | liam.miller@example.com | User@123 | Submit & track complaints |
| Isabella Jones | isabella.jones@example.com | User@123 | Submit & track complaints |
| Noah Davis | noah.davis@example.com | User@123 | Submit & track complaints |
| Mia Rodriguez | mia.rodriguez@example.com | User@123 | Submit & track complaints |

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Complaint Endpoints

#### Create Complaint
```http
POST /api/complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Broken Water Pipe",
  "description": "Water pipe burst in room 301",
  "category": "plumbing",
  "priority": "High",
  "location": "Building A, Floor 3, Room 301"
}
```

#### Get All Complaints
```http
GET /api/complaints
Authorization: Bearer <token>
```

#### Get Complaint by ID
```http
GET /api/complaints/:id
Authorization: Bearer <token>
```

#### Update Complaint Status (Staff/Admin)
```http
PUT /api/complaints/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "In-progress"
}
```

#### Assign Complaint (Admin)
```http
PUT /api/complaints/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "staff_id": 5
}
```

#### Add Resolution Notes (Staff)
```http
PUT /api/complaints/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Resolved",
  "resolution_notes": "Pipe replaced and tested successfully"
}
```

#### Submit Feedback (User)
```http
POST /api/complaints/:id/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "feedback_text": "Very satisfied with the quick response",
  "feedback_rating": 5
}
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```

#### Update User Role
```http
PATCH /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "Staff",
  "department": "Plumbing"
}
```

#### Get Staff Members
```http
GET /api/users/staff
Authorization: Bearer <token>
```

### File Upload

#### Upload Complaint Attachment
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

## 📁 Project Structure

```
complaint-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts              # Configuration management
│   │   ├── database/
│   │   │   └── connection.ts         # MySQL connection
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT authentication
│   │   │   ├── error.middleware.ts   # Error handling
│   │   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   │   ├── requestId.middleware.ts # Request tracking
│   │   │   └── validation.middleware.ts # Input validation
│   │   ├── models/
│   │   │   ├── complaint.model.ts    # Complaint model
│   │   │   └── user.model.ts         # User model
│   │   ├── routes/
│   │   │   ├── auth.routes.ts        # Auth endpoints
│   │   │   ├── complaint.routes.ts   # Complaint endpoints
│   │   │   └── upload.routes.ts      # File upload
│   │   ├── scripts/
│   │   │   └── seed.ts               # Database seeder
│   │   ├── utils/
│   │   │   └── logger.ts             # Winston logger
│   │   ├── validators/
│   │   │   └── index.ts              # Validation schemas
│   │   └── server.ts                 # Express server
│   ├── logs/                         # Application logs
│   ├── uploads/                      # Uploaded files
│   ├── .env                          # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── admin-complaint-detail/
│   │   │   │   ├── admin-complaints/
│   │   │   │   ├── admin-dashboard/  # Admin overview
│   │   │   │   ├── admin-users/      # User management
│   │   │   │   ├── complaint-details/
│   │   │   │   ├── complaint-list/
│   │   │   │   ├── login/
│   │   │   │   ├── profile/
│   │   │   │   ├── registration/
│   │   │   │   ├── shared/           # Shared components
│   │   │   │   ├── staff-complaint-detail/
│   │   │   │   ├── staff-complaints/
│   │   │   │   ├── staff-dashboard/  # Staff overview
│   │   │   │   ├── unauthorized/
│   │   │   │   └── user-dashboard/   # User overview
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts     # Route protection
│   │   │   │   └── guest.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts # JWT injection
│   │   │   ├── models/
│   │   │   │   ├── complaint.model.ts
│   │   │   │   └── user.model.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts   # Authentication
│   │   │   │   ├── complaint.service.ts # Complaint API
│   │   │   │   └── upload.service.ts # File upload
│   │   │   ├── app-routing.module.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.module.ts
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Fine-grained permission control
- **Protected Routes**: Frontend and backend route guards

### Input Validation
- **Request Validation**: Schema-based validation middleware
- **XSS Prevention**: Input sanitization
- **SQL Injection Protection**: Parameterized queries
- **File Upload Validation**: Type and size restrictions

### Security Headers
- **Helmet.js**: Security headers middleware
- **CORS**: Configured cross-origin resource sharing
- **Rate Limiting**: Prevent brute force attacks
- **Request ID Tracking**: Audit trail

### Data Protection
- **Environment Variables**: Sensitive data in .env
- **Secure Password Policy**: Minimum requirements enforced
- **Session Management**: Token expiration and renewal

## 🎨 UI/UX Features

### Design Principles
- **Material Design**: Angular Material components
- **Responsive Layout**: Mobile-first approach
- **Glassmorphism**: Modern frosted-glass effects
- **Dark Mode Ready**: Theme-aware components
- **Microinteractions**: Smooth animations and transitions

### User Experience
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Empty States**: Guidance for no-data scenarios
- **Toast Notifications**: Real-time feedback
- **Pagination**: Efficient data display
- **Search & Filter**: Quick data access
- **Inline Editing**: Streamlined workflows

## 📊 Performance Optimizations

- **Lazy Loading**: Route-based code splitting
- **Change Detection**: OnPush strategy where applicable
- **Caching**: API response caching
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient DB connections
- **Compression**: Response gzip compression

## 🧪 Testing

### Backend Tests
```bash
cd backend
pnpm test
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

## 🐛 Known Issues & Future Enhancements

### Planned Features
- [ ] Email notifications for complaint updates
- [ ] SMS alerts for critical complaints
- [ ] Advanced analytics and reporting
- [ ] Export complaints to PDF/Excel
- [ ] Real-time chat between user and staff
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Push notifications

### Known Limitations
- File upload limited to 5MB
- Single file per complaint
- No real-time updates (requires refresh)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dheeraj Reddy**

- GitHub: [@dheerajreddy71](https://github.com/dheerajreddy71)
- Email: byreddydheerajreddy@gmail.com

## 🙏 Acknowledgments

- Angular team for the amazing framework
- Express.js community
- Angular Material Design team
- All open-source contributors

## 📞 Support

For support, email dheerajreddy71@example.com or open an issue in the GitHub repository.

---

**Made with ❤️ by Dheeraj Reddy**
