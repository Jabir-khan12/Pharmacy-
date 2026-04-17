import express from 'express';
import { createReturn, getAllReturns, getReturnById, approveReturn, rejectReturn } from '../controllers/returnController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReturnSchema, approveReturnSchema, rejectReturnSchema, returnIdSchema } from '../validations/returnValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createReturnSchema), createReturn);
router.get('/', authorize('admin', 'pharmacist'), getAllReturns);
router.get('/:id', validate(returnIdSchema), getReturnById);
router.patch('/:id/approve', authorize('admin', 'pharmacist'), validate(approveReturnSchema), approveReturn);
router.patch('/:id/reject', authorize('admin', 'pharmacist'), validate(rejectReturnSchema), rejectReturn);

export default router;
