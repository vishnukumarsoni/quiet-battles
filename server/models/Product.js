import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const SIZES = ['S', 'M', 'L', 'XL'];

const Product = sequelize.define(
  'Product',
  {
    name: { type: DataTypes.STRING(140), allowNull: false, validate: { len: [2, 140] } },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    // Bullet points shown in "Product details" (fabric, fit, care...)
    details: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      // PostgreSQL returns DECIMAL as a string; always hand a Number to the API.
      get() {
        return Number(this.getDataValue('price'));
      },
    },
    images: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    availableSizes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: SIZES,
      set(value) {
        // Keep sizes in S, M, L, XL order and drop duplicates
        const list = Array.isArray(value) ? value : [];
        this.setDataValue('availableSizes', SIZES.filter((s) => list.includes(s)));
      },
    },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    category: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'General' },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [['draft', 'published']] },
    },
  },
  { tableName: 'products', indexes: [{ fields: ['status'] }, { fields: ['category'] }] }
);

export default Product;
