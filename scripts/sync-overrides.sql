-- Sync missing overrides for all projects
INSERT INTO "ProjectServiceOverride" ("id", "projectId", "internalServiceId", "isActive", "markup")
SELECT 
    gen_random_uuid() as id, 
    p.id as "projectId", 
    isrv.id as "internalServiceId", 
    true as "isActive", 
    50.00 as "markup"
FROM "Project" p
CROSS JOIN "InternalService" isrv
LEFT JOIN "ProjectServiceOverride" pso ON pso."projectId" = p.id AND pso."internalServiceId" = isrv.id
WHERE isrv."isActive" = true AND pso.id IS NULL
ON CONFLICT DO NOTHING;
