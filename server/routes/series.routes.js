import { Router } from 'express';
import { listSeries, getSeries, createSeries, updateSeries, deleteSeries } from '../controllers/series.controller.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { seriesRules, idParam } from '../middleware/validators.js';

const router = Router();
router.get('/', optionalAuth, listSeries);
router.get('/:id', optionalAuth, getSeries);
router.post('/', adminOnly, validate(seriesRules(false)), createSeries);
router.put('/:id', adminOnly, validate([...idParam, ...seriesRules(true)]), updateSeries);
router.delete('/:id', adminOnly, validate(idParam), deleteSeries);
export default router;
