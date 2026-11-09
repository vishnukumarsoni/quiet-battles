import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { sitemap } from './controllers/seo.controller.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import ApiError from './utils/ApiError.js';

// Builds the Express app without starting it, so tests can run it on any port.
export function createApp() {
  const app = express();

  // Behind Render/Vercel the real client IP comes from a proxy header (needed for rate limiting).
  if (env.isProd) app.set('trust proxy', 1);

  // Helmet adds secure HTTP headers. Cross-origin image loading is allowed so the
  // storefront (another origin) can show pictures served from /uploads.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use(
    cors({
      credentials: true,
      origin(origin, cb) {
        // No Origin header = curl / Postman / server-to-server, which is fine.
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        return cb(new ApiError(403, 'This origin is not allowed'));
      },
    })
  );

  if (!env.isTest) app.use(morgan(env.isProd ? 'tiny' : 'dev'));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  app.use('/uploads', express.static(env.uploadDir, { index: false, maxAge: '7d' }));
  app.get('/sitemap.xml', sitemap);

  app.use('/api', apiLimiter, routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
