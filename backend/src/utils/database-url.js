export function buildDatabaseUrl(env = process.env) {
  const protocol = env.DBS_CONNECTION || env.DB_CONNECTION;
  const host = env.DBS_HOST || env.DB_HOST;
  const port = env.DBS_PORT || env.DB_PORT;
  const database = env.DBS_DATABASE || env.DB_DATABASE;
  const username = env.DBS_USERNAME || env.DB_USERNAME;
  const password = env.DBS_PASSWORD || env.DB_PASSWORD;

  if (protocol && host && port && database && username && password != null) {
    return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return env.DATABASE_URL || null;
}

export function maskDatabaseUrl(databaseUrl) {
  return (databaseUrl || '').replace(/:[^:@/]+@/, ':***@');
}