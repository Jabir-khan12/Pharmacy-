import express from 'express';
import { uploadPrescription, getAllPrescriptions, getPrescriptionById, verifyPrescription, getPrescriptionFile, upload } from '../controllers/prescriptionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { verifyPrescriptionSchema, prescriptionIdSchema } from '../validations/prescriptionValidation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', upload.single('prescriptionFile'), uploadPrescription);
router.get('/', getAllPrescriptions);
router.get('/:id', validate(prescriptionIdSchema), getPrescriptionById);
router.get('/:id/file', validate(prescriptionIdSchema), getPrescriptionFile);
router.patch('/:id/verify', authorize('admin', 'pharmacist'), validate(verifyPrescriptionSchema), verifyPrescription);

export default router;
