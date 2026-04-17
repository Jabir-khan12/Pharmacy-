import express from 'express';
import { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema, supplierIdSchema } from '../validations/supplierValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'pharmacist'), getAllSuppliers);
router.get('/:id', authorize('admin', 'pharmacist'), validate(supplierIdSchema), getSupplierById);
router.post('/', authorize('admin'), validate(createSupplierSchema), createSupplier);
router.put('/:id', authorize('admin'), validate(updateSupplierSchema), updateSupplier);
router.delete('/:id', authorize('admin'), validate(supplierIdSchema), deleteSupplier);

export default router;
