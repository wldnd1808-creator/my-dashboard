# my-dashboard — ICCU 품질 분석 대시보드

현대/기아 ICCU 결함 가상 데이터 기반 **Next.js** 대시보드입니다.  
(기존 Streamlit 앱은 `iccu_streamlit_app.py`로 유지됩니다.)

## Next.js 실행 방법 (권장)

1. **패키지 설치**
   ```bash
   cd my-dashboard
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   - 브라우저: http://localhost:3000

3. **프로덕션 빌드 및 실행**
   ```bash
   npm run build
   npm start
   ```

## Streamlit 실행 방법 (레거시)

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
   - 브라우저: http://localhost:8501

## 포함 파일

- **Next.js**: `app/` (페이지·API), `types/`, `iccu_defect_analysis_data.csv` (데이터)
- **Streamlit (레거시)**: `iccu_streamlit_app.py`, `run_iccu_dashboard.bat`, `allow_dashboard_firewall.bat`
- `supabase_iccu_schema.sql` — Supabase DDL
- `ICCU_Streamlit_실행방법.md` / `ICCU_품질분석_보고서_요약.md` — 문서

## Vercel 배포

이 프로젝트는 Next.js이므로 Vercel에 연결하면 자동으로 빌드·배포됩니다.  
`vercel.json`은 Next.js 프레임워크로 설정되어 있습니다.
