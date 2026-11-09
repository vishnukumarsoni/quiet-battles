import { Router } from 'express';
import { createOrder, listOrders, getOrder, updateOrder } from '../controllers/order.controller.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderCreateRules, orderUpdateRules, idParam } from '../middleware/validators.js';
import { orderLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/', orderLimiter, optionalAuth, validate(orderCreateRules), createOrder);
router.get('/', adminOnly, listOrders);
router.get('/:id', adminOnly, validate(idParam), getOrder);
router.put('/:id', adminOnly, validate([...idParam, ...orderUpdateRules]), updateOrder);
export default router;
