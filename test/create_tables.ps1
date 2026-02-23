# MariaDB 테이블 생성 스크립트
Write-Host "MariaDB 테이블 생성 중..." -ForegroundColor Cyan
Write-Host ""

$dbName = "test_db"
$dbUser = "root"
$dbPassword = "1234"
$sqlFile = "docs\01_DB_SCHEMA.sql"

Write-Host "데이터베이스: $dbName" -ForegroundColor Yellow
Write-Host "사용자: $dbUser" -ForegroundColor Yellow
Write-Host ""

# SQL 파일 실행
$sqlContent = Get-Content $sqlFile -Raw -Encoding UTF8
$sqlContent | mysql -u $dbUser -p$dbPassword $dbName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[성공] 테이블이 생성되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "테이블 확인:" -ForegroundColor Cyan
    mysql -u $dbUser -p$dbPassword $dbName -e "SHOW TABLES;"
} else {
    Write-Host ""
    Write-Host "[오류] 테이블 생성 실패. MariaDB 서버가 실행 중인지 확인하세요." -ForegroundColor Red
}
