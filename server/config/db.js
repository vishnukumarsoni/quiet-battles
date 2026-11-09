import fs from 'node:fs';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import { env } from './env.js';

// One codebase, two databases:
//   - DATABASE_URL set  -> PostgreSQL (production, Render / Neon / Supabase)
//   - otherwise         -> a local SQLite file (zero setup for development)
let sequelize;

if (env.databaseUrl) {
  const useSsl = env.isProd && process.env.DB_SSL !== 'false';
  sequelize = new Sequelize(env.databaseUrl, {
    logging: false,
    dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
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

export async function connectDb() {
  await sequelize.authenticate();
  // Creates any missing tables. For real schema changes you would add migrations.
  await sequelize.sync();
  return sequelize;
}
