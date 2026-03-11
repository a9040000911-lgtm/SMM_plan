const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function patch() {
    try {
        console.log('Patching "Currency" enum values in PROD...');

        const currencies = ['TRY', 'VND', 'IDR', 'THB', 'INR'];

        for (const cur of currencies) {
            try {
                await pool.query(`ALTER TYPE "Currency" ADD VALUE '${cur}'`);
                console.log(`Added: ${cur}`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`Skipped (already exists): ${cur}`);
                } else {
                    console.error(`Error adding ${cur}:`, e.message);
                }
            }
        }

        console.log('Patching complete.');

    } catch (e) {
        console.error('Critical Error:', e.message);
    } finally {
        await pool.end();
    }
}

patch();
