import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import config from './src/config/env.js';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import medicineRoutes from './src/routes/medicineRoutes.js';
import salesRoutes from './src/routes/salesRoutes.js';
import returnRoutes from './src/routes/returnRoutes.js';
import prescriptionRoutes from './src/routes/prescriptionRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import purchaseOrderRoutes from './src/routes/purchaseOrderRoutes.js';
import exportRoutes from './src/routes/exportRoutes.js';
import batchRoutes from './src/routes/batchRoutes.js';
import accountingRoutes from './src/routes/accountingRoutes.js';

import errorHandler from './src/middleware/errorHandler.js';
import { authLimiter, apiLimiter } from './src/middleware/rateLimiter.js';
import './src/jobs/scheduledJobs.js';

connectDB();

const app = express();

app.use(helmet());
app.use(cors({
  // Allow the configured client URL, and for development allow any localhost origin
  origin: (incomingOrigin, callback) => {
    // allow non-browser tools (no origin)
    if (!incomingOrigin) return callback(null, true);

    const allowedClient = process.env.CLIENT_URL;
    if (allowedClient && incomingOrigin === allowedClient) return callback(null, true);

    // in development allow any http://localhost:<port>
    if (config.nodeEnv === 'development' && incomingOrigin.startsWith('http://localhost')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiter to all API routes
app.use('/api', apiLimiter);

// Apply strict rate limiter to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/accounting', accountingRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (config.nodeEnv === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, 'public')));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
});

export default app;
