import express from 'express';
import { getAccountingTransactions, createAccountingTransaction, getAccountingSummary, deleteAccountingTransaction } from '../controllers/accountingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { accountingTransactionSchema, accountingQuerySchema } from '../validations/accountingValidation.js';

const router = express.Router();
router.use(authenticate, authorize('admin'));
router.get('/summary', getAccountingSummary);
router.get('/', getAccountingTransactions);
router.post('/', validate(accountingTransactionSchema), createAccountingTransaction);
router.delete('/:id', validate(accountingQuerySchema), deleteAccountingTransaction);

export default router;
