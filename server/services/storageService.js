import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { cloudinary } from '../config/cloudinary.js';

// Saves images to Cloudinary when its keys exist, otherwise to server/uploads.
// The rest of the app only calls these functions and never cares which one is used.
export const storageName = () => (env.cloudinary.enabled ? 'cloudinary' : 'local');

function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const options = { folder: 'quiet-battles', resource_type: 'image' };
    if (publicId) Object.assign(options, { public_id: publicId, overwrite: true, invalidate: true });
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)));
    stream.end(buffer);
  });
}

export async function saveImage({ buffer, ext }) {
  if (env.cloudinary.enabled) {
    const result = await uploadToCloudinary(buffer);
    return { url: result.secure_url, publicId: result.public_id, storage: 'cloudinary' };
  }
  await fs.mkdir(env.uploadDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(env.uploadDir, filename), buffer);
  return { url: `/uploads/${filename}`, publicId: filename, storage: 'local' };
}

export async function deleteImage(media) {
  if (media.storage === 'cloudinary') {
    if (env.cloudinary.enabled) await cloudinary.uploader.destroy(media.publicId, { invalidate: true });
    return;
  }
  // basename() guards against a tampered publicId like "../../server.js"
  const file = path.join(env.uploadDir, path.basename(media.publicId));
  await fs.rm(file, { force: true });
}
