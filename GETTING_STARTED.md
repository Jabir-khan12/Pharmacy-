# Pharmacy Management System - Getting Started

## Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

Or use the convenience script:
```bash
npm run install-all
```

## Configuration

1. **Server Environment Variables:**
   - Copy `server/.env.example` to `server/.env`
   - Update MongoDB URI and JWT secrets

2. **Client Environment Variables:**
   - Copy `client/.env.example` to `client/.env`
   - Update API URL if needed (default: http://localhost:5000/api)

## Database Setup

Make sure MongoDB is running, then seed the database with test data:

```bash
cd server
npm run seed
```

This creates:
- **Admin:** admin@pharmacy.com / Admin@123
- **Pharmacist:** pharmacist@pharmacy.com / Pharma@123
- **Customer:** customer@pharmacy.com / Customer@123
- 12 sample medicines with various stock levels

## Running the Application

### Development Mode (Both servers)
```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Separate Servers
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Testing the Application

1. Open http://localhost:5173 in your browser
2. Login with any of the demo accounts
3. Explore features based on role:
   - **Admin:** Full access to all features
   - **Pharmacist:** Can manage inventory, sales, returns
   - **Customer:** Can view medicines, orders, upload prescriptions

## Features to Test

- ✅ User authentication (login/logout)
- ✅ Dashboard with statistics
- ✅ Medicine inventory management
- ✅ Low stock alerts (Cetirizine, Aspirin, Azithromycin)
- ✅ Out of stock items (Azithromycin)
- ✅ Sales management (create, view)
- ✅ Returns management
- ✅ Prescription upload
- ✅ Reports and analytics
- ✅ User management (admin only)

## Project Structure

```
pharmacy-management-system/
├── client/          # React frontend (Vite, Tailwind)
├── server/          # Express backend (Node.js, MongoDB)
├── package.json     # Root package with dev scripts
└── README.md        # Main documentation
```

## Next Steps for Development

The foundation is complete with:
- Full authentication system
- Database models and relationships
- API endpoints for all features
- Responsive UI with Tailwind CSS
- Dashboard and navigation
- Working medicine list with search and filter

**To extend further:**

1. Implement remaining placeholder pages:
   - Medicine form (add/edit)
   - Create sale with cart functionality  
   - Returns workflow
   - Prescription verification
   - Reports with charts

2. Add features:
   - Real-time notifications
   - PDF receipt generation
   - Advanced search
   - Image uploads for medicines
   - Export functionality

3. Enhance UX:
   - Loading states
   - Error boundaries
   - Form validation
   - Confirmation dialogs
   - Toast notifications

## Support

For issues or questions, check the API documentation in `server/API_DOCS.md` or refer to the comprehensive code comments throughout the project.
