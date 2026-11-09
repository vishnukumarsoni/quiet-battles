import { Media } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/respond.js';
import { getPagination, pageMeta } from '../utils/query.js';
import { saveImage, deleteImage } from '../services/storageService.js';
import { findUsages, rewriteUrl, clearReferences } from '../services/mediaService.js';

const store = async (image) => {
  const saved = await saveImage(image);
  return Media.create({
    ...saved,
    originalName: image.originalName.slice(0, 255),
    mimeType: image.mime,
    size: image.size,
  });
};

export const uploadImages = asyncHandler(async (req, res) => {
  const media = [];
  for (const image of req.images) media.push(await store(image)); // eslint-disable-line no-await-in-loop
  return created(res, media);
});

export const listMedia = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 24, maxLimit: 100 });
  const { rows, count } = await Media.findAndCountAll({ order: [['createdAt', 'DESC']], limit, offset });
  return ok(res, rows, pageMeta(page, limit, count));
});

export const replaceMedia = asyncHandler(async (req, res) => {
  const media = await Media.findByPk(req.params.id);
  if (!media) throw new ApiError(404, 'Image not found');

  const oldUrl = media.url;
  const saved = await saveImage(req.images[0]);
  const previous = { storage: media.storage, publicId: media.publicId };
  await media.update({
    ...saved,
    originalName: req.images[0].originalName.slice(0, 255),
    mimeType: req.images[0].mime,
    size: req.images[0].size,
  });
  await rewriteUrl(oldUrl, media.url); // every series / chapter / product now uses the new file
  await deleteImage(previous);
  return ok(res, media);
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findByPk(req.params.id);
  if (!media) throw new ApiError(404, 'Image not found');

  const usages = await findUsages(media.url);
  if (usages.length > 0) {
    if (req.query.force !== 'true') {
      const err = new ApiError(409, `This image is used in ${usages.length} place${usages.length > 1 ? 's' : ''}`, usages);
      throw err;
    }
    await clearReferences(media.url);
  }
  await deleteImage(media);
  await media.destroy();
  return ok(res, { message: 'Image deleted' });
});
