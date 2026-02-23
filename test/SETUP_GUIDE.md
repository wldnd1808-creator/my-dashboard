# 대시보드 시스템 설정 가이드

이 가이드는 파이썬 분석 모델 기반 대시보드 시스템을 처음부터 설정하는 방법을 안내합니다.

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [Python 백엔드 설정](#python-백엔드-설정)
4. [Node.js 백엔드 설정](#nodejs-백엔드-설정)
5. [시스템 실행](#시스템-실행)
6. [테스트](#테스트)

## 시스템 요구사항

- **Python 3.8+**
- **Node.js 16+**
- **MariaDB 10.5+** 또는 **MySQL 8.0+**
- **npm** 또는 **yarn**

## 데이터베이스 설정

### 1. MariaDB 설치 및 실행

MariaDB가 설치되어 있지 않은 경우:
- Windows: [MariaDB 다운로드](https://mariadb.org/download/)
- 또는 MySQL 사용 가능

### 2. 데이터베이스 및 테이블 생성

```bash
# MariaDB 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 파일 실행
mysql -u root -p test_db < docs/01_DB_SCHEMA.sql
```

또는 직접 SQL 실행:
```sql
USE test_db;

CREATE TABLE IF NOT EXISTS training_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  feature1 FLOAT COMMENT '입력 특징 1',
  feature2 FLOAT COMMENT '입력 특징 2',
  target FLOAT COMMENT '정답(레이블)'
);

CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_name VARCHAR(50) COMMENT '사용한 모델 이름',
  input_summary JSON COMMENT '예측에 쓴 입력 요약',
  prediction_value FLOAT COMMENT '예측값',
  meta JSON COMMENT '기타 메타정보'
);
```

## Python 백엔드 설정

### 1. 가상 환경 생성 (권장)

```powershell
cd python_backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# 또는
source venv/bin/activate  # Linux/Mac
```

### 2. 의존성 설치

```powershell
pip install -r requirements.txt
```

필요한 패키지:
- `fastapi`
- `uvicorn`
- `pymysql`
- `python-dotenv`

### 3. 환경 변수 설정

`python_backend/.env` 파일 확인:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=test_db
```

### 4. 데이터베이스 연결 테스트

```powershell
python check_db.py
```

성공하면 "DB 연결 성공" 메시지가 표시됩니다.

### 5. 예측 모델 학습 (선택)

프로젝트 루트의 `cathode_calcination_data.csv`로 선형 회귀 모델을 학습합니다.

```powershell
cd python_backend
python train_model.py
```

`models/model.json`이 생성됩니다. 없으면 FastAPI는 더미 예측을 사용합니다.

## Node.js 백엔드 설정

### 1. 의존성 설치

```powershell
cd node_backend
npm install
```

필요한 패키지:
- `express`
- `mysql2`
- `axios`
- `cors`
- `dotenv`

### 2. 환경 변수 설정

`node_backend/.env` 파일 확인:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=test_db
PREDICTION_API_URL=http://localhost:8000
```

### 3. 데이터베이스 연결 테스트

```powershell
node check_db.js
```

## 시스템 실행

### 방법 1: 개별 실행 (권장)

**터미널 1 - FastAPI 서버:**
```powershell
cd python_backend
python main.py
```
서버가 `http://localhost:8000`에서 실행됩니다.

**터미널 2 - Node.js 서버:**
```powershell
cd node_backend
npm start
```
서버가 `http://localhost:3000`에서 실행됩니다.

**브라우저:**
`http://localhost:3000` 접속

### 방법 2: 스크립트 실행 (Linux/Mac)

```bash
chmod +x run.sh
./run.sh
```

## 테스트

### 1. API 헬스 체크

**FastAPI:**
```powershell
curl http://localhost:8000/health
```

**Node.js:**
```powershell
curl http://localhost:3000/health
```

### 2. 대시보드 기능 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 예측 폼에 값 입력 (예: feature1=1.5, feature2=2.3)
3. "예측" 버튼 클릭
4. 예측 결과가 표시되고 테이블에 추가되는지 확인
5. 차트가 업데이트되는지 확인

### 3. 데이터 확인

MariaDB에서 직접 확인:
```sql
USE test_db;
SELECT * FROM training_data ORDER BY id DESC LIMIT 10;
SELECT * FROM predictions ORDER BY id DESC LIMIT 10;
```

## 문제 해결

### 포트 충돌

다른 포트 사용:
- FastAPI: `python_backend/main.py`에서 포트 변경
- Node.js: `node_backend/.env`의 `PORT` 변경

### 데이터베이스 연결 오류

1. MariaDB 서버가 실행 중인지 확인
2. `.env` 파일의 DB 설정 확인
3. 방화벽 설정 확인
4. 사용자 권한 확인:
   ```sql
   GRANT ALL PRIVILEGES ON test_db.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 모듈을 찾을 수 없음

- Python: `pip install -r requirements.txt` 재실행
- Node.js: `npm install` 재실행

### CORS 오류

- FastAPI의 CORS 설정 확인 (`main.py`)
- Node.js의 CORS 설정 확인 (`src/index.js`)

## 다음 단계

1. **실제 모델 통합**: `python_backend/main.py`의 `api_predict` 함수에 실제 ML 모델 로드 및 예측 로직 추가
2. **인증 추가**: 필요시 JWT 기반 인증 시스템 추가
3. **로깅**: Winston (Node.js) 또는 Loguru (Python)으로 로깅 시스템 구축
4. **모니터링**: Prometheus/Grafana로 시스템 모니터링 설정
