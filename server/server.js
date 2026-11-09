import { env, assertRequiredEnv } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  assertRequiredEnv();
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    const db = env.databaseUrl ? 'PostgreSQL' : 'SQLite';
    console.log(`API ready on http://localhost:${env.port}  (${env.nodeEnv}, ${db})`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
