export function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const error = new Error(parsed.error.issues.map((issue) => issue.message).join(', '));
      error.status = 400;
      return next(error);
    }

    req.body = parsed.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const error = new Error(parsed.error.issues.map((issue) => issue.message).join(', '));
      error.status = 400;
      return next(error);
    }

    req.query = parsed.data;
    return next();
  };
}
