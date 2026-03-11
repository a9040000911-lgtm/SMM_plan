SELECT id, name, "botToken" is not null as has_token FROM "Project";
SELECT u.id, u.username, u."projectId", p.name as project_name, u."tgId" 
FROM "User" u 
LEFT JOIN "Project" p ON u."projectId" = p.id 
WHERE u.id IN (SELECT "userId" FROM "SupportTicket" WHERE status != 'CLOSED');
