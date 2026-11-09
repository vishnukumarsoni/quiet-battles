import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Chapter = sequelize.define(
  'Chapter',
  {
    title: { type: DataTypes.STRING(120), allowNull: false, validate: { len: [2, 120] } },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    chapterNumber: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    // seriesId and relatedProductId are added by the associations in models/index.js
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    storyContent: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    coverImage: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '' },
    galleryImages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [['draft', 'published']] },
    },
  },
  {
    tableName: 'chapters',
    indexes: [
      // A series cannot have two "Chapter 03"s.
      { unique: true, fields: ['seriesId', 'chapterNumber'] },
      { fields: ['status'] },
    ],
  }
);

export default Chapter;
