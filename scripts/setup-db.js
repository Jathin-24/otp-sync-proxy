const { neon } = require('@neondatabase/serverless');

const DB_URL = 'postgresql://neondb_owner:npg_S8ZILmgTVqj2@ep-aged-mode-av5xjina-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DB_URL);

async function main() {
  // Create table
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
  console.log('Table created/verified');

  // Create index
  await sql`
    CREATE INDEX IF NOT EXISTS idx_otps_timestamp
    ON encrypted_otps (timestamp DESC)
  `;
  console.log('Index created/verified');

  // Check for existing OTPs
  const rows = await sql`SELECT * FROM encrypted_otps ORDER BY timestamp DESC LIMIT 10`;
  console.log('\nOTPs in DB:', rows.length);
  rows.forEach(r => {
    console.log(' - ID:', r.id?.substring(0, 8) + '...', 'Sender:', r.sender, 'TS:', new Date(Number(r.timestamp)).toLocaleString());
  });

  if (rows.length === 0) {
    console.log('\nNo OTPs found. The mobile app may not be syncing yet.');
  }
}

main().catch(e => console.error('ERROR:', e.message));
