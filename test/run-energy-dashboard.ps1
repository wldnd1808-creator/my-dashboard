# 공정 에너지 최적화 대시보드 실행
# index.html을 기본 브라우저로 엽니다.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardPath = Join-Path $scriptDir "energy_dashboard\index.html"

if (Test-Path $dashboardPath) {
    Start-Process $dashboardPath
    Write-Host "대시보드가 브라우저에서 열립니다: $dashboardPath"
} else {
    Write-Host "에러: energy_dashboard\index.html을 찾을 수 없습니다."
    exit 1
}
