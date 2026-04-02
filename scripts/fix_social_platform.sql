UPDATE "InternalService" 
SET "socialPlatformId" = (SELECT id FROM "SocialPlatform" WHERE slug = 'telegram') 
WHERE (name ILIKE '%telegram%' OR name ILIKE '%tg%') 
  AND ("socialPlatformId" IS NULL OR "socialPlatformId" = (SELECT id FROM "SocialPlatform" WHERE slug = 'other'));

UPDATE "ProviderService" 
SET "socialPlatformId" = (SELECT id FROM "SocialPlatform" WHERE slug = 'telegram') 
WHERE (name ILIKE '%telegram%' OR name ILIKE '%tg%') 
  AND ("socialPlatformId" IS NULL OR "socialPlatformId" = (SELECT id FROM "SocialPlatform" WHERE slug = 'other'));
