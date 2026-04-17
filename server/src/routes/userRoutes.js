import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../validations/userValidation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', validate(userIdSchema), getUserById);
router.post('/', authorize('admin'), validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('admin'), validate(userIdSchema), deleteUser);
router.patch('/:id/activate', authorize('admin'), validate(userIdSchema), toggleUserStatus);

export default router;
