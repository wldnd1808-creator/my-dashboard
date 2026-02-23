# 대시보드 실행 스크립트 (Node + FastAPI)
# 사용법: .\run-dashboard.ps1
# - FastAPI(8000)와 Node(3000)를 각각 새 창에서 실행한 뒤 브라우저를 엽니다.

$root = $PSScriptRoot
$pythonBackend = Join-Path $root "python_backend"
$nodeBackend = Join-Path $root "node_backend"

Write-Host "=== 분석 모델 대시보드 실행 ===" -ForegroundColor Cyan
Write-Host ""

# FastAPI 실행 (새 창)
Write-Host "[1/2] FastAPI 서버 시작 (포트 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pythonBackend'; python main.py"
Start-Sleep -Seconds 2

# Node 실행 (새 창)
Write-Host "[2/2] Node.js 서버 시작 (포트 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$nodeBackend'; npm start"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "대시보드: http://localhost:3000" -ForegroundColor Green
Write-Host "FastAPI:   http://localhost:8000" -ForegroundColor Green
Write-Host ""
$open = Read-Host "브라우저로 대시보드를 열까요? (Y/n)"
if ($open -ne "n" -and $open -ne "N") {
  Start-Process "http://localhost:3000"
}
