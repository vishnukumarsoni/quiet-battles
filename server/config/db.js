import fs from 'node:fs';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import { env } from './env.js';

// One codebase, two databases:
//   - DATABASE_URL set  -> PostgreSQL (production, Neon / Supabase)
//   - otherwise         -> a local SQLite file (zero setup for development)
let sequelize;
let connectionPromise;

if (env.databaseUrl) {
  const connectionUrl = new URL(env.databaseUrl);
  if (connectionUrl.searchParams.get('sslmode') === 'require') {
    connectionUrl.searchParams.set('sslmode', 'verify-full');
  }
  const useSsl = (env.isProd || Boolean(env.supabase.url)) && process.env.DB_SSL !== 'false';
  sequelize = new Sequelize(connectionUrl.toString(), {
    logging: false,
    dialectOptions: useSsl
      ? { ssl: { require: true, rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } }
      : {},
    pool: {
      max: env.isVercel || env.isNetlify ? 1 : 5,
      min: 0,
      acquire: 20000,
      idle: 10000,
      evict: 1000,
    },
  });
} else {
  if (env.sqlitePath !== ':memory:') {
    fs.mkdirSync(path.dirname(env.sqlitePath), { recursive: true });
  }
  sequelize = new Sequelize({ dialect: 'sqlite', storage: env.sqlitePath, logging: false });

  // SQLite allows one writer at a time. Instead of failing straight away with
  // "database is locked", a second writer waits up to 5 seconds for its turn.
  // WAL mode also lets readers keep working while a write happens.
  sequelize.addHook('afterConnect', (connection) => {
    connection.configure('busyTimeout', 5000);
    if (env.sqlitePath !== ':memory:') connection.exec('PRAGMA journal_mode = WAL;');
  });
}

export { sequelize };

export function connectDb({ sync = !env.isProd } = {}) {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      await sequelize.authenticate();
      if (sync) await sequelize.sync();
      return sequelize;
    })().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}
