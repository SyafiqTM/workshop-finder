import { spawn, spawnSync } from 'node:child_process';

import { buildDatabaseUrl, maskDatabaseUrl } from '../src/utils/database-url.js';

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

console.log(`Using database ${maskDatabaseUrl(databaseUrl)}`);

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
