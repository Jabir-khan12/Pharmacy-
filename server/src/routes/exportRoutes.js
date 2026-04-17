import express from 'express';
import { exportSales, exportMedicines, exportInventoryStatus, exportReturns, exportTopSelling } from '../controllers/exportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'pharmacist'));

router.get('/sales', exportSales);
router.get('/medicines', exportMedicines);
router.get('/inventory', exportInventoryStatus);
router.get('/returns', exportReturns);
router.get('/top-selling', exportTopSelling);

export default router;
