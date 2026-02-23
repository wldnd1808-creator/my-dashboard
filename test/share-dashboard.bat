@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   대시보드 공개 공유 (localtunnel)
echo   누구나 주소만 치면 접속 가능
echo ========================================
echo.
echo [1] 로컬 서버 시작 (포트 3333)
echo [2] 공개 URL 생성 (가입 없이 무료)
echo.
echo ※ 생성된 https 주소를 다른 사람에게 공유하세요.
echo.

REM Node.js 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo   https://nodejs.org 에서 설치 후 다시 실행하세요.
    pause
    exit /b 1
)

echo 서버 시작 중...
start /B npx --yes serve energy_dashboard -p 3333 -l 3333

timeout /t 4 /nobreak >nul
echo.
echo 공개 URL 생성 중... (처음 실행 시 패키지 설치로 1분 정도 걸릴 수 있음)
echo.
echo *** 아래에 나오는 "your url is" 주소를 복사해서 공유하세요 ***
echo *** 예: https://xxxx.loca.lt ***
echo *** (처음 접속 시 "Click to Continue" 버튼 한 번 눌러야 할 수 있음) ***
echo.
npx --yes localtunnel --port 3333
pause
