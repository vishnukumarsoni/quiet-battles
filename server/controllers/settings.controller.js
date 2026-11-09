import { Setting } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import pick from '../utils/pick.js';
import { ok } from '../utils/respond.js';
import { SETTING_KEYS } from '../middleware/validators.js';

export const DEFAULT_SETTINGS = {
  siteName: 'QUIET BATTLES™',
  tagline: 'Wear your battles.',
  announcement: 'Demo store. Checkout is a demonstration and no payment is taken.',
  contactEmail: 'hello@quietbattles.example',
  contactPhone: '',
  address: '',
  instagram: 'https://instagram.com/',
  twitter: 'https://x.com/',
  youtube: 'https://youtube.com/',
};

export async function readSettings() {
  const rows = await Setting.findAll();
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export const getSettings = asyncHandler(async (_req, res) => ok(res, await readSettings()));

export const updateSettings = asyncHandler(async (req, res) => {
  const data = pick(req.body, SETTING_KEYS);
  await Promise.all(Object.entries(data).map(([key, value]) => Setting.upsert({ key, value: String(value).trim() })));
  return ok(res, await readSettings());
});
