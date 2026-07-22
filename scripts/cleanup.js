const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_S8ZILmgTVqj2@ep-aged-mode-av5xjina-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require');
async function main() {
  await sql`DELETE FROM encrypted_otps WHERE id = 'test-123'`;
  console.log('Cleaned test data');
  const rows = await sql`SELECT COUNT(*) as count FROM encrypted_otps`;
  console.log('Remaining OTPs:', rows[0].count);
}
main().catch(e => console.error(e.message));
