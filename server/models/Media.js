import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// One row per uploaded image, so the admin can browse, replace and delete them.
const Media = sequelize.define(
  'Media',
  {
    url: { type: DataTypes.STRING(500), allowNull: false },
    publicId: { type: DataTypes.STRING(300), allowNull: false },
    storage: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'local' },
    originalName: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    mimeType: { type: DataTypes.STRING(40), allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'media' }
);

export default Media;
