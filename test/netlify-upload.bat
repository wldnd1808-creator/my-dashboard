@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   대시보드 공개 배포 (Netlify)
echo   언제 어디서든, 제약 없이 접속 가능
echo ========================================
echo.
echo ZIP 생성 중...

REM PowerShell로 energy_dashboard 폴더를 zip으로 압축 (폴더 내용만, 폴더 자체 제외)
powershell -Command "Compress-Archive -Path 'energy_dashboard\*' -DestinationPath 'energy_dashboard_netlify.zip' -Force"

if exist energy_dashboard_netlify.zip (
    echo.
    echo [완료] energy_dashboard_netlify.zip 생성됨
    echo.
    echo 다음 단계:
    echo 1. Netlify 페이지가 브라우저에서 열립니다
    echo 2. ZIP 파일이 선택된 탐색기 창이 열립니다
    echo 3. ZIP 파일을 Netlify 화면에 드래그해서 놓으세요
    echo 4. 배포 완료 후 나오는 링크가 영구 주소입니다
    echo.
    echo ※ 계정 가입 없이 사용 가능
    echo ※ PC를 꺼도 24시간 접속 가능
    echo.
    timeout /t 2 /nobreak >nul
    start "" "https://app.netlify.com/drop"
    timeout /t 1 /nobreak >nul
    start explorer /select,"%CD%\energy_dashboard_netlify.zip"
) else (
    echo [오류] ZIP 생성 실패
)

echo.
pause
