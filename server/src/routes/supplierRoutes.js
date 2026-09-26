import express from 'express';
import { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { getSupplierAccount, recordSupplierPayment } from '../controllers/supplierAccountController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema, supplierIdSchema } from '../validations/supplierValidation.js';
import { supplierPaymentSchema } from '../validations/supplierAccountValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'pharmacist'), getAllSuppliers);
router.get('/:id/account', authorize('admin', 'pharmacist'), validate(supplierIdSchema), getSupplierAccount);
router.post('/:id/payments', authorize('admin'), validate(supplierPaymentSchema), recordSupplierPayment);
router.get('/:id', authorize('admin', 'pharmacist'), validate(supplierIdSchema), getSupplierById);
router.post('/', authorize('admin'), validate(createSupplierSchema), createSupplier);
router.put('/:id', authorize('admin'), validate(updateSupplierSchema), updateSupplier);
router.delete('/:id', authorize('admin'), validate(supplierIdSchema), deleteSupplier);

export default router;
