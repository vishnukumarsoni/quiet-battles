import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define(
  'User',
  {
    name: { type: DataTypes.STRING(80), allowNull: false, validate: { notEmpty: true } },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue('email', String(value).trim().toLowerCase());
      },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'customer',
      validate: { isIn: [['admin', 'customer']] },
    },
  },
  {
    tableName: 'users',
    // The hash is never loaded unless we explicitly ask: User.scope('withPassword')
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes: { withPassword: {} },
  }
);

export default User;
