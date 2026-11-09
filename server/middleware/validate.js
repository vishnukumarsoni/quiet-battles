import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Put this after a list of express-validator rules. Responds with 422 and a
// list of { field, message } if anything failed.
export function handleValidation(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(new ApiError(422, errors[0].message, errors));
}

export const validate = (rules) => [...rules, handleValidation];
