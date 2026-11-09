import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Series = sequelize.define(
  'Series',
  {
    title: { type: DataTypes.STRING(120), allowNull: false, validate: { len: [2, 120] } },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    seriesNumber: { type: DataTypes.INTEGER, allowNull: false, unique: true, validate: { min: 1 } },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    coverImage: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '' },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [['draft', 'published']] },
    },
  },
  { tableName: 'series', indexes: [{ fields: ['status'] }] }
);

export default Series;
