import { sequelize } from './models/index.js';

async function check() {
  try {
    await sequelize.authenticate();
    console.log('STATUS: CONNECTED');
    console.log('DIALECT:', sequelize.getDialect());

    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n--- CREATED TABLES & ROW COUNTS ---');
    for (const t of tables) {
      const [rows] = await sequelize.query(`SELECT COUNT(*) as count FROM "${t.table_name}"`);
      console.log(`✓ ${t.table_name.padEnd(20)} : ${rows[0].count} rows`);
    }

    process.exit(0);
  } catch (err) {
    console.error('DATABASE ERROR:', err.message);
    process.exit(1);
  }
}

check();
