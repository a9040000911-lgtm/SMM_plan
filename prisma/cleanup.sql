DELETE FROM "AdminLog" WHERE "adminId" NOT IN (SELECT id FROM "User");
