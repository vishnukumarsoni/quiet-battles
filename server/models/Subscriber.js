import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Subscriber = sequelize.define(
  'Subscriber',
  {
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue('email', String(value).trim().toLowerCase());
      },
    },
  },
  { tableName: 'subscribers' }
);

export default Subscriber;
