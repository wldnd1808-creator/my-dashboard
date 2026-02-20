@echo off
chcp 65001 >nul
:: 관리자 권한으로 실행해야 합니다. 실패하면 "관리자 권한으로 실행" 후 다시 시도하세요.
echo ICCU 대시보드(8501) 포트 방화벽 허용을 추가합니다.
netsh advfirewall firewall add rule name="Streamlit ICCU Dashboard" dir=in action=allow protocol=TCP localport=8501
if %errorlevel% equ 0 (
    echo.
    echo 방화벽 규칙이 추가되었습니다. 다른 노트북에서 접속할 수 있습니다.
) else (
    echo.
    echo 실패했습니다. 이 파일을 "관리자 권한으로 실행" 해 보세요.
    echo 또는 Windows 방화벽에서 수동으로 인바운드 8501 포트를 허용하세요.
)
echo.
pause
