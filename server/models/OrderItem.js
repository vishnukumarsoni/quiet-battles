import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// An order line is a SNAPSHOT (name, price, image) taken at purchase time,
// so editing a product later never rewrites old orders.
const OrderItem = sequelize.define(
  'OrderItem',
  {
    name: { type: DataTypes.STRING(140), allowNull: false },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        return Number(this.getDataValue('price'));
      },
    },
    image: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '' },
    size: { type: DataTypes.STRING(4), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  },
  { tableName: 'order_items' }
);

export default OrderItem;
