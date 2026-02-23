# 파이썬 분석 모델 + 대시보드 백엔드 가이드 (초보자용)

## 1. 전체 구조 이해하기 (먼저 그려보기)

```
[프론트엔드 대시보드]  ←  사용자가 결과를 본다
        ↑
        │ HTTP 요청/응답
        ↓
[Node.js 서버]  ←  대시보드 API, 라우팅, 정적 파일
        ↑
        │ 내부 호출 (HTTP 또는 직접)
        ↓
[FastAPI 서버]  ←  파이썬 예측 모델 실행, 훈련 데이터 처리
        ↑
        │ SQL 쿼리
        ↓
[MariaDB]  ←  훈련 데이터, 예측 결과, 대시보드용 데이터 저장
```

**왜 백엔드를 두 개로 나누나요?**
- **FastAPI**: 파이썬으로 만든 **분석/예측 모델**을 실행하기 좋습니다. (NumPy, Pandas, scikit-learn 등)
- **Node.js**: 웹 대시보드용 **API**, 세션·인증, 정적 파일 서빙 등에 많이 씁니다.
- 대시보드는 "Node.js가 데이터를 가져와서 보여준다" → 필요한 예측은 "Node.js가 FastAPI에게 요청" → "FastAPI가 모델 돌리고 DB 읽기/쓰기" 순서로 생각하면 됩니다.

---

## 2. 시작 순서 (어디서부터 손대면 좋은지)

### 2단계씩 나누기

| 순서 | 할 일 | 설명 |
|------|--------|------|
| **①** | MariaDB 테이블 설계 | 어떤 데이터를 넣을지·뽑을지 정한다 |
| **②** | FastAPI + DB 연결 | 파이썬에서 MariaDB 연결, 조회/저장 |
| **③** | FastAPI + 예측 모델 연결 | 학습된 모델 불러와서 예측 API 만들기 |
| **④** | Node.js + DB 연결 | 대시보드용 데이터 조회 API |
| **⑤** | Node.js → FastAPI 호출 | "예측해줘" 요청 보내고 결과 받기 |
| **⑥** | API 정리·문서화 | URL 규칙 정하고, 나중에 프론트엔드가 부를 수 있게 |

실제 코딩은 **① → ② → ③ → ④ → ⑤ → ⑥** 순서로 진행하는 것을 추천합니다.

---

## 3. ① MariaDB 테이블 설계 (가장 먼저 할 일)

**왜 여기서부터?**  
나중에 쓰일 "훈련 데이터", "예측 결과", "대시보드용 데이터"가 다 DB에 들어가므로, **저장 형식을 먼저 정해두는 것**이 백엔드 설계의 기준이 됩니다.

**초보자용 체크리스트:**
1. "대시보드에 뭘 띄울지" 리스트업 (예: 날짜, 지표명, 예측값, 실제값 등)
2. "훈련에 쓸 데이터"가 어떤 컬럼으로 들어오는지 정리
3. 각각을 **테이블**로 나누고, **컬럼 이름·타입**을 정함

**예시 (아주 단순한 경우):**

```sql
-- 훈련/원본 데이터
CREATE TABLE training_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  feature1 FLOAT,
  feature2 FLOAT,
  target FLOAT
);

-- 예측 결과 (대시보드에서 보여줄 것)
CREATE TABLE predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_name VARCHAR(50),
  input_summary JSON,
  prediction_value FLOAT,
  meta JSON
);
```

이 단계에서 **실제 DB를 만들고**, 위 스크립트를 실행해 두면, 다음 단계에서 "이 테이블에 맞춰 FastAPI/Node.js 코드를 짠다"고 생각하면 됩니다.

---

## 4. ② FastAPI + MariaDB 연결 (파이썬에서 DB 쓰기)

**목표:** FastAPI 서버가 MariaDB에 접속해서 `training_data` 조회/저장하는 것까지 만드는 단계.

**초보자용 흐름:**
1. 프로젝트 폴더에 `requirements.txt`에 패키지 추가  
   - 예: `fastapi`, `uvicorn`, `pymysql` 또는 `sqlalchemy`, `cryptography`
2. DB 접속 정보 관리  
   - 비밀번호 등은 환경 변수(`.env`)에 두고, 코드에서는 `os.getenv(...)` 등으로 읽기
3. "DB 연결해서 한 번 조회해보기" 정도의 작은 스크립트를 먼저 만든 뒤,
4. 그 로직을 FastAPI 라우트 안에서 호출  
   - 예: `GET /api/training-data` → MariaDB에서 `training_data` SELECT → JSON으로 반환

