import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, validateCart } from '../controllers/cart.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cartAddRules, cartUpdateRules, cartValidateRules } from '../middleware/validators.js';
import { param } from 'express-validator';

const router = Router();
router.use(optionalAuth);
router.post('/validate', validate(cartValidateRules), validateCart); // must stay above "/:itemId"
router.get('/', getCart);
router.post('/', validate(cartAddRules), addToCart);
router.put('/:itemId', validate(cartUpdateRules), updateCartItem);
router.delete('/:itemId', validate([param('itemId').isInt({ min: 1 }).withMessage('Invalid item').toInt()]), removeCartItem);
export default router;
