@echo off
cd /d "%~dp0"
set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 if exist "D:\node.exe" set "NODE_EXE=D:\node.exe"
"%NODE_EXE%" server.js
pause