**파일 구조 예시:**
```
프로젝트/
  python_backend/     ← FastAPI용
    main.py           # FastAPI 앱, 라우트 정의
    db.py             # MariaDB 연결, 쿼리 함수
    .env.example      # HOST, USER, PASSWORD, DB 이름 등
  node_backend/       ← Node.js용 (나중에)
```

여기까지 되면 "FastAPI만 켜도 DB 데이터가 JSON으로 나온다"를 목표로 하면 됩니다.

---

## 5. ③ FastAPI + 예측 모델 연결 (파이썬 모델 서빙)

**목표:** 이미 학습해 둔 파이썬 모델(예: `.pkl`, `.joblib`)을 불러와서, FastAPI 엔드포인트에서 "입력 받고 → 예측값 반환"까지 구현.

**초보자용 흐름:**
1. 모델 파일 위치 정하기  
   - 예: `python_backend/models/model.pkl`
2. FastAPI 앱 기동 시 한 번만 `joblib.load()` 또는 `pickle.load()`로 로드
3. 전용 라우트 추가  
   - 예: `POST /api/predict`  
     - body: `{ "feature1": 1.2, "feature2": 3.4 }`  
     - 응답: `{ "prediction": 0.85 }`
4. 필요하면 이 단계에서 **예측 결과를 DB의 `predictions` 테이블에 INSERT**하는 로직도 넣기  
   - 그러면 나중에 대시보드는 "Node.js 또는 FastAPI"가 `predictions`를 조회해서 보여주면 됩니다.

**주의할 점:**
- 모델 로드는 앱 시작 시 한 번만 하고, 요청마다 재로드하지 않는 편이 좋습니다.
- 입력 검증은 `pydantic` 모델로 해두면 실수하기 어렵고, 문서화에도 유리합니다.

---

## 6. ④ Node.js + MariaDB 연결 (대시보드용 API)

**목표:** "대시보드가 보여줄 데이터"를 Node.js가 MariaDB에서 읽어서 JSON으로 넘겨주는 API를 만드는 단계.

**초보자용 흐름:**
1. Node.js 프로젝트 폴더 생성  
   - 예: `node_backend/`, `package.json`, `npm install express mysql2` 등
2. MariaDB 연결  
   - `mysql2` 패키지 사용, 접속 정보는 역시 환경 변수에서 읽기
3. 대시보드에 필요한 데이터만 가져오는 API 작성  
   - 예: `GET /api/dashboard/summary`  
     - `predictions` + `training_data`를 조인하거나, 집계해서 최근 N개만 반환
4. CORS 설정  
   - 프론트엔드가 다른 포트(예: 3000)에서 뜰 것을 가정하고, FastAPI/Node 서버에서 CORS를 열어두기

**파일 구조 예시:**
```
node_backend/
  src/
    index.js      # Express 앱, 포트 3000 등
    routes/
      dashboard.js  # /api/dashboard/* 라우트
    db.js         # MariaDB 연결 풀, 쿼리 헬퍼
  .env.example
```

여기까지 되면 "Node 서버 주소 + /api/dashboard/..." 를 브라우저나 Postman으로 호출했을 때 DB 기반 JSON이 보이면 성공입니다.

---

## 7. ⑤ Node.js → FastAPI 호출 (예측 요청 연결)

**목표:** 대시보드에서 "지금 입력값으로 예측해줘"라고 할 때, Node.js가 그 요청을 받아서 FastAPI의 `/api/predict`에 넘기고, 결과를 받아서 다시 프론트에 주는 방식입니다.

**초보자용 흐름:**
1. Node.js에 `GET /api/predict` 또는 `POST /api/predict` 같은 라우트 추가
2. 그 핸들러 안에서  
   - `axios` 또는 `fetch`로 `http://localhost:8000/api/predict` (FastAPI 주소)에 요청
3. FastAPI 응답을 그대로 또는 가공해서 클라이언트에게 반환
4. 필요하다면 Node 쪽에서 "예측 요청 로그"를 다시 MariaDB에 남기도록 구현

**주의할 점:**
- FastAPI 서버가 꺼져 있으면 예측 API는 실패하므로, 배포 시에는 FastAPI를 같은 서버 내 다른 포트로 띄우거나, 도메인/경로만 다르게 두는 식으로 같이 띄워둡니다.
- 주소는 환경 변수로 두면 좋습니다. 예: `PREDICTION_API_URL=http://localhost:8000`

---

## 8. ⑥ API 정리·문서화 (프론트엔드와 맞추기)

**목표:** "대시보드는 이 URL을 이렇게 호출한다"를 한눈에 볼 수 있게 정리하는 단계.

