import express from 'express';
import { getDailySales, getMonthlySales, getRevenue, getInventoryStatus, getExpiringMedicines, getTopSelling } from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'pharmacist'));

router.get('/sales/daily', getDailySales);
router.get('/sales/monthly', getMonthlySales);
router.get('/revenue', getRevenue);
router.get('/inventory-status', getInventoryStatus);
router.get('/expiring-medicines', getExpiringMedicines);
router.get('/top-selling', getTopSelling);

export default router;
