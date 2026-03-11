const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function inspect() {
    try {
        console.log('Inspecting "ProviderBalanceLog" table columns...');
        const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE lower(table_name) = 'providerbalancelog'
      ORDER BY ordinal_position;
    `);

        console.log('Physical columns in "ProviderBalanceLog" table:');
        res.rows.forEach(r => {
            console.log(`- ${r.column_name} (${r.data_type})`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

inspect();
