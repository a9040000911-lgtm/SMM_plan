@echo off
echo Running Zero-Risk Batch Migration (Steps 4, 5, 6)
echo.

set ROOT=d:\Smmplan\src\app\admin

echo [Step 4] Customer Support Consolidation
xcopy "%ROOT%\bug-reports" "%ROOT%\support\bug-reports\" /E /H /C /I /Y
move /Y "%ROOT%\marketing\reviews\actions.ts" "%ROOT%\reviews\marketing-actions.ts"

echo [Step 5] Authentication Cleanup
move /Y "%ROOT%\auth\actions.ts" "%ROOT%\login\auth-actions.ts"

echo [Step 6] Garbage Collection
rmdir /S /Q "%ROOT%\bug-reports"
rmdir /S /Q "%ROOT%\marketing"
rmdir /S /Q "%ROOT%\auth"

echo Migration Batch Complete!
