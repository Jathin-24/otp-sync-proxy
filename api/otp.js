const { sql, initTable } = require('./db');

let tableReady = false;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!tableReady) {
    await initTable();
    tableReady = true;
  }

  if (req.method === 'GET') {
    const { since = '0', limit = '50' } = req.query;
    const rows = await sql`
      SELECT * FROM encrypted_otps
      WHERE timestamp > ${parseInt(since)}
      ORDER BY timestamp DESC
      LIMIT ${parseInt(limit)}
    `;
    return res.status(200).json({ otps: rows });
  }

  if (req.method === 'POST') {
    const { otps } = req.body;
    if (!otps || !Array.isArray(otps) || otps.length === 0) {
      return res.status(400).json({ error: 'otps array required' });
    }

    const inserted = [];
    for (const otp of otps) {
      const { id, deviceId, encryptedCode, iv, salt, sender, timestamp } = otp;
      if (!id || !encryptedCode || !iv || !salt || !timestamp) {
        continue;
      }
      await sql`
        INSERT INTO encrypted_otps (id, device_id, encrypted_code, iv, salt, sender, timestamp)
        VALUES (${id}, ${deviceId || ''}, ${encryptedCode}, ${iv}, ${salt}, ${sender || ''}, ${timestamp})
        ON CONFLICT (id) DO NOTHING
      `;
      inserted.push(id);
    }

    return res.status(200).json({ inserted: inserted.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
