@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 scripts\research_platform.py start %*
) else (
  python scripts\research_platform.py start %*
)
if errorlevel 1 exit /b 1
