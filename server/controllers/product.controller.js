import { Op } from 'sequelize';
import { Product, Chapter, Series } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import pick from '../utils/pick.js';
import { ok, created } from '../utils/respond.js';
import { uniqueSlug, idOrSlugWhere } from '../utils/slugify.js';
import { getPagination, pageMeta, searchClause, statusFilter, isAdmin } from '../utils/query.js';

const FIELDS = [
  'name', 'slug', 'description', 'details', 'price', 'images',
  'availableSizes', 'stock', 'category', 'featured', 'status',
];

// Only these sort options are accepted, so the "sort" query can never inject SQL.
const SORTS = {
  newest: [['createdAt', 'DESC']],
  price_asc: [['price', 'ASC']],
  price_desc: [['price', 'DESC']],
  name: [['name', 'ASC']],
};

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 12, maxLimit: 60 });
  const where = { ...statusFilter(req) };
  const { category, minPrice, maxPrice, featured, inStock, q } = req.query;

  if (category) where.category = String(category);
  if (featured === 'true') where.featured = true;
  if (inStock === 'true') where.stock = { [Op.gt]: 0 };
  if (minPrice || maxPrice) {
    where.price = {};
    if (Number(minPrice) >= 0 && minPrice !== undefined) where.price[Op.gte] = Number(minPrice);
    if (Number(maxPrice) > 0) where.price[Op.lte] = Number(maxPrice);
  }
  const search = searchClause(['Product.name', 'Product.description', 'Product.category'], q);
  if (search) Object.assign(where, search);

  const { rows, count } = await Product.findAndCountAll({
    where,
    order: SORTS[req.query.sort] || SORTS.newest,
    limit,
    offset,
  });

  // Category list (for the shop filter) is always based on what visitors can see.
  const cats = await Product.findAll({ where: { status: 'published' }, attributes: ['category'], group: ['category'], raw: true });
  return ok(res, rows, { ...pageMeta(page, limit, count), categories: cats.map((c) => c.category).sort() });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { ...idOrSlugWhere(req.params.id), ...(isAdmin(req) ? {} : { status: 'published' }) },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  // "You may also like": same category first, then fill up with the newest others.
  const base = { status: 'published', id: { [Op.ne]: product.id } };
  const sameCategory = await Product.findAll({ where: { ...base, category: product.category }, order: SORTS.newest, limit: 4 });
  let related = sameCategory;
  if (related.length < 4) {
    const others = await Product.findAll({
      where: { ...base, id: { [Op.notIn]: [product.id, ...related.map((p) => p.id)] } },
      order: SORTS.newest,
      limit: 4 - related.length,
    });
    related = [...related, ...others];
  }

  // Which published chapter tells this product's story? Used for the "Read the chapter" link.
  const chapter = await Chapter.findOne({
    where: { relatedProductId: product.id, status: 'published' },
    attributes: ['id', 'slug', 'title', 'chapterNumber', 'coverImage'],
    include: [{ model: Series, as: 'series', attributes: ['title', 'seriesNumber'], where: { status: 'published' }, required: true }],
  });
  return ok(res, { ...product.toJSON(), related, chapter });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.slug = await uniqueSlug(Product, data.slug || data.name);
  const product = await Product.create(data);
  return created(res, product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const data = pick(req.body, FIELDS);
  if (data.slug) data.slug = await uniqueSlug(Product, data.slug, product.id);
  await product.update(data);
  return ok(res, product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await product.destroy();
  return ok(res, { message: 'Product deleted' });
});
