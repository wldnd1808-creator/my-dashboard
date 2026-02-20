# my-dashboard — ICCU 품질 분석 대시보드

현대/기아 ICCU 결함 가상 데이터 기반 Streamlit 대시보드입니다.

## 실행 방법

1. **패키지 설치**
   ```bash
   py -m pip install -r requirements_iccu.txt
   ```

2. **대시보드 실행**
   - **`run_iccu_dashboard.bat`** 더블클릭  
   - 또는 터미널에서:
   ```bash
   py -m streamlit run iccu_streamlit_app.py --server.address 0.0.0.0
   ```

3. **브라우저**
   - 이 PC: http://localhost:8501  
   - 다른 노트북: http://[이 PC의 IPv4 주소]:8501 (같은 Wi‑Fi)

## GitHub에 푸시

이 폴더에서만 아래를 실행하세요.

```bash
cd my-dashboard
git add .
git commit -m "ICCU 대시보드 및 Supabase 스키마"
git push origin main
```

원격에 기존 커밋이 있어 푸시가 거부되면:

```bash
git pull origin main --allow-unrelated-histories
# 충돌 해결 후
git push origin main
```

또는 원격을 이 폴더 내용으로 덮어쓰려면:

```bash
git push origin main --force
```

## 포함 파일

- `iccu_streamlit_app.py` — Streamlit 대시보드
- `iccu_defect_analysis_data.csv` — 가상 데이터
- `run_iccu_dashboard.bat` / `allow_dashboard_firewall.bat` — 실행·방화벽
- `supabase_iccu_schema.sql` — Supabase DDL
- `ICCU_Streamlit_실행방법.md` / `ICCU_품질분석_보고서_요약.md` — 문서
