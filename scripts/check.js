const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_S8ZILmgTVqj2@ep-aged-mode-av5xjina-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require');
async function main() {
  const rows = await sql`SELECT * FROM encrypted_otps ORDER BY timestamp DESC LIMIT 10`;
  console.log('OTPs in DB:', rows.length);
  rows.forEach(r => {
    console.log(' ID:', r.id?.substring(0, 8) + '...', 'Sender:', r.sender, 'Time:', new Date(Number(r.timestamp)).toLocaleString());
  });
  if (!rows.length) console.log('No OTPs found.');
}
main().catch(e => console.error('ERROR:', e.message));
