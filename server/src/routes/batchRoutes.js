import express from 'express';
import {
  createBatch,
  getAllBatches,
  getBatchesByMedicine,
  getBatchById,
  adjustBatchQuantity,
  recallBatch,
  getFIFOBatches
} from '../controllers/batchController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBatchSchema,
  adjustBatchSchema,
  recallBatchSchema,
  batchIdSchema,
  medicineIdParamSchema
} from '../validations/batchValidation.js';

const router = express.Router();

router.use(authenticate);

// List / search batches
router.get('/', authorize('admin', 'pharmacist'), getAllBatches);

// Get batches for a specific medicine
router.get('/medicine/:medicineId', authorize('admin', 'pharmacist'), validate(medicineIdParamSchema), getBatchesByMedicine);

// FIFO batches for dispensing
router.get('/medicine/:medicineId/fifo', authorize('admin', 'pharmacist'), validate(medicineIdParamSchema), getFIFOBatches);

// Single batch detail
router.get('/:id', authorize('admin', 'pharmacist'), validate(batchIdSchema), getBatchById);

// Create a new batch
router.post('/', authorize('admin', 'pharmacist'), validate(createBatchSchema), createBatch);

// Adjust batch quantity (manual adjustment)
router.patch('/:id/adjust', authorize('admin'), validate(adjustBatchSchema), adjustBatchQuantity);

// Recall a batch
router.patch('/:id/recall', authorize('admin'), validate(recallBatchSchema), recallBatch);

export default router;
