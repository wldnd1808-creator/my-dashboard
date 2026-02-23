@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "energy_dashboard\index.html"
echo 에너지 대시보드가 브라우저에서 열립니다.
