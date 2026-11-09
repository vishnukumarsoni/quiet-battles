// Loads every model and declares how they relate to each other.
import { sequelize } from '../config/db.js';
import User from './User.js';
import Series from './Series.js';
import Chapter from './Chapter.js';
import Product from './Product.js';
import Cart from './Cart.js';
import CartItem from './CartItem.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Media from './Media.js';
import Setting from './Setting.js';
import Subscriber from './Subscriber.js';
import Message from './Message.js';

// Series 1 ──< * Chapter   (RESTRICT: a series with chapters cannot be deleted)
Series.hasMany(Chapter, { foreignKey: { name: 'seriesId', allowNull: false }, as: 'chapters', onDelete: 'RESTRICT' });
Chapter.belongsTo(Series, { foreignKey: { name: 'seriesId', allowNull: false }, as: 'series' });

// Product 1 ──< * Chapter  (a chapter points at ONE related product; deleting the product just clears the link)
Product.hasMany(Chapter, { foreignKey: { name: 'relatedProductId', allowNull: true }, as: 'chapters', onDelete: 'SET NULL' });
Chapter.belongsTo(Product, { foreignKey: { name: 'relatedProductId', allowNull: true }, as: 'relatedProduct', onDelete: 'SET NULL' });

// Cart 1 ──< * CartItem >── 1 Product
Cart.hasMany(CartItem, { foreignKey: { name: 'cartId', allowNull: false }, as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: { name: 'cartId', allowNull: false } });
Product.hasMany(CartItem, { foreignKey: { name: 'productId', allowNull: false }, onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: { name: 'productId', allowNull: false }, as: 'product' });

// Order 1 ──< * OrderItem  (product link is optional because the line is a snapshot)
Order.hasMany(OrderItem, { foreignKey: { name: 'orderId', allowNull: false }, as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: { name: 'orderId', allowNull: false } });
Product.hasMany(OrderItem, { foreignKey: { name: 'productId', allowNull: true }, onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: { name: 'productId', allowNull: true }, as: 'product', onDelete: 'SET NULL' });

// User 1 ──< * Order, User 1 ── 0..1 Cart
User.hasMany(Order, { foreignKey: { name: 'userId', allowNull: true }, onDelete: 'SET NULL' });
Order.belongsTo(User, { foreignKey: { name: 'userId', allowNull: true } });

export {
  sequelize, User, Series, Chapter, Product, Cart, CartItem,
  Order, OrderItem, Media, Setting, Subscriber, Message,
};
