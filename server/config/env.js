import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeEnv = process.env.NODE_ENV || 'development';
const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

// In development, http://localhost:5173 and http://127.0.0.1:5173 are the same site for a human,
// but not for CORS. Allow both so the app works whichever address is opened. Never done in production.
if (nodeEnv !== 'production') {
  for (const origin of [...clientOrigins]) {
    const twin = origin.includes('//localhost') ? origin.replace('//localhost', '//127.0.0.1') : origin.replace('//127.0.0.1', '//localhost');
    if (!clientOrigins.includes(twin)) clientOrigins.push(twin);
  }
}

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,

  databaseUrl: process.env.DATABASE_URL || '',
  sqlitePath: process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'quiet-battles.sqlite'),

  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSameSite: (process.env.COOKIE_SAMESITE || 'lax').toLowerCase(),

  clientOrigins,
  siteUrl: (process.env.SITE_URL || clientOrigins[0]).replace(/\/$/, ''),

  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  admin: {
    name: process.env.ADMIN_NAME || 'Store Admin',
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
};

env.cloudinary.enabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

// Called when the API starts. Refuses to run with a missing or weak JWT secret.
export function assertRequiredEnv() {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters.\n' +
        'Copy server/.env.example to server/.env and set a long random value, e.g.\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
}
