# PostgreSQL tuning for 256MB container
# Place in: /docker-entrypoint-initdb.d/tune.sql

-- Memory (conservative for 256MB container)
ALTER SYSTEM SET shared_buffers = '64MB';
ALTER SYSTEM SET effective_cache_size = '128MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '32MB';

-- WAL
ALTER SYSTEM SET wal_buffers = '4MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- Connections (limited for low-RAM)
ALTER SYSTEM SET max_connections = 50;

-- Logging (minimal for performance)
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;

-- Planner
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
