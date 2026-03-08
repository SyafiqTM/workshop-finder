import { spawn, spawnSync } from 'node:child_process';

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const protocol = process.env.DBS_CONNECTION || process.env.DB_CONNECTION;
  const host = process.env.DBS_HOST || process.env.DB_HOST;
  const port = process.env.DBS_PORT || process.env.DB_PORT;
  const database = process.env.DBS_DATABASE || process.env.DB_DATABASE;
  const username = process.env.DBS_USERNAME || process.env.DB_USERNAME;
  const password = process.env.DBS_PASSWORD || process.env.DB_PASSWORD;

  if (!protocol || !host || !port || !database || !username || password == null) {
    return null;
  }

  return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl = buildDatabaseUrl();

if (!databaseUrl) {
  console.error(
    'DATABASE_URL is not set. Provide DATABASE_URL directly or DBS_CONNECTION/DBS_HOST/DBS_PORT/DBS_DATABASE/DBS_USERNAME/DBS_PASSWORD.'
  );
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;

run('npx', ['prisma', 'generate']);
run('npx', ['prisma', 'db', 'push']);

const server = spawn('node', ['src/server.js'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32'
});

server.on('exit', (code) => {
  process.exit(code ?? 0);
});
