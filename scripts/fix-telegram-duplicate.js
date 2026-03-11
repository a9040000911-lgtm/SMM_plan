const { Pool } = require('pg');

const connectionString = "postgresql://smmuser:smmpassword@127.0.0.1:5434/smmplan?schema=public";
const pool = new Pool({ connectionString });

async function fixDuplicateUser() {
    try {
        console.log('Finding user with duplicate Telegram ID...');
        const conflictingUser = await pool.query(`SELECT * FROM "User" WHERE "tgId" = 268747191 AND "email" != 'art@artmspektr.ru'`);

        if (conflictingUser.rows.length > 0) {
            console.log(`Found conflicting user: ID=${conflictingUser.rows[0].id}, Username=${conflictingUser.rows[0].username}, Role=${conflictingUser.rows[0].role}`);

            // Safe option: Detach Telegram ID from the old user instead of deleting, to preserve data
            console.log('Detaching Telegram ID from conflicting user...');
            await pool.query(`UPDATE "User" SET "tgId" = NULL WHERE "id" = $1`, [conflictingUser.rows[0].id]);
            console.log('Old user updated. Telegram ID freed.');
        } else {
            console.log('No conflicting user found with this Telegram ID. Strange.');
        }

        // Now attach to the correct user
        console.log('Attaching Telegram ID to art@artmspektr.ru...');
        await pool.query(`
            UPDATE "User" 
            SET "tgId" = 268747191
            WHERE "email" = 'art@artmspektr.ru'
        `);
        console.log('Success! art@artmspektr.ru is now linked to Telegram ID 268747191');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

fixDuplicateUser();
