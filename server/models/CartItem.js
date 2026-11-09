import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CartItem = sequelize.define(
  'CartItem',
  {
    size: { type: DataTypes.STRING(4), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1, max: 10 } },
  },
  {
    tableName: 'cart_items',
    indexes: [{ unique: true, fields: ['cartId', 'productId', 'size'] }],
  }
);

export default CartItem;
