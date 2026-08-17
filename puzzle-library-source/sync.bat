@echo off
echo Scanning for new games...
powershell -ExecutionPolicy Bypass -File "%~dp0sync_games.ps1"
exit
