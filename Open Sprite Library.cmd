@echo off
cd /d "%~dp0"
node scripts/launch.mjs --sprites
if errorlevel 1 pause
