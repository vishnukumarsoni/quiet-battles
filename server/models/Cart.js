import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// A server-side cart. Either owned by a logged-in user (userId) or by a guest (cartKey).
const Cart = sequelize.define(
  'Cart',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    cartKey: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  },
  { tableName: 'carts' }
);

export default Cart;
