import express from 'express';
import { register, login, logout, refreshToken, getMe, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../validations/authValidation.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
