const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function fixUserTelegram() {
    try {
        const targetEmail = 'art@artmspektr.ru';
        const targetTgId = 268747191; // ID from previous logs

        console.log(`Setting Telegram ID ${targetTgId} for user ${targetEmail}...`);

        const res = await pool.query(`
            UPDATE "User"
            SET "tgId" = $1, "isGlobalAdmin" = true
            WHERE "email" = $2
            RETURNING id, username, email, "tgId"
        `, [targetTgId, targetEmail]);

        if (res.rowCount > 0) {
            console.log('Success! Updated user:', res.rows[0]);
        } else {
            console.log('User not found by email. Trying by ID...');
            // Fallback: try to find by ID if email update failed (just in case)
            await pool.query(`
                UPDATE "User"
                SET "tgId" = $1, "email" = $2
                WHERE "id" = '7aad6002-0ab4-49da-8662-5525d4032ac8'
            `, [targetTgId, targetEmail]);
            console.log('Updated by ID based on previous context.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

fixUserTelegram();
