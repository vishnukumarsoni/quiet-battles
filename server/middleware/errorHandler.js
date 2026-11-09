import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Last middleware in the chain: every error ends up here and leaves as JSON.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.details;

  switch (err.name) {
    case 'SequelizeValidationError':
      status = 422;
      errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
      message = errors[0].message;
      break;
    case 'SequelizeUniqueConstraintError': {
      status = 409;
      const field = err.errors?.[0]?.path || 'value';
      message = field.includes('seriesId')
        ? 'This series already has a chapter with that number'
        : `That ${field.replace(/^.*\./, '')} is already in use`;
      errors = [{ field, message }];
      break;
    }
    case 'SequelizeForeignKeyConstraintError':
      status = 409;
      message = 'This item is still linked to other records';
      break;
    case 'MulterError':
      status = 400;
      message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB)' : err.message;
      break;
    default:
  }
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  }
  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  if (status >= 500) {
    if (!env.isTest || process.env.DEBUG_ERRORS) console.error(err);
    if (env.isProd) message = 'Something went wrong on our side';
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
}
