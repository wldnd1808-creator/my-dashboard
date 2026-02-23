# 실행 순서 (중고차 + 대시보드)

Node(Express) + FastAPI + MariaDB를 사용할 때 **순서대로** 진행하세요.

---

## 1. MariaDB 실행

DB 서버가 켜져 있어야 합니다.

**PowerShell (관리자 권한):**
```powershell
Start-Service -Name MariaDB
```
(XAMPP 등이면 서비스 이름이 `MySQL`일 수 있음)

**상태 확인:**
```powershell
Get-Service -Name *mariadb*,*mysql* -ErrorAction SilentlyContinue
```

---

## 2. DB 스키마 및 샘플 데이터 적용 (최초 1회)

중고차 테이블(`used_cars`, `monthly_market_prices`)과 샘플 500건을 넣을 때만 실행합니다.

**2-1. 스키마 생성**
```powershell
cd c:\Users\Admin\Desktop\test
mysql -u 사용자명 -p DB이름 < docs\05_used_cars_schema.sql
```

**2-2. 샘플 데이터 생성 (SQL 파일로)**
```powershell
python generate_used_cars_sample.py --sql-only
```

**2-3. 샘플 데이터 삽입**
```powershell
mysql -u 사용자명 -p DB이름 < docs\used_cars_sample.sql
```

또는 **Python으로 DB에 직접 삽입** (`.env`에 DB 설정이 되어 있을 때):
```powershell
# python_backend/.env 에 DB_* 설정 후
cd python_backend
python ..\generate_used_cars_sample.py
```

---

## 3. 환경 변수 설정

**Node 백엔드** (`node_backend/.env`):
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` → MariaDB 접속 정보
- `PREDICTION_API_URL=http://localhost:8000` → FastAPI 주소

**Python 백엔드** (`python_backend/.env`):
- FastAPI만 쓰는 경우 필수 아님
- MariaDB/훈련·예측 저장용이면 `DB_*` 설정

`.env`가 없으면 각 폴더의 `.env.example`을 복사해 `.env`로 저장한 뒤 값을 채우세요.

---

## 4. FastAPI 실행 (포트 8000)

**터미널 1:**
```powershell
cd c:\Users\Admin\Desktop\test\python_backend
python main.py
```
또는:
```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

`Uvicorn running on http://0.0.0.0:8000` 이 보이면 성공입니다.

---

## 5. Node.js 실행 (포트 3000)

**터미널 2 (새 터미널):**
```powershell
cd c:\Users\Admin\Desktop\test\node_backend
npm install
npm start
```

`Node 서버: http://localhost:3000` 이 보이고  
`GET /api/used-cars/with-prediction?limit=50&offset=0` 안내가 나오면 성공입니다.

---

## 6. 확인

- **대시보드:** 브라우저에서 http://localhost:3000
- **중고차+예측 API:**  
  http://localhost:3000/api/used-cars/with-prediction?limit=10&offset=0  
  → 차량 리스트 + `predicted_price`(만원)가 합쳐진 JSON이 나와야 합니다.
- **FastAPI 상태:** http://localhost:8000/docs 에서 `POST /api/predict-price`, `POST /api/predict-price-batch` 확인

---

## 한 번에 실행 (PowerShell 스크립트)

대시보드만 켜려면 프로젝트 루트에서:

```powershell
.\run-dashboard.ps1
```

이 스크립트는 **FastAPI(8000)** 와 **Node(3000)** 만 순서대로 띄우고, 브라우저 열기 여부를 묻습니다.  
**MariaDB 실행**과 **스키마/샘플 적용**은 위 1~2단계를 먼저 해 두어야 합니다.
