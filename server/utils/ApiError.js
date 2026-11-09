// A small error class so controllers can say: throw new ApiError(404, 'Not found').
// The error-handling middleware turns it into a clean JSON response.
export default class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
