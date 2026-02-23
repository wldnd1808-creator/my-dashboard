# 대시보드 만들기 – 다음 할 일 (순서대로)

대시보드를 띄우고 사용하기까지 **차례대로** 진행하면 됩니다.

---

## 1단계: 준비 확인

### 1-1. MariaDB 실행

- Windows: `Start-Service MariaDB` 또는 `net start MariaDB` (관리자)
- 자세히: [MARIADB_START_WINDOWS.md](MARIADB_START_WINDOWS.md)

### 1-2. DB 생성 + 테이블 생성

```powershell
# MariaDB 접속 (비밀번호 입력)
mysql -u root -p

# SQL 실행
CREATE DATABASE IF NOT EXISTS test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE test_db;
```

그 다음 `docs/01_DB_SCHEMA.sql` 내용을 **복사해 클라이언트에 붙여넣고 실행**하거나:

```powershell
mysql -u root -p test_db < "C:\Users\Admin\Desktop\test\docs\01_DB_SCHEMA.sql"
```

→ `training_data`, `predictions` 테이블이 생기면 OK.

**중고차 가격 예측 탭**을 사용하려면 같은 DB에 `used_cars` 테이블도 필요합니다:

```powershell
# car_project DB 사용 시 (또는 test_db에 05 스키마 추가)
mysql -u root -p car_project < docs\05_used_cars_schema.sql
mysql -u root -p car_project < docs\used_cars_sample.sql
```

Node `.env`의 `DB_NAME`을 `car_project`로 설정하면 중고차 탭이 동작합니다.  
두 탭 모두 사용하려면 **하나의 DB**에 `01_DB_SCHEMA.sql` + `05_used_cars_schema.sql` 테이블을 모두 생성하세요.

### 1-3. .env 설정

**`python_backend/.env`**

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=본인비밀번호
DB_NAME=test_db
```

**`node_backend/.env`**

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=본인비밀번호
DB_NAME=test_db
PREDICTION_API_URL=http://localhost:8000
```

- `DB_USER` / `DB_PASSWORD` / `DB_NAME` 은 1-2에서 쓴 것과 **동일**하게.

### 1-4. 연결 테스트

```powershell
cd python_backend
python check_db.py
# "[OK] 연결 성공" 나오면 다음 단계

cd ..\node_backend
node check_db.js
# "연결 성공" 나오면 OK
```

---

## 2단계: 의존성 설치 (최초 1회)

```powershell
cd python_backend
pip install -r requirements.txt

cd ..\node_backend
npm install
```

---

## 3단계: (선택) 훈련 데이터·모델 준비

### 3-1. 훈련 데이터 DB 적재

CSV → `training_data` 테이블:

```powershell
cd C:\Users\Admin\Desktop\test
python upload_csv_to_db.py
```

- `cathode_calcination_data.csv`가 프로젝트 루트에 있어야 함.

### 3-2. 예측 모델 학습

```powershell
cd python_backend
python train_model.py
```

- `models/model.json` 생성됨.
- 없어도 FastAPI는 **더미 예측**으로 동작함.

---

## 4단계: 서버 실행

**터미널 2개** 사용.

### 터미널 1 – FastAPI (포트 8000)

```powershell
cd C:\Users\Admin\Desktop\test\python_backend
python main.py
```

- `Uvicorn running on http://0.0.0.0:8000` 나오면 성공.

### 터미널 2 – Node.js (포트 3000)

```powershell
cd C:\Users\Admin\Desktop\test\node_backend
npm start
```

- `Node 서버: http://localhost:3000` 나오면 성공.

---

## 5단계: 대시보드 확인

1. 브라우저에서 **http://localhost:3000** 접속.
2. **시스템 상태**: Node.js(대시보드 API), FastAPI(예측 API) 연결 여부 확인. 둘 다 "연결됨"이면 정상.
3. **카드**: 훈련 데이터 건수, 예측 결과 건수, 평균/최근 예측값 확인.
4. **예측 실행**: 소성온도·소성시간 입력 후 **예측** 클릭 → 결과·품질 판정 확인.
5. **테이블**: 훈련 데이터, 예측 결과 리스트 표시 여부 확인.
6. **차트**: 예측 추이, 소성온도 vs 방전용량, 훈련 데이터 분포 확인.
7. **중고차 가격 예측 탭**: 상단 탭에서 전환 시 MariaDB `used_cars` + FastAPI 예측 가격이 표시됩니다.
8. **새로고침** 버튼으로 데이터 다시 불러오기.

데이터가 없으면 상단에 **데이터 없음 안내**가 표시됩니다. 훈련 데이터는 `upload_csv_to_db.py`, 예측 결과는 대시보드에서 예측 실행 시 자동으로 MariaDB에 쌓입니다.

---

## 6단계: (이후) 개선하고 싶을 때

| 하고 싶은 것 | 예시 |
|--------------|------|
| UI 바꾸기 | `dashboard/config.js` 에서 라벨·단위·범위 수정 |
| 차트 추가 | `app.js` 에 새 Chart, API에서 필요한 데이터 넘기기 |
| 입력 항목 추가 | FastAPI `PredictRequest`·DB·프론트 폼 확장 |
| 배포 | Node·FastAPI·MariaDB 서버에 배포, reverse proxy 설정 |
| 인증 | Node에 로그인·세션 추가 후 대시보드 보호 |

---

## 한 줄 요약

1. **MariaDB** 켜기 → **DB + 테이블** 만들기 → **.env** 설정 → **check_db** 로 연결 확인  
2. **pip / npm install**  
3. **(선택)** CSV 업로드, `train_model.py`  
4. **FastAPI** 실행 → **Node** 실행 → **http://localhost:3000** 에서 대시보드 확인  

문제 나오면 `연결 실패` 여부, 터미널·브라우저 콘솔 에러 메시지와 함께 알려주면 됩니다.
