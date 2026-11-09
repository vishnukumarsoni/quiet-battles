import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const Order = sequelize.define(
  'Order',
  {
    orderNumber: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    customerName: { type: DataTypes.STRING(120), allowNull: false },
    customerEmail: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
    customerPhone: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '' },
    shippingAddress: { type: DataTypes.JSON, allowNull: false },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      get() {
        return Number(this.getDataValue('totalAmount'));
      },
    },
    paymentStatus: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [PAYMENT_STATUSES] },
    },
    orderStatus: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [ORDER_STATUSES] },
    },
  },
  { tableName: 'orders', indexes: [{ fields: ['orderStatus'] }, { fields: ['customerEmail'] }] }
);

export default Order;
