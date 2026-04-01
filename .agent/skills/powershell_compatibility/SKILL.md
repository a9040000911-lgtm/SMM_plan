# skill: Windows PowerShell Compatibility
Ensure all multi-command operations for Windows environments use `;` or separate `run_command` calls instead of `&&`. 
PowerShell versions < 7.0 do not support `&&` for command chaining.
Always verify `Test-Path` before operations and use `Recurse -Force` for cleanup.
