#!/bin/bash
set -e

echo "--- Admin Recovery Start ---"

# 1. Get Project ID (Domain based)
PROJECT_ID=$(docker exec smmplan-db psql -U smmuser -d smmplan -t -c "SELECT id FROM \"Project\" WHERE domain = 'smmplan.pro' OR slug = 'smmplan' LIMIT 1;" | tr -d '[:space:]')

if [ -z "$PROJECT_ID" ]; then
    echo "Creating missing project 'smmplan'..."
    docker exec smmplan-db psql -U smmuser -d smmplan -c "INSERT INTO \"Project\" (id, name, slug, domain, \"updatedAt\") VALUES (gen_random_uuid(), 'Smmplan Pro', 'smmplan', 'smmplan.pro', NOW()) ON CONFLICT DO NOTHING;"
    PROJECT_ID=$(docker exec smmplan-db psql -U smmuser -d smmplan -t -c "SELECT id FROM \"Project\" WHERE domain = 'smmplan.pro' OR slug = 'smmplan' LIMIT 1;" | tr -d '[:space:]')
fi

echo "Project ID found: $PROJECT_ID"

# 2. Upsert Admin User via Bot (to ensure bcrypt works and Prisma schema is in sync)
docker exec smmplan-bot npx tsx -e "
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Upserting admin: art@artmspektr.ru');
    const pass = await bcrypt.hash('smmplan_admin_g0xdedwa', 10);
    
    // Explicitly using lowercase to match App normalization
    const email = 'art@artmspektr.ru';
    
    const user = await prisma.user.upsert({
        where: { email: email },
        update: {
            role: 'ADMIN',
            isGlobalAdmin: true,
            projectId: '$PROJECT_ID',
            password: pass,
            deletedAt: null // Ensure not soft-deleted
        },
        create: {
            email: email,
            role: 'ADMIN',
            isGlobalAdmin: true,
            username: 'Artem',
            password: pass,
            projectId: '$PROJECT_ID'
        }
    });
    
    console.log('Admin account provisioned successfully: ' + user.id);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
"

echo "--- Admin Recovery Finished ---"
