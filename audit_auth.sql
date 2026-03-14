\echo '--- PROJECTS ---'
SELECT id, slug FROM "Project";
\echo '--- USERS ---'
SELECT id, "projectId", "tgId", email FROM "User" WHERE "tgId" IS NOT NULL LIMIT 20;
