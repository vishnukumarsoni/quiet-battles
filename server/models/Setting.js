import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Simple key/value store for site-wide text (tagline, contact email, social links...).
const Setting = sequelize.define(
  'Setting',
  {
    key: { type: DataTypes.STRING(60), primaryKey: true },
    value: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  },
  { tableName: 'settings' }
);

export default Setting;
