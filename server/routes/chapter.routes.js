import { Router } from 'express';
import { listChapters, getChapter, createChapter, updateChapter, deleteChapter } from '../controllers/chapter.controller.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chapterRules, idParam } from '../middleware/validators.js';

const router = Router();
router.get('/', optionalAuth, listChapters);
router.get('/:id', optionalAuth, getChapter);
router.post('/', adminOnly, validate(chapterRules(false)), createChapter);
router.put('/:id', adminOnly, validate([...idParam, ...chapterRules(true)]), updateChapter);
router.delete('/:id', adminOnly, validate(idParam), deleteChapter);
export default router;
