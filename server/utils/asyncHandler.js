// Express 4 does not catch rejected promises from async routes.
// This wrapper forwards them to the error middleware.
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
