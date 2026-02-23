import jwt from 'jsonwebtoken';

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    const error = new Error('Missing or invalid authorization header');
    error.status = 401;
    return next(error);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    return next(error);
  }
}
