-- check users state
SELECT id, email, role, "isGlobalAdmin", "twoFactorCode", "twoFactorEnabled", "twoFactorExpires" 
FROM "User" 
WHERE email = 'art@artmspektr.ru';

-- check for any active long running queries or locks
SELECT pid, 
       now() - query_start AS duration, 
       query, 
       state, 
       wait_event_type, 
       wait_event 
FROM pg_stat_activity 
WHERE state != 'idle' 
  AND pid <> pg_backend_pid()
ORDER BY duration DESC;

-- check connection counts
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
