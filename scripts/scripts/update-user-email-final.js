const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function fixUserEmailAndCode() {
    try {
        console.log('Searching for user...');
        // Find by previous temporary email or tgId
        let res = await pool.query(`SELECT * FROM "User" WHERE "email" = 'art@mspektr.ru' OR "tgId" = 268747191`);

        if (res.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = res.rows[0];
        console.log(`Found USER: ID=${user.id}, Role=${user.role}`);

        const correctEmail = 'art@artmspektr.ru';
        const emergencyCode = '123456';

        // Ensure this email is unique or we are updating the same record
        // We already know user.id, so we update it directly.
        // But first check if another user already has this email to avoid unique constraint if any

        console.log(`Updating email to CORRECT: ${correctEmail} and setting 2FA code to ${emergencyCode}...`);

        await pool.query(`
            UPDATE "User" 
            SET "email" = $1, 
                "twoFactorCode" = $2
            WHERE "id" = $3
        `, [correctEmail, emergencyCode, user.id]);

        console.log('User updated successfully to art@artmspektr.ru!');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

fixUserEmailAndCode();
