import { Router } from 'express';
import { sendMessage, listMessages, markMessageRead, deleteMessage } from '../controllers/contact.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { contactRules, idParam } from '../middleware/validators.js';
import { formLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/', formLimiter, validate(contactRules), sendMessage);
router.get('/', adminOnly, listMessages);
router.put('/:id/read', adminOnly, validate(idParam), markMessageRead);
router.delete('/:id', adminOnly, validate(idParam), deleteMessage);
export default router;
