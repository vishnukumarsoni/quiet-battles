import { Op, fn, col, where } from 'sequelize';

export function getPagination(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

export const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

// Case-insensitive "contains" search over several columns (works on SQLite and PostgreSQL).
// Pass qualified names such as 'Chapter.title' so joins stay unambiguous.
export function searchClause(fields, q) {
  const term = String(q || '').trim().toLowerCase().slice(0, 80);
  if (!term) return null;
  const like = `%${term}%`;
  return { [Op.or]: fields.map((f) => where(fn('lower', col(f)), { [Op.like]: like })) };
}

export const isAdmin = (req) => req.user?.role === 'admin';

// Public visitors only ever see published content.
// A logged-in admin can ask for drafts with ?status=all|draft|published.
export function statusFilter(req) {
  if (!isAdmin(req)) return { status: 'published' };
  const s = req.query.status;
  if (s === 'draft' || s === 'published') return { status: s };
  if (s === 'all') return {};
  return { status: 'published' };
}

export const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
