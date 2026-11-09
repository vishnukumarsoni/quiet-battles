import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMinutes, max, message, extra = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest, // keep automated tests fast; real environments are always limited
    handler: (_req, res) => res.status(429).json({ success: false, message }),
    ...extra,
  });

// Whole API: generous (a normal visit is ~3 calls per page), it only stops runaway scripts.
export const apiLimiter = make(15, 1000, 'Too many requests. Please slow down.');
// Login: only FAILED attempts count, 10 per 15 minutes per IP.
export const loginLimiter = make(15, 10, 'Too many login attempts. Try again in 15 minutes.', {
  skipSuccessfulRequests: true,
});
export const orderLimiter = make(60, 20, 'Too many orders from this connection. Try again later.');
export const formLimiter = make(60, 10, 'Too many submissions. Try again later.');
export const uploadLimiter = make(15, 100, 'Too many uploads. Try again shortly.');
