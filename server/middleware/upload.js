import multer from 'multer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const MAX_SIZE = (env.isNetlify ? 4 : 5) * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Files are kept in memory first so we can inspect them before saving anywhere.
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: env.isNetlify ? 1 : 10 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG, WEBP or GIF images are allowed'));
    }
    return cb(null, true);
  },
});

// Accept the field "image" (one file) or "images" (several files).
export const receiveImages = uploader.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

// The Content-Type header can be faked, so also check the real file signature.
export function detectImageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buffer.subarray(0, 4).toString('ascii') === 'GIF8') return { mime: 'image/gif', ext: 'gif' };
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

// Flattens req.files into req.images = [{ buffer, mime, ext, originalName, size }]
export function checkImages(req, _res, next) {
  const files = [...(req.files?.image || []), ...(req.files?.images || [])];
  if (files.length === 0) return next(new ApiError(400, 'No image was uploaded. Use the field "image" or "images".'));
  const images = [];
  for (const file of files) {
    const type = detectImageType(file.buffer);
    if (!type) return next(new ApiError(400, `"${file.originalname}" is not a valid image file`));
    images.push({ buffer: file.buffer, mime: type.mime, ext: type.ext, originalName: file.originalname, size: file.size });
  }
  req.images = images;
  return next();
}
