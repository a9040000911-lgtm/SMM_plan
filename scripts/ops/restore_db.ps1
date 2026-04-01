# Restore SQL Script
$ErrorActionPreference = "Stop"

Write-Host "Dropping smmplan database..."
docker exec smmplan_db psql -U smmuser -d postgres -c "DROP DATABASE IF EXISTS smmplan WITH (FORCE);"

Write-Host "Creating smmplan database..."
docker exec smmplan_db createdb -U smmuser smmplan
docker exec smmplan_db psql -U smmuser -d smmplan -c "GRANT ALL PRIVILEGES ON DATABASE smmplan TO smmuser;"

Write-Host "Restoring backup..."
cmd /c "type d:\Smmplan\backups\smmplan_db_backup_2026-03-28T00-00-05.sql | docker exec -i smmplan_db psql -U smmuser -d smmplan"

Write-Host "Restoration complete."