**초보자용 체크리스트:**
1. **Node.js 쪽에서 대시보드가 부를 API**  
   - 예: `GET /api/dashboard/summary`, `POST /api/predict` (Node가 FastAPI로 프록시)
2. **FastAPI에만 두는 API**  
   - 예: `GET /api/training-data`, `POST /api/predict` (내부용)
3. 각 URL별로  
   - method, request body 예시, response 예시를 표로 적어두기  
   - FastAPI는 `/docs`로 자동 문서가 나오므로, 그걸 캡처해 두어도 좋습니다.

이걸 **한글 메모**나 **문서 한 페이지**로 만들어 두면, 나중에 프론트엔드 개발할 때 "어디를 호출하면 어떤 데이터가 오는지" 기억하기 쉽습니다.

---

## 9. 한 번에 정리한 “시작 순서” 요약

1. **MariaDB**에 테이블 만들기 (`training_data`, `predictions` 등)
2. **FastAPI**에서 DB 연결 → 훈련 데이터 조회/저장
3. **FastAPI**에서 모델 로드 → `/api/predict` 구현
4. **Node.js**에서 DB 연결 → 대시보드용 `/api/dashboard/...` 구현
5. **Node.js**에서 FastAPI 예측 API 호출 → 대시보드용 "예측 트리거" API 만들기
6. **URL·요청/응답 형태** 문서로 정리

---

## 10. 다음 단계 (코드로 들어가기)

이 가이드만으로는 “파일을 어떻게 만들고, 첫 줄을 뭘 써야 할지”가 애매할 수 있으니, 같은 프로젝트 안에 아래처럼 **실제 코드 뼈대**를 두었다고 가정하면 좋습니다.

- `docs/01_DB_SCHEMA.sql` — 테이블 생성 스크립트 예시
- `python_backend/` — FastAPI + MariaDB + 예측 라우트 예시
- `node_backend/` — Express + MariaDB + FastAPI 호출 예시

---

## 11. 실제로 만들어진 뼈대 구조 (이번에 추가된 것)

```
test/
  docs/
    01_DB_SCHEMA.sql     ← ① MariaDB 테이블 생성 스크립트
  python_backend/        ← ②·③ FastAPI + MariaDB + 예측 API
    .env.example
    requirements.txt
    db.py                # DB 연결, 훈련/예측 CRUD
    main.py              # /api/training-data, /api/predictions, /api/predict
  node_backend/          ← ④·⑤ Node.js + MariaDB + FastAPI 호출
    .env.example
    package.json
    src/
      index.js           # Express 앱, 포트 3000
      db.js              # MariaDB 연결, 훈련/예측 조회
      routes/
        dashboard.js     # /api/dashboard/summary, .../predict
```

### FastAPI (python_backend, 포트 8000)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /health | 상태 확인 |
| GET | /api/training-data?limit=100 | 훈련 데이터 조회 |
| POST | /api/training-data | 훈련 데이터 1건 저장 (body: feature1, feature2, target) |
| GET | /api/predictions?limit=100 | 예측 결과 조회 |
| POST | /api/predict | 예측 수행 (body: feature1, feature2) → 나중에 실제 모델 연결 |

### Node.js (node_backend, 포트 3000)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /health | 상태 확인 |
| GET | /api/dashboard/summary?limit=50 | 훈련 + 예측 요약 (대시보드용) |
| GET | /api/dashboard/training?limit=100 | 훈련 데이터 |
| GET | /api/dashboard/predictions?limit=100 | 예측 결과 |
| POST | /api/dashboard/predict | 예측 요청 → 내부에서 FastAPI /api/predict 호출 |

### 처음 실행 순서 (초보자용)

1. **MariaDB**에 DB 생성 후 `docs/01_DB_SCHEMA.sql` 실행  
2. **python_backend**:  
   - `.env.example` 복사 → `.env` 만들고 DB 정보 입력  
   - `pip install -r requirements.txt`  
   - `python main.py` → http://localhost:8000  
3. **node_backend**:  
   - `.env.example` 복사 → `.env` 만들고 DB 정보 + `PREDICTION_API_URL=http://localhost:8000`  
   - `npm install`  
   - `npm start` → http://localhost:3000  

대시보드 프론트는 `http://localhost:3000/api/dashboard/summary` 등을 호출하면 됩니다.

---

원하시면 "지금 정해둔 훈련 데이터/대시보드 항목"을 알려주시면, 그에 맞춘 `CREATE TABLE`과 FastAPI·Node 예시 코드를 더 구체적으로 바꿔 드리겠습니다.
