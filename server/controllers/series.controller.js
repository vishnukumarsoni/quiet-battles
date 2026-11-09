import { fn, col } from 'sequelize';
import { Series, Chapter } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import pick from '../utils/pick.js';
import { ok, created } from '../utils/respond.js';
import { uniqueSlug, idOrSlugWhere } from '../utils/slugify.js';
import { getPagination, pageMeta, searchClause, statusFilter, isAdmin } from '../utils/query.js';

const FIELDS = ['title', 'slug', 'seriesNumber', 'description', 'coverImage', 'status'];

export const listSeries = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const where = { ...statusFilter(req) };
  const search = searchClause(['Series.title', 'Series.description'], req.query.q);
  if (search) Object.assign(where, search);

  const { rows, count } = await Series.findAndCountAll({
    where,
    order: [['seriesNumber', 'ASC']],
    limit,
    offset,
  });

  // How many chapters does each series have? One grouped query instead of one per row.
  const chapterWhere = { seriesId: rows.map((s) => s.id) };
  if (!isAdmin(req) || req.query.status !== 'all') chapterWhere.status = 'published';
  const counts = await Chapter.findAll({
    attributes: ['seriesId', [fn('COUNT', col('id')), 'total']],
    where: chapterWhere,
    group: ['seriesId'],
    raw: true,
  });
  const countBySeries = new Map(counts.map((c) => [c.seriesId, Number(c.total)]));

  const data = rows.map((s) => ({ ...s.toJSON(), chapterCount: countBySeries.get(s.id) || 0 }));
  return ok(res, data, pageMeta(page, limit, count));
});

export const getSeries = asyncHandler(async (req, res) => {
  const series = await Series.findOne({ where: { ...idOrSlugWhere(req.params.id), ...(isAdmin(req) ? {} : { status: 'published' }) } });
  if (!series) throw new ApiError(404, 'Series not found');

  const chapterWhere = { seriesId: series.id };
  if (!isAdmin(req) || req.query.status !== 'all') chapterWhere.status = 'published';
  const chapters = await Chapter.findAll({
    where: chapterWhere,
    attributes: { exclude: ['storyContent'] },
    order: [['chapterNumber', 'ASC']],
  });
  return ok(res, { ...series.toJSON(), chapters });
});

export const createSeries = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.slug = await uniqueSlug(Series, data.slug || data.title);
  const series = await Series.create(data);
  return created(res, series);
});

export const updateSeries = asyncHandler(async (req, res) => {
  const series = await Series.findByPk(req.params.id);
  if (!series) throw new ApiError(404, 'Series not found');
  const data = pick(req.body, FIELDS);
  if (data.slug) data.slug = await uniqueSlug(Series, data.slug, series.id);
  await series.update(data);
  return ok(res, series);
});

export const deleteSeries = asyncHandler(async (req, res) => {
  const series = await Series.findByPk(req.params.id);
  if (!series) throw new ApiError(404, 'Series not found');
  const chapters = await Chapter.count({ where: { seriesId: series.id } });
  if (chapters > 0) {
    throw new ApiError(409, `This series still has ${chapters} chapter${chapters > 1 ? 's' : ''}. Delete or move them first.`);
  }
  await series.destroy();
  return ok(res, { message: 'Series deleted' });
});
