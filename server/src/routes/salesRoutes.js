import express from 'express';
import { createSale, getAllSales, getSalesSummary, getSaleById, getCustomerSales, generateReceipt } from '../controllers/salesController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSaleSchema, saleIdSchema } from '../validations/salesValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin', 'pharmacist'), validate(createSaleSchema), createSale);
router.get('/', getAllSales);
router.get('/summary', getSalesSummary);
router.get('/customer/:customerId', getCustomerSales);
router.get('/:id', validate(saleIdSchema), getSaleById);
router.get('/:id/receipt', validate(saleIdSchema), generateReceipt);

export default router;
