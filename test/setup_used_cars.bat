@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM mysql 경로: PATH에 없으면 MariaDB 기본 설치 경로 사용
set "MYSQL_CMD=mysql"
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MariaDB 12.1\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MariaDB 12.1\bin\mysql.exe"
    ) else if exist "C:\Program Files\MariaDB 11.6\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MariaDB 11.6\bin\mysql.exe"
    ) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    ) else (
        echo [오류] mysql을 찾을 수 없습니다.
        echo   - MariaDB/MySQL 설치 확인
        echo   - 또는 PATH에 bin 폴더 추가: C:\Program Files\MariaDB 12.1\bin
        pause
        exit /b 1
    )
)
echo mysql 사용: %MYSQL_CMD%
echo.

echo ============================================
echo   중고차 DB 설정 (스키마 + 샘플 500건)
echo   DB: car_project
echo ============================================
echo.

echo [1/2] 스키마 적용 (used_cars, monthly_market_prices 테이블 생성)...
"%MYSQL_CMD%" -u root -p car_project < docs\05_used_cars_schema.sql
if %errorlevel% neq 0 (
    echo [오류] 스키마 적용 실패. 비밀번호와 DB 이름(car_project)을 확인하세요.
    pause
    exit /b 1
)
echo 스키마 적용 완료.
echo.

echo [2/2] 샘플 데이터 500건 적용...
"%MYSQL_CMD%" -u root -p car_project < docs\used_cars_sample.sql
if %errorlevel% neq 0 (
    echo [오류] 샘플 데이터 적용 실패.
    pause
    exit /b 1
)
echo 샘플 데이터 적용 완료.
echo.

echo [확인] 테이블 건수:
"%MYSQL_CMD%" -u root -p car_project -e "SELECT 'used_cars' AS tbl, COUNT(*) AS cnt FROM used_cars UNION ALL SELECT 'monthly_market_prices', COUNT(*) FROM monthly_market_prices;"
echo.
echo 모두 완료되었습니다.
pause
