import { body, param } from 'express-validator';
import { SIZES } from '../models/Product.js';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js';

const STATUSES = ['draft', 'published'];
const SLUG_RE = /^(?=.*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*$/; // lowercase, hyphens, at least one letter

// create -> field is required, update -> field is optional
const f = (name, isUpdate) => (isUpdate ? body(name).optional() : body(name));

const imageRef = (value) => {
  if (value === '' || value === undefined) return true;
  if (typeof value !== 'string' || value.length > 500) throw new Error('Image must be a URL or path (max 500 characters)');
  if (!/^(https?:\/\/|\/)/i.test(value)) throw new Error('Image must start with http(s):// or /');
  return true;
};

const slugRule = () =>
  body('slug')
    .optional({ values: 'falsy' })
    .trim()
    .toLowerCase()
    .matches(SLUG_RE)
    .withMessage('Slug may contain lowercase letters, numbers and hyphens only');

export const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id').toInt()];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().notEmpty().withMessage('Password is required').isLength({ max: 200 }),
];

export const passwordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 10, max: 200 })
    .withMessage('New password must be at least 10 characters'),
];

export const seriesRules = (isUpdate = false) => [
  f('title', isUpdate).trim().isLength({ min: 2, max: 120 }).withMessage('Title must be 2-120 characters'),
  slugRule(),
  f('seriesNumber', isUpdate).isInt({ min: 1, max: 999 }).withMessage('Series number must be a whole number from 1').toInt(),
  body('description').optional().isString().isLength({ max: 3000 }).withMessage('Description is too long (max 3000)'),
  body('coverImage').optional().custom(imageRef),
  body('status').optional().isIn(STATUSES).withMessage('Status must be draft or published'),
];

export const chapterRules = (isUpdate = false) => [
  f('title', isUpdate).trim().isLength({ min: 2, max: 120 }).withMessage('Title must be 2-120 characters'),
  slugRule(),
  f('chapterNumber', isUpdate).isInt({ min: 1, max: 999 }).withMessage('Chapter number must be a whole number from 1').toInt(),
  f('seriesId', isUpdate).isInt({ min: 1 }).withMessage('Choose a series').toInt(),
  body('description').optional().isString().isLength({ max: 1000 }).withMessage('Short description is too long (max 1000)'),
  body('storyContent').optional().isString().isLength({ max: 30000 }).withMessage('Story is too long (max 30000 characters)'),
  body('coverImage').optional().custom(imageRef),
  body('galleryImages').optional().isArray({ max: 12 }).withMessage('Gallery can hold up to 12 images'),
  body('galleryImages.*').custom(imageRef),
  body('relatedProductId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid related product').toInt(),
  body('status').optional().isIn(STATUSES).withMessage('Status must be draft or published'),
];

export const productRules = (isUpdate = false) => [
  f('name', isUpdate).trim().isLength({ min: 2, max: 140 }).withMessage('Name must be 2-140 characters'),
  slugRule(),
  body('description').optional().isString().isLength({ max: 5000 }).withMessage('Description is too long (max 5000)'),
  body('details').optional().isArray({ max: 12 }).withMessage('Details must be a list (max 12 lines)'),
  body('details.*').isString().isLength({ max: 200 }).withMessage('Each detail line can be 200 characters'),
  f('price', isUpdate).isFloat({ min: 0.01, max: 1000000 }).withMessage('Price must be greater than 0').toFloat(),
  body('images').optional().isArray({ max: 10 }).withMessage('A product can have up to 10 images'),
  body('images.*').custom(imageRef),
  body('availableSizes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Choose at least one size')
    .bail()
    .custom((arr) => arr.every((s) => SIZES.includes(s)))
    .withMessage(`Sizes must be from ${SIZES.join(', ')}`),
  body('stock').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock must be 0 or more').toInt(),
  body('category').optional().trim().isLength({ min: 1, max: 60 }).withMessage('Category is 1-60 characters'),
  body('featured').optional().isBoolean().withMessage('Featured must be true or false').toBoolean(),
  body('status').optional().isIn(STATUSES).withMessage('Status must be draft or published'),
];

const cartLine = (prefix) => {
  const path = (key) => (prefix ? `${prefix}.${key}` : key);
  return [
    body(path('productId')).isInt({ min: 1 }).withMessage('Invalid product').toInt(),
    body(path('size')).isIn(SIZES).withMessage(`Size must be one of ${SIZES.join(', ')}`),
    body(path('quantity')).isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10').toInt(),
  ];
};

export const cartAddRules = cartLine('');
export const cartUpdateRules = [
  param('itemId').isInt({ min: 1 }).withMessage('Invalid item').toInt(),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10').toInt(),
];
export const cartValidateRules = [
  body('items').isArray({ min: 1, max: 20 }).withMessage('Cart must contain 1-20 items'),
  ...cartLine('items.*'),
];

export const orderCreateRules = [
  body('customer.name').trim().isLength({ min: 2, max: 120 }).withMessage('Enter your full name'),
  body('customer.email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
  body('customer.phone').optional({ values: 'falsy' }).trim().matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Enter a valid phone number'),
  body('shippingAddress.line1').trim().isLength({ min: 3, max: 160 }).withMessage('Enter your address'),
  body('shippingAddress.line2').optional({ values: 'falsy' }).trim().isLength({ max: 160 }),
  body('shippingAddress.city').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your city'),
  body('shippingAddress.state').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your state'),
  body('shippingAddress.postalCode').trim().matches(/^[A-Za-z0-9\- ]{4,10}$/).withMessage('Enter a valid postal code'),
  body('shippingAddress.country').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your country'),
  body('items').isArray({ min: 1, max: 20 }).withMessage('Your cart is empty'),
  ...cartLine('items.*'),
];

export const orderUpdateRules = [
  body('orderStatus').optional().isIn(ORDER_STATUSES).withMessage(`Order status must be one of ${ORDER_STATUSES.join(', ')}`),
  body('paymentStatus').optional().isIn(PAYMENT_STATUSES).withMessage(`Payment status must be one of ${PAYMENT_STATUSES.join(', ')}`),
];

export const contactRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Enter your name'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
];

export const newsletterRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
];

export const SETTING_KEYS = [
  'siteName', 'tagline', 'announcement', 'contactEmail', 'contactPhone',
  'address', 'instagram', 'twitter', 'youtube',
];
export const settingsRules = [
  ...SETTING_KEYS.map((k) => body(k).optional().isString().isLength({ max: 300 }).withMessage(`${k} is too long (max 300)`)),
];
