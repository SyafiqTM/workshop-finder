export function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || error.statusCode || 500;

  const isPayloadTooLarge =
    status === 413 ||
    error.type === 'entity.too.large' ||
    error.name === 'PayloadTooLargeError';

  const message = isPayloadTooLarge
    ? 'Request payload too large. If you are uploading images, use a smaller file or an image URL.'
    : error.message || 'Internal server error';

  res.status(status).json({ message });
}
