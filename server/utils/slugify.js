export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/™|®|©/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// Returns a slug that is not used yet: "the-gentle-armor", "the-gentle-armor-2", ...
export async function uniqueSlug(Model, base, ignoreId) {
  const root = slugify(base) || 'item';
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (true) {
    const found = await Model.findOne({ where: { slug: candidate }, attributes: ['id'] });
    if (!found || found.id === ignoreId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

// "12" -> numeric id, anything else -> slug. Lets one route accept both.
export function idOrSlugWhere(param) {
  return /^\d+$/.test(param) ? { id: Number(param) } : { slug: String(param).toLowerCase() };
}
