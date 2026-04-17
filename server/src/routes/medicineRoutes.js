import express from 'express';
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  adjustStock,
  getLowStock,
  getExpiringMedicines,
  getStockTransactions
} from '../controllers/medicineController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createMedicineSchema,
  updateMedicineSchema,
  adjustStockSchema,
  medicineIdSchema
} from '../validations/medicineValidation.js';

const router = express.Router();

router.get('/', getAllMedicines);
router.get('/low-stock', authenticate, getLowStock);
router.get('/expiring', authenticate, getExpiringMedicines);
router.get('/:id', validate(medicineIdSchema), getMedicineById);
router.get('/:id/transactions', authenticate, validate(medicineIdSchema), getStockTransactions);

router.post('/', authenticate, authorize('admin', 'pharmacist'), validate(createMedicineSchema), createMedicine);
router.put('/:id', authenticate, authorize('admin', 'pharmacist'), validate(updateMedicineSchema), updateMedicine);
router.delete('/:id', authenticate, authorize('admin'), validate(medicineIdSchema), deleteMedicine);
router.patch('/:id/stock', authenticate, authorize('admin', 'pharmacist'), validate(adjustStockSchema), adjustStock);

export default router;
