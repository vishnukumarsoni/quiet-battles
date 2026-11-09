import { Router } from 'express';
import { uploadImages, listMedia, replaceMedia, deleteMedia } from '../controllers/upload.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { receiveImages, checkImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../middleware/validators.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.use(adminOnly, uploadLimiter);
router.get('/', listMedia);
router.post('/', receiveImages, checkImages, uploadImages);
router.put('/:id', validate(idParam), receiveImages, checkImages, replaceMedia);
router.delete('/:id', validate(idParam), deleteMedia);
export default router;
