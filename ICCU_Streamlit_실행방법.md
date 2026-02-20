# ICCU Streamlit 대시보드 실행 방법

## 1. 필요한 패키지 설치

터미널에서 **이 폴더(my-dashboard)** 로 이동한 뒤:

```bash
py -m pip install -r requirements_iccu.txt
```

또는 `pip install streamlit pandas plotly`

---

## 2. 대시보드 실행

**`run_iccu_dashboard.bat`** 더블클릭 또는:

```bash
py -m streamlit run iccu_streamlit_app.py --server.address 0.0.0.0
```

- 이 PC: **http://localhost:8501**
- 다른 노트북: **http://[이 PC의 IPv4 주소]:8501** (같은 Wi‑Fi)
- 접속 안 되면 **`allow_dashboard_firewall.bat`** 을 관리자 권한으로 실행

---

## 3. 종료

터미널에서 **Ctrl + C**
