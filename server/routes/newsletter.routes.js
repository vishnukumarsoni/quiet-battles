import { Router } from 'express';
import { subscribe, listSubscribers, deleteSubscriber } from '../controllers/contact.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { newsletterRules, idParam } from '../middleware/validators.js';
import { formLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/', formLimiter, validate(newsletterRules), subscribe);
router.get('/', adminOnly, listSubscribers);
router.delete('/:id', adminOnly, validate(idParam), deleteSubscriber);
export default router;
