import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { settingsRules } from '../middleware/validators.js';

const router = Router();
router.get('/', getSettings);
router.put('/', adminOnly, validate(settingsRules), updateSettings);
export default router;
