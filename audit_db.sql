-- check users
SELECT id, email, role, "isGlobalAdmin", "twoFactorCode", "twoFactorEnabled" FROM "User";
-- check projects
SELECT id, domain, slug FROM "Project";
-- check for any active long running queries or locks
SELECT pid, now() - query_start AS duration, query, state 
FROM pg_stat_activity 
WHERE state != 'idle' AND pid <> pg_backend_pid();
