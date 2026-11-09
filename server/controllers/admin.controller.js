import { Op } from 'sequelize';
import { Product, Series, Chapter, Order, OrderItem, Message, Subscriber } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';

const LOW_STOCK = 5;

export const getStats = asyncHandler(async (_req, res) => {
  const [products, series, chapters, orders, unreadMessages, subscribers, revenue, recentOrders, lowStock] = await Promise.all([
    Product.count(),
    Series.count(),
    Chapter.count(),
    Order.count(),
    Message.count({ where: { isRead: false } }),
    Subscriber.count(),
    Order.sum('totalAmount', { where: { orderStatus: { [Op.ne]: 'cancelled' } } }),
    Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 6,
      include: [{ model: OrderItem, as: 'items', separate: true }],
    }),
    Product.findAll({
      where: { stock: { [Op.lte]: LOW_STOCK } },
      attributes: ['id', 'name', 'stock', 'status'],
      order: [['stock', 'ASC']],
      limit: 6,
    }),
  ]);
  return ok(res, {
    totals: { products, series, chapters, orders, unreadMessages, subscribers },
    revenue: revenue || 0,
    recentOrders,
    lowStock,
  });
});
