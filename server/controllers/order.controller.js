import { Order, OrderItem } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import pick from '../utils/pick.js';
import { ok, created } from '../utils/respond.js';
import { getPagination, pageMeta, searchClause } from '../utils/query.js';
import { placeOrder, restockOrder } from '../services/orderService.js';

const ADDRESS_FIELDS = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'];

// Public: guests can place an order. (Demo checkout: payment stays "pending".)
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, shippingAddress, items } = req.body;
  const order = await placeOrder({
    customer: pick(customer, ['name', 'email', 'phone']),
    shippingAddress: pick(shippingAddress, ADDRESS_FIELDS),
    items,
    userId: req.user?.id,
  });
  return created(res, order);
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 15, maxLimit: 100 });
  const where = {};
  if (req.query.orderStatus) where.orderStatus = String(req.query.orderStatus);
  if (req.query.paymentStatus) where.paymentStatus = String(req.query.paymentStatus);
  const search = searchClause(['Order.orderNumber', 'Order.customerName', 'Order.customerEmail'], req.query.q);
  if (search) Object.assign(where, search);

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem, as: 'items', separate: true }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return ok(res, rows, pageMeta(page, limit, count));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
  if (!order) throw new ApiError(404, 'Order not found');
  return ok(res, order);
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
  if (!order) throw new ApiError(404, 'Order not found');
  const data = pick(req.body, ['orderStatus', 'paymentStatus']);

  const wasCancelled = order.orderStatus === 'cancelled';
  if (wasCancelled && data.orderStatus && data.orderStatus !== 'cancelled') {
    throw new ApiError(409, 'A cancelled order cannot be reopened');
  }
  await order.update(data);
  if (!wasCancelled && data.orderStatus === 'cancelled') await restockOrder(order);
  return ok(res, order);
});
