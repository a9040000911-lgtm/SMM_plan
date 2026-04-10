UPDATE "ProviderService" SET platform = 'TELEGRAM' WHERE (name ILIKE '%telegram%' OR name ILIKE '%tg%') AND platform = 'OTHER';
UPDATE "InternalService" SET platform = 'TELEGRAM' WHERE (name ILIKE '%telegram%' OR name ILIKE '%tg%') AND platform = 'OTHER';
