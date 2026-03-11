const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function fixUserEmailAndCode() {
    try {
        console.log('Searching for user...');
        // First try to find by tgId as in previous steps
        let res = await pool.query(`SELECT * FROM "User" WHERE "tgId" = 268747191`);

        if (res.rows.length === 0) {
            console.log('User with tgId 268747191 not found. Trying to find by similar email or creating new...');
            // Optional: fallback logic if needed, but we expect this user to exist based on previous interactions
            return;
        }

        const user = res.rows[0];
        console.log(`Found USER: ID=${user.id}, Email=${user.email}, Role=${user.role}`);

        const newEmail = 'art@artmspektr.ru';
        const emergencyCode = '123456';
        // Set expiry to 1 hour from now
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        console.log(`Updating email to ${newEmail} and setting 2FA code to ${emergencyCode}...`);

        await pool.query(`
            UPDATE "User" 
            SET "email" = $1, 
                "twoFactorCode" = $2,
                "twoFactorExpires" = $3
            WHERE "id" = $4
        `, [newEmail, emergencyCode, expires, user.id]);

        console.log('User updated successfully!');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

fixUserEmailAndCode();
