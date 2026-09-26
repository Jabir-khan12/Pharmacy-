import express from 'express';
import { getDailySales, getMonthlySales, getRevenue, getFinancialSummary, getInventoryStatus, getExpiringMedicines, getTopSelling } from '../controllers/reportController.js';
import { getFinancialOverview } from '../controllers/supplierAccountController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'pharmacist'));

router.get('/sales/daily', getDailySales);
router.get('/sales/monthly', getMonthlySales);
router.get('/revenue', getRevenue);
router.get('/financial-summary', getFinancialSummary);
router.get('/inventory-status', getInventoryStatus);
router.get('/expiring-medicines', getExpiringMedicines);
router.get('/top-selling', getTopSelling);
router.get('/financial-overview', getFinancialOverview);

export default router;
