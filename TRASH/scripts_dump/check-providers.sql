SELECT id, name, type, "isEnabled" FROM "Provider";
SELECT "providerId", MAX("lastUpdated") as last_sync FROM "ProviderService" GROUP BY "providerId";
