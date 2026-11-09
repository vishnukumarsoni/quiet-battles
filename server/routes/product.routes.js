import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { productRules, idParam } from '../middleware/validators.js';

const router = Router();
router.get('/', optionalAuth, listProducts);
router.get('/:id', optionalAuth, getProduct);
router.post('/', adminOnly, validate(productRules(false)), createProduct);
router.put('/:id', adminOnly, validate([...idParam, ...productRules(true)]), updateProduct);
router.delete('/:id', adminOnly, validate(idParam), deleteProduct);
export default router;
