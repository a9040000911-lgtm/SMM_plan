const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function fixAdmin() {
    try {
        console.log('Finding user with tgId 268747191...');
        const res = await pool.query(`SELECT * FROM "User" WHERE "tgId" = 268747191`);

        if (res.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = res.rows[0];
        console.log('User found:', user.username, user.id, 'Role:', user.role, 'IsGlobalAdmin:', user.isGlobalAdmin);

        console.log('Updating user to ADMIN and isGlobalAdmin=true...');
        await pool.query(`
            UPDATE "User" 
            SET "role" = 'ADMIN', 
                "isGlobalAdmin" = true 
            WHERE "id" = $1
        `, [user.id]);

        console.log('User updated successfully.');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

fixAdmin();
