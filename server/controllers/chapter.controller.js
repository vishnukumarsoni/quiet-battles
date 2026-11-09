import { Op } from 'sequelize';
import { Chapter, Series, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import pick from '../utils/pick.js';
import { ok, created } from '../utils/respond.js';
import { uniqueSlug, idOrSlugWhere } from '../utils/slugify.js';
import { getPagination, pageMeta, searchClause, statusFilter, isAdmin } from '../utils/query.js';

const FIELDS = [
  'title', 'slug', 'chapterNumber', 'seriesId', 'description',
  'storyContent', 'coverImage', 'galleryImages', 'relatedProductId', 'status',
];

const seriesInclude = (req) => ({
  model: Series,
  as: 'series',
  attributes: ['id', 'title', 'slug', 'seriesNumber'],
  required: true,
  // A published chapter inside an unpublished series stays hidden from visitors.
  ...(isAdmin(req) ? {} : { where: { status: 'published' } }),
});

export const listChapters = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const where = { ...statusFilter(req) };
  if (req.query.seriesId) where.seriesId = Number(req.query.seriesId) || 0;
  if (req.query.productId) where.relatedProductId = Number(req.query.productId) || 0;
  const search = searchClause(['Chapter.title', 'Chapter.description'], req.query.q);
  if (search) Object.assign(where, search);

  const { rows, count } = await Chapter.findAndCountAll({
    where,
    attributes: { exclude: ['storyContent'] },
    include: [seriesInclude(req)],
    order: [[{ model: Series, as: 'series' }, 'seriesNumber', 'ASC'], ['chapterNumber', 'ASC']],
    limit,
    offset,
    distinct: true,
  });
  return ok(res, rows, pageMeta(page, limit, count));
});

export const getChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findOne({
    where: { ...idOrSlugWhere(req.params.id), ...(isAdmin(req) ? {} : { status: 'published' }) },
    include: [
      seriesInclude(req),
      {
        model: Product,
        as: 'relatedProduct',
        required: false,
        ...(isAdmin(req) ? {} : { where: { status: 'published' } }),
      },
    ],
  });
  if (!chapter) throw new ApiError(404, 'Chapter not found');

  // Neighbours inside the same series, for the "Explore next chapter" links.
  const siblingWhere = { seriesId: chapter.seriesId, status: 'published' };
  const sideAttrs = ['id', 'slug', 'title', 'chapterNumber', 'coverImage', 'description'];
  const [nextChapter, prevChapter] = await Promise.all([
    Chapter.findOne({
      where: { ...siblingWhere, chapterNumber: { [Op.gt]: chapter.chapterNumber } },
      order: [['chapterNumber', 'ASC']],
      attributes: sideAttrs,
    }),
    Chapter.findOne({
      where: { ...siblingWhere, chapterNumber: { [Op.lt]: chapter.chapterNumber } },
      order: [['chapterNumber', 'DESC']],
      attributes: sideAttrs,
    }),
  ]);
  return ok(res, { ...chapter.toJSON(), nextChapter, prevChapter });
});

// Make sure the parent series / related product really exist before saving.
async function checkReferences(data) {
  if (data.seriesId !== undefined && !(await Series.findByPk(data.seriesId, { attributes: ['id'] }))) {
    throw new ApiError(422, 'The selected series does not exist', [{ field: 'seriesId', message: 'The selected series does not exist' }]);
  }
  if (data.relatedProductId && !(await Product.findByPk(data.relatedProductId, { attributes: ['id'] }))) {
    throw new ApiError(422, 'The selected product does not exist', [{ field: 'relatedProductId', message: 'The selected product does not exist' }]);
  }
}

export const createChapter = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  await checkReferences(data);
  data.slug = await uniqueSlug(Chapter, data.slug || data.title);
  const chapter = await Chapter.create(data);
  return created(res, chapter);
});

export const updateChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByPk(req.params.id);
  if (!chapter) throw new ApiError(404, 'Chapter not found');
  const data = pick(req.body, FIELDS);
  await checkReferences(data);
  if (data.slug) data.slug = await uniqueSlug(Chapter, data.slug, chapter.id);
  await chapter.update(data);
  return ok(res, chapter);
});

export const deleteChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByPk(req.params.id);
  if (!chapter) throw new ApiError(404, 'Chapter not found');
  await chapter.destroy();
  return ok(res, { message: 'Chapter deleted' });
});
