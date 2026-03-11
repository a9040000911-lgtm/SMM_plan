---
name: database_safety
description: Mandatory protocols for database persistence and backup during migrations or structural changes.
---

# Database Safety & Persistence Protocol

This skill dictates the mandatory steps that must be taken whenever the database schema or data structure is modified.

## 🛑 1. Mandatory Pre-Modification Backup
Before running ANY command that modifies the database (e.g., `prisma migrate dev`, `prisma db push`, `SQL ALTER`), you MUST:
1. **Identify the Database Type**: Determine if it's PostgreSQL, MySQL, SQLite, etc.
2. **Perform a Full Backup**:
   - For PostgreSQL in Docker: `docker exec <container> pg_dump -U <user> <db> > backup.sql`
   - **CRITICAL**: Do NOT use `&&` in the current terminal environment; it is not supported and will cause failures. Execute commands sequentially.
3. **Verify Backup Integrity**: Ensure the backup file is created and contains data.

## ⚙️ 2. Controlled Migration
1. **Never use --force-reset**: Avoid `prisma migrate dev` or `prisma db push` if it threatens to wipe data.
2. **Audit SQL**: Read the generated migration SQL BEFORE applying it.
2. **Handle Data Loss Warnings**: If Prisma (or any tool) warns about data loss (e.g., "Step 1: The row 'X' will be dropped"), STOP and manually verify if that data can be migrated or if it must be re-inserted.
3. **Use Transactional Migrations**: Ensure migrations are wrapped in transactions where supported.

## 🔄 3. Post-Migration Data Restoration
1. **Verification**: After migration, run a diagnostic script/query to check if critical tables (Users, Projects, Orders) still contain data.
2. **Restoration**: If data was lost, use the backup created in Step 1 to restore it.
3. **Integrity Check**: Validate that relationships (foreign keys) are still intact in the new structure.

## 📝 4. Documentation
Record the backup location and the migration steps taken in the task logs or `walkthrough.md`.
