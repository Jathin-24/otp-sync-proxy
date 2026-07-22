const { neon } = require('@neondatabase/serverless');

const DB_URL = process.env.DATABASE_URL;
let sql;
let tableReady = false;

function getSql() {
  if (!sql) {
    if (!DB_URL) throw new Error('DATABASE_URL environment variable is not set');
    sql = neon(DB_URL);
  }
  return sql;
}

async function ensureTable() {
  if (tableReady) return;
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS encrypted_otps (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL DEFAULT '',
      encrypted_code TEXT NOT NULL,
      iv TEXT NOT NULL,
      salt TEXT NOT NULL,
      sender TEXT NOT NULL DEFAULT '',
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS idx_otps_timestamp
    ON encrypted_otps (timestamp DESC)
  `;
  tableReady = true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureTable();
    const db = getSql();

    if (req.method === 'GET') {
      const since = parseInt(req.query?.since || '0', 10);
      const limit = parseInt(req.query?.limit || '50', 10);
      const rows = await db`
        SELECT * FROM encrypted_otps
        WHERE timestamp > ${since}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
      return res.status(200).json({ otps: rows });
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || !body.otps || !Array.isArray(body.otps) || body.otps.length === 0) {
        return res.status(400).json({ error: 'otps array required' });
      }

      let inserted = 0;
      for (const otp of body.otps) {
        const { id, deviceId, encryptedCode, iv, salt, sender, timestamp } = otp;
        if (!id || !encryptedCode || !iv || !salt || !timestamp) continue;
        await db`
          INSERT INTO encrypted_otps (id, device_id, encrypted_code, iv, salt, sender, timestamp)
          VALUES (${id}, ${deviceId || ''}, ${encryptedCode}, ${iv}, ${salt}, ${sender || ''}, ${Number(timestamp)})
          ON CONFLICT (id) DO NOTHING
        `;
        inserted++;
      }
      return res.status(200).json({ inserted });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
