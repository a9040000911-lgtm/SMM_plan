const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://smmuser:smmpassword@127.0.0.1:5433/smmplan?schema=public"
});

async function main() {
    await client.connect();
    const res = await client.query('SELECT COUNT(*) FROM "Project"');
    console.log('Project Count (Direct PG):', res.rows[0].count);

    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

    await client.end();
}

main().catch(console.error);
