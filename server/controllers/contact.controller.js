import { Message, Subscriber } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import pick from '../utils/pick.js';
import { ok, created } from '../utils/respond.js';
import { getPagination, pageMeta } from '../utils/query.js';

export const sendMessage = asyncHandler(async (req, res) => {
  await Message.create(pick(req.body, ['name', 'email', 'message']));
  return created(res, { message: 'Thank you. Your message has been received.' });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const { rows, count } = await Message.findAndCountAll({ order: [['createdAt', 'DESC']], limit, offset });
  return ok(res, rows, pageMeta(page, limit, count));
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const msg = await Message.findByPk(req.params.id);
  if (!msg) throw new ApiError(404, 'Message not found');
  await msg.update({ isRead: req.body?.isRead !== false });
  return ok(res, msg);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findByPk(req.params.id);
  if (!msg) throw new ApiError(404, 'Message not found');
  await msg.destroy();
  return ok(res, { message: 'Message deleted' });
});

// Subscribing twice is not an error: we answer the same way and keep one row.
export const subscribe = asyncHandler(async (req, res) => {
  await Subscriber.findOrCreate({ where: { email: req.body.email.toLowerCase() } });
  return created(res, { message: 'You are on the list. Welcome.' });
});

export const listSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 30, maxLimit: 200 });
  const { rows, count } = await Subscriber.findAndCountAll({ order: [['createdAt', 'DESC']], limit, offset });
  return ok(res, rows, pageMeta(page, limit, count));
});

export const deleteSubscriber = asyncHandler(async (req, res) => {
  const sub = await Subscriber.findByPk(req.params.id);
  if (!sub) throw new ApiError(404, 'Subscriber not found');
  await sub.destroy();
  return ok(res, { message: 'Subscriber removed' });
});
