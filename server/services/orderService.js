import crypto from 'node:crypto';
import { Op, Transaction, literal } from 'sequelize';
import { sequelize, Order, OrderItem, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { priceItems } from './cartService.js';

const makeOrderNumber = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `QB-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// Everything happens in ONE database transaction: if any step fails nothing is saved
// and no stock is taken. This also prevents two shoppers buying the last item.
export async function placeOrder({ customer, shippingAddress, items, userId }) {
  // IMMEDIATE (SQLite only, ignored by PostgreSQL) takes the write lock at the start,
  // so two shoppers are handled one after the other instead of colliding half-way.
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (transaction) => {
    const { lines, problems, subtotal } = await priceItems(items, { transaction });
    if (problems.length > 0) {
      throw new ApiError(409, 'Some items in your cart have changed. Please review your cart.', problems);
    }

    // Take stock atomically: the UPDATE only succeeds while enough stock remains.
    for (const line of lines) {
      const [affected] = await Product.update(
        { stock: literal(`stock - ${Number(line.quantity)}`) },
        { where: { id: line.productId, stock: { [Op.gte]: line.quantity } }, transaction }
      );
      if (affected === 0) {
        throw new ApiError(409, `${line.product.name} just sold out`, [
          { productId: line.productId, size: line.size, reason: 'sold_out' },
        ]);
      }
    }

    const order = await Order.create(
      {
        orderNumber: makeOrderNumber(),
        userId: userId || null,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        shippingAddress,
        totalAmount: subtotal,
        paymentStatus: 'pending', // demo checkout: no real payment is taken
        orderStatus: 'pending',
      },
      { transaction }
    );

    await OrderItem.bulkCreate(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        name: l.product.name,
        price: l.unitPrice,
        image: l.product.images[0] || '',
        size: l.size,
        quantity: l.quantity,
      })),
      { transaction }
    );

    return Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }], transaction });
  });
}

// Cancelling an order puts the stock back (once).
export async function restockOrder(order) {
  const items = await OrderItem.findAll({ where: { orderId: order.id } });
  await Promise.all(
    items
      .filter((i) => i.productId)
      .map((i) => Product.update({ stock: literal(`stock + ${Number(i.quantity)}`) }, { where: { id: i.productId } }))
  );
}
