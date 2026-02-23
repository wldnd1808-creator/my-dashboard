@echo off
echo MariaDB 테이블 생성 중...
echo.
echo 데이터베이스: test_db
echo 사용자: root
echo.
mysql -u root -p1234 test_db < docs\01_DB_SCHEMA.sql
if %errorlevel% == 0 (
    echo.
    echo [성공] 테이블이 생성되었습니다!
    echo.
    echo 테이블 확인:
    mysql -u root -p1234 test_db -e "SHOW TABLES;"
) else (
    echo.
    echo [오류] 테이블 생성 실패. MariaDB 서버가 실행 중인지 확인하세요.
)
pause
