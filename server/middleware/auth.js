import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const COOKIE_NAME = 'qb_token';

export const credentialVersion = (passwordHash) =>
  createHmac('sha256', env.jwtSecret).update(passwordHash).digest('hex');

function readToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function userFromToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.scope('withPassword').findByPk(payload.sub);
  if (user && payload.credentialVersion !== credentialVersion(user.passwordHash)) {
    throw new Error('Session is no longer valid');
  }
  if (user) delete user.dataValues.passwordHash;
  return user;
}

// Blocks the request unless a valid login token is present.
export const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, 'Please log in to continue');
  let user;
  try {
    user = await userFromToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }
  if (!user) throw new ApiError(401, 'Account no longer exists');
  req.user = user;
  next();
});

// Role-based access control. Use after protect: router.use(protect, restrictTo('admin'))
export const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to do that'));
  }
  return next();
};

// Attaches req.user when a valid token exists, but never blocks the request.
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = await userFromToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
});

export const adminOnly = [protect, restrictTo('admin')];
