import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { cloudinary } from '../config/cloudinary.js';

const supabase = env.supabase.enabled
  ? createClient(env.supabase.url, env.supabase.secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null;

export const storageName = () => (supabase ? 'supabase' : env.cloudinary.enabled ? 'cloudinary' : 'local');

function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const options = { folder: 'quiet-battles', resource_type: 'image' };
    if (publicId) Object.assign(options, { public_id: publicId, overwrite: true, invalidate: true });
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)));
    stream.end(buffer);
  });
}

export async function saveImage({ buffer, ext }) {
  if (supabase) {
    const publicId = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(env.supabase.bucket).upload(publicId, buffer, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(env.supabase.bucket).getPublicUrl(publicId);
    return { url: data.publicUrl, publicId, storage: 'supabase' };
  }
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
  if (media.storage === 'supabase') {
    if (!supabase) throw new Error('Supabase Storage is not configured');
    const { error } = await supabase.storage.from(env.supabase.bucket).remove([media.publicId]);
    if (error) throw error;
    return;
  }
  if (media.storage === 'cloudinary') {
    if (env.cloudinary.enabled) await cloudinary.uploader.destroy(media.publicId, { invalidate: true });
    return;
  }
  // basename() guards against a tampered publicId like "../../server.js"
  const file = path.join(env.uploadDir, path.basename(media.publicId));
  await fs.rm(file, { force: true });
}
