import { Router } from 'express';
import { login, logout, me, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginRules, passwordRules } from '../middleware/validators.js';
import { loginLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/login', loginLimiter, validate(loginRules), login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.put('/password', protect, validate(passwordRules), changePassword);
export default router;
