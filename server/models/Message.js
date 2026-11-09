import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Message = sequelize.define(
  'Message',
  {
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
    message: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'messages' }
);

export default Message;
