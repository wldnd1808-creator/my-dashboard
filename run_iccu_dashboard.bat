@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   ICCU 대시보드 (다른 노트북 접속 가능)
echo ========================================
echo.
echo [이 PC에서 보기]
echo   http://localhost:8501
echo.
echo [다른 노트북에서 보기] (같은 Wi-Fi/네트워크)
echo   http://[이 PC의 IPv4 주소]:8501
echo   --> IP 확인: 명령 프롬프트에서 ipconfig 입력 후 "IPv4 주소" 확인
echo.
echo 접속이 안 되면 allow_dashboard_firewall.bat 을
echo "관리자 권한으로 실행" 한 뒤 다시 시도하세요.
echo ========================================
echo.
py -m streamlit run iccu_streamlit_app.py --server.address 0.0.0.0
pause
