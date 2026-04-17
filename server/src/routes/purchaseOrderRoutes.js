import express from 'express';
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  receivePurchaseOrder
} from '../controllers/purchaseOrderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  receivePurchaseOrderSchema,
  purchaseOrderIdSchema
} from '../validations/purchaseOrderValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'pharmacist'), getAllPurchaseOrders);
router.get('/:id', authorize('admin', 'pharmacist'), validate(purchaseOrderIdSchema), getPurchaseOrderById);
router.post('/', authorize('admin'), validate(createPurchaseOrderSchema), createPurchaseOrder);
router.patch('/:id/status', authorize('admin'), validate(updatePurchaseOrderStatusSchema), updatePurchaseOrderStatus);
router.post('/:id/receive', authorize('admin', 'pharmacist'), validate(receivePurchaseOrderSchema), receivePurchaseOrder);

export default router;
