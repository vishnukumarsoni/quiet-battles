import { Router } from 'express';
import { getStats } from '../controllers/admin.controller.js';
import { adminOnly } from '../middleware/auth.js';

const router = Router();
router.get('/stats', adminOnly, getStats);
export default router;
