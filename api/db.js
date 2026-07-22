const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function initTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS encrypted_otps (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      encrypted_code TEXT NOT NULL,
      iv TEXT NOT NULL,
      salt TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_otps_timestamp
    ON encrypted_otps (timestamp DESC)
  `;
}

module.exports = { sql, initTable };
