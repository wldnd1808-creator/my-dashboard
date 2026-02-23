# 분석 모델 대시보드

파이썬 분석 모델 기반 예측 결과를 시각화하는 대시보드입니다. 훈련 데이터와 예측 결과를 MariaDB에서 조회하고, FastAPI를 통해 예측을 수행합니다.

**처음 설정·실행 순서:** [docs/DASHBOARD_NEXT_STEPS.md](../docs/DASHBOARD_NEXT_STEPS.md) 참고.

## 시스템 구조

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  대시보드    │─────▶│  Node.js     │─────▶│  MariaDB    │
│  (프론트)    │      │  (Express)   │      │  (데이터)   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │ 예측 요청
                            ▼
                     ┌──────────────┐
                     │   FastAPI    │
                     │  (Python)    │
                     └──────────────┘
```

## 사전 준비

### 1. MariaDB 데이터베이스 설정

데이터베이스 스키마 생성:
```bash
mysql -u root -p test_db < docs/01_DB_SCHEMA.sql
```

### 2. 환경 변수 설정

**Python 백엔드** (`python_backend/.env`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=test_db
NODE_ALERT_WEBHOOK_URL=http://localhost:3000/api/dashboard/alert
```
(위험/이상 징후 시 Node.js를 통해 Slack 알림·DB 기록. 선택사항)

**Node.js 백엔드** (`node_backend/.env`):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=test_db
PREDICTION_API_URL=http://localhost:8000
```

### 3. Python 예측 모델 학습 (선택)

방전용량 예측에 사용할 선형 회귀 모델을 `cathode_calcination_data.csv`로 학습합니다.  
학습 결과는 `python_backend/models/model.json`에 저장됩니다.

```powershell
cd python_backend
python train_model.py
```

모델 파일이 없으면 FastAPI는 더미 예측 `(feature1 + feature2) / 2`를 사용합니다.

### 4. 의존성 설치

**Python 백엔드**:
```powershell
cd python_backend
pip install -r requirements.txt
```

**Node.js 백엔드**:
```powershell
cd node_backend
npm install
```

## 실행 방법

### 1. FastAPI 서버 실행 (포트 8000)

`python_backend`에서 실행합니다.

```powershell
cd python_backend
python main.py
```

또는:
```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Node.js 서버 실행 (포트 3000)

`node_backend`에서 실행합니다.

```powershell
cd node_backend
npm start
```

### 3. 브라우저 접속

**http://localhost:3000** 에 접속하면 대시보드가 열립니다.  
Node.js가 `dashboard/` 정적 파일을 서빙하고, `/api/dashboard/*` API로 MariaDB·FastAPI와 연동합니다.

**한 번에 실행 (프로젝트 루트):**
```powershell
.\run-dashboard.ps1
```
FastAPI와 Node를 각각 새 창에서 띄운 뒤, 브라우저로 대시보드를 엽니다.

### FastAPI만 사용하는 경우

Node 없이 FastAPI만 띄우고 대시보드 HTML을 직접 연다면, `dashboard/config.js`에서 `apiBase: "http://localhost:8000"`으로 설정한 뒤 `dashboard/index.html`을 브라우저에서 열거나, 로컬 웹 서버로 `dashboard/` 폴더를 서빙하면 됩니다. 대시보드가 FastAPI의 `/api/training-data`, `/api/predictions`, `/api/predict`를 직접 호출합니다.

## 주요 기능

### 📊 대시보드 카드
- **훈련 데이터 건수**: MariaDB에 저장된 훈련 데이터 총 개수
- **예측 결과 건수**: 예측 수행 횟수
- **평균 예측값**: 모든 예측값의 평균
- **최근 예측값**: 가장 최근에 수행한 예측값

### 🔮 예측 실행
- `feature1`, `feature2` 값을 입력하여 예측 수행
- FastAPI를 통해 예측 모델 호출
- 예측 결과는 자동으로 MariaDB에 저장

### 📈 데이터 시각화
- **예측 결과 차트**: 최근 예측값의 추이를 라인 차트로 표시
- **소성온도 vs 방전용량**: 훈련 데이터에서 Feature1에 따른 Target 변화
- **훈련 데이터 분포**: Feature1과 Feature2의 관계를 산점도로 표시

### 🕐 이벤트 타임라인
- 위험/이상 징후 감지 시 Slack 알림 및 DB 기록
- 이벤트 목록을 타임라인 형태로 표시

### 📋 데이터 테이블
- **훈련 데이터**: MariaDB의 `training_data` 테이블 조회
- **예측 결과**: MariaDB의 `predictions` 테이블 조회
- 각 테이블별로 표시 개수 조절 가능 (50/100/200건)

### 🔄 새로고침
- 데이터를 다시 불러와 최신 상태로 업데이트

## API 엔드포인트

### Node.js 백엔드 (포트 3000)
- `GET /` - 대시보드 페이지
- `GET /api/dashboard/summary` - 훈련 데이터 및 예측 결과 요약
- `GET /api/dashboard/health-status` - Node + FastAPI 연결 상태
- `GET /api/dashboard/training` - 훈련 데이터 조회
- `GET /api/dashboard/predictions` - 예측 결과 조회
- `POST /api/dashboard/predict` - 예측 요청
- `GET /api/dashboard/events` - 위험/이상 징후 이벤트 타임라인

### FastAPI 백엔드 (포트 8000)
- `GET /health` - 서버 상태 확인
- `GET /api/training-data` - 훈련 데이터 조회
- `GET /api/predictions` - 예측 결과 조회
- `POST /api/predict` - 예측 수행

## 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (Vanilla)
- **차트 라이브러리**: Chart.js
- **백엔드**: Node.js (Express), Python (FastAPI)
- **데이터베이스**: MariaDB
- **스타일링**: 다크 테마 기반 모던 UI

## 문제 해결

### 데이터베이스 연결 실패
- `.env` 파일의 DB 설정 확인
- MariaDB 서버가 실행 중인지 확인
- 데이터베이스 및 테이블이 생성되었는지 확인

### FastAPI 연결 실패
- FastAPI 서버가 포트 8000에서 실행 중인지 확인
- `node_backend/.env`의 `PREDICTION_API_URL` 확인

### 차트가 표시되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- Chart.js CDN 연결 확인
