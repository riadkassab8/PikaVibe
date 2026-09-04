const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: 'Riad@Postgres2026!', host: 'localhost', port: 5432, database: 'homegoods' });

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS installment_plans (
        id SERIAL PRIMARY KEY,
        provider_name TEXT NOT NULL,
        provider_name_ar TEXT,
        provider_name_en TEXT,
        min_months INTEGER NOT NULL,
        max_months INTEGER NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS installment_available BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS installment_min_months INTEGER;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS installment_max_months INTEGER;
    `);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}
run();
