import { Series, Chapter, Product } from '../models/index.js';

// Where is this image URL used? Lets the admin see what would break before deleting.
export async function findUsages(url) {
  const [series, chapters, products] = await Promise.all([
    Series.findAll({ attributes: ['id', 'title', 'coverImage'] }),
    Chapter.findAll({ attributes: ['id', 'title', 'coverImage', 'galleryImages'] }),
    Product.findAll({ attributes: ['id', 'name', 'images'] }),
  ]);
  const usages = [];
  series.filter((s) => s.coverImage === url).forEach((s) => usages.push({ type: 'series', id: s.id, title: s.title }));
  chapters
    .filter((c) => c.coverImage === url || c.galleryImages.includes(url))
    .forEach((c) => usages.push({ type: 'chapter', id: c.id, title: c.title }));
  products.filter((p) => p.images.includes(url)).forEach((p) => usages.push({ type: 'product', id: p.id, title: p.name }));
  return usages;
}

// After an image is replaced its URL changes, so point every record at the new one.
export async function rewriteUrl(oldUrl, newUrl) {
  if (oldUrl === newUrl) return;
  const swap = (list) => list.map((u) => (u === oldUrl ? newUrl : u));

  const series = await Series.findAll({ where: { coverImage: oldUrl } });
  await Promise.all(series.map((s) => s.update({ coverImage: newUrl })));

  const chapters = await Chapter.findAll();
  await Promise.all(
    chapters
      .filter((c) => c.coverImage === oldUrl || c.galleryImages.includes(oldUrl))
      .map((c) =>
        c.update({
          coverImage: c.coverImage === oldUrl ? newUrl : c.coverImage,
          galleryImages: swap(c.galleryImages),
        })
      )
  );

  const products = await Product.findAll();
  await Promise.all(products.filter((p) => p.images.includes(oldUrl)).map((p) => p.update({ images: swap(p.images) })));
}

// Used when an image is force-deleted: remove it from every record that points at it.
export async function clearReferences(url) {
  const series = await Series.findAll({ where: { coverImage: url } });
  await Promise.all(series.map((s) => s.update({ coverImage: '' })));

  const chapters = await Chapter.findAll();
  await Promise.all(
    chapters
      .filter((c) => c.coverImage === url || c.galleryImages.includes(url))
      .map((c) =>
        c.update({
          coverImage: c.coverImage === url ? '' : c.coverImage,
          galleryImages: c.galleryImages.filter((u) => u !== url),
        })
      )
  );

  const products = await Product.findAll();
  await Promise.all(
    products.filter((p) => p.images.includes(url)).map((p) => p.update({ images: p.images.filter((u) => u !== url) }))
  );
}
