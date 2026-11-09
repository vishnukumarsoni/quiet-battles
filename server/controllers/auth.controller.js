import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { COOKIE_NAME, credentialVersion } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const cookieOptions = () => ({
  httpOnly: true, // JavaScript on the page can never read this cookie
  secure: env.isProd || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
  path: '/',
});

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.scope('withPassword').findOne({ where: { email: email.toLowerCase() } });
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password');

  const token = jwt.sign({ sub: user.id, role: user.role, credentialVersion: credentialVersion(user.passwordHash) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  const { exp } = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: exp * 1000 - Date.now() });
  return ok(res, { user: publicUser(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return ok(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.scope('withPassword').findByPk(req.user.id);
  const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  return ok(res, { message: 'Password updated' });
});
