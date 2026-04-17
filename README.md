# Pharmacy Management System

Full-stack MERN Pharmacy Management System with role-based access control, inventory management, batch tracking, sales with tax/discount, purchase orders, prescriptions, and analytics.

## Features

- **Authentication**: JWT-based auth with refresh tokens, role-based access (admin, pharmacist, customer)
- **Medicine Inventory**: Full CRUD, stock tracking, reorder alerts, expiry monitoring
- **Batch/Lot Tracking**: Per-batch inventory with FIFO dispensing, recall support
- **Sales Management**: POS with tax/discount computation, PDF receipt generation
- **Returns**: Return requests with approval workflow, over-return prevention
- **Purchase Orders**: Supplier ordering with receiving workflow, stock auto-update
- **Supplier Management**: Supplier CRUD with contact and payment terms
- **Prescriptions**: Upload and link prescriptions to sales
- **Notifications**: Real-time low-stock/expiry alerts with per-user read tracking
- **Reports & Analytics**: Revenue trends, inventory status, top-selling medicines
- **CSV Export**: Export sales, medicines, inventory, returns, and top-selling data
- **User Management**: Admin user CRUD with profile editing

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts, Lucide    |
| Backend    | Node.js, Express, Mongoose, Joi, PDFKit            |
| Database   | MongoDB                                            |
| Auth       | JWT (access + refresh), bcrypt, rate limiting       |
| DevOps     | Docker, Docker Compose                             |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ (or use Docker)
- npm

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example server/.env
```

Required variables:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret key for JWT access tokens
- `JWT_REFRESH_SECRET` — Secret key for JWT refresh tokens

### 3. Seed sample data

```bash
cd server
npm run seed
```

### 4. Run in development

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Docker Deployment

### Build and run with Docker Compose

```bash
# Set your secrets in a .env file at project root (see .env.example)
docker compose up -d
```

The app will be available at http://localhost:5000

### Build Docker image only

```bash
docker build -t pharmacy-app .
```

## API Endpoints

| Resource          | Base Path             | Auth Required |
|-------------------|-----------------------|---------------|
| Auth              | `/api/auth`           | No (login/register) |
| Users             | `/api/users`          | Yes           |
| Medicines         | `/api/medicines`      | Yes           |
| Batches           | `/api/batches`        | Yes           |
| Sales             | `/api/sales`          | Yes           |
| Returns           | `/api/returns`        | Yes           |
| Prescriptions     | `/api/prescriptions`  | Yes           |
| Suppliers         | `/api/suppliers`      | Yes           |
| Purchase Orders   | `/api/purchase-orders`| Yes           |
| Reports           | `/api/reports`        | Yes           |
| Notifications     | `/api/notifications`  | Yes           |
| CSV Export        | `/api/export`         | Yes           |
| Health            | `/api/health`         | No            |

## Project Structure

```
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Layout, shared components
│       ├── config/          # API configuration
│       ├── context/         # Auth context
│       ├── pages/           # Route pages
│       └── utils/           # Helpers (CSV download, etc.)
├── server/                  # Express backend
│   └── src/
│       ├── config/          # DB connection, env config
│       ├── controllers/     # Route handlers
│       ├── jobs/            # Scheduled jobs (cron)
│       ├── middleware/       # Auth, validation, error handling
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       ├── services/        # Business logic (inventory, sales, returns)
│       ├── utils/           # AppError, JWT utils, CSV helper
│       └── validations/     # Joi schemas
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Default Seed Accounts

| Role        | Email                  | Password    |
|-------------|------------------------|-------------|
| Admin       | admin@pharmacy.com     | Admin@123   |
| Pharmacist  | pharmacist@pharmacy.com| Pharma@123  |
| Customer    | customer@pharmacy.com  | Customer@123|

## License

MIT
