# 프로젝트 환경 세팅 (초보자용)

FastAPI + MariaDB, Node.js 대시보드 구동에 필요한 **설치 명령어**와 **requirements.txt / package.json 정리 방법**을 적었습니다.

---

## 1. Python 쪽 (FastAPI + MariaDB)

### 1-1. 필요한 라이브러리 역할

| 패키지 | 역할 |
|--------|------|
| **fastapi** | 웹 API 서버 (라우트, 요청/응답) |
| **uvicorn** | FastAPI를 실행하는 ASGI 서버 |
| **sqlalchemy** | DB ORM·연결 풀 (테이블 ↔ Python 객체) |
| **pymysql** | MariaDB/MySQL 실제 접속 드라이버 |
| **cryptography** | SSL 등 암호화 연결 시 필요 (선택) |
| **python-dotenv** | `.env`에서 DB 비밀번호 등 읽기 |

### 1-2. 설치 명령어 (한 번에 전부 설치)

**방법 A: requirements.txt 로 한 번에 설치 (추천)**

```powershell
cd C:\Users\Admin\Desktop\test\python_backend
python -m pip install -r requirements.txt
```

**방법 B: 패키지 이름으로 직접 설치**

```powershell
python -m pip install fastapi uvicorn sqlalchemy pymysql python-dotenv cryptography
```

### 1-3. requirements.txt 에 어떻게 정리해 두면 좋은지

- **파일 위치:** `python_backend/requirements.txt`
- **역할:** “이 프로젝트 Python 쪽에 필요한 패키지 목록”을 한 파일에 모아두는 것.
- **형식 예시:**
  - 한 줄에 하나씩 패키지 이름
  - 버전을 고정하고 싶으면 `패키지명==1.2.3`
  - 최소 버전만 둘 때는 `패키지명>=1.2.0`
  - 주석은 `#` 로 시작

**지금 프로젝트용 예시 (이미 적용되어 있음):**

```
# 웹 API
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# DB (MariaDB)
sqlalchemy>=2.0.0
pymysql>=1.1.0
cryptography>=41.0.0

# 설정
python-dotenv>=1.0.0
```

**추가하고 싶을 때:**  
`requirements.txt` 맨 아래에 한 줄 추가한 뒤, 터미널에서 다시 `python -m pip install -r requirements.txt` 실행하면 됨.

---

## 2. Node.js 쪽 (대시보드 백엔드)

### 2-1. 필요한 패키지 역할

| 패키지 | 역할 |
|--------|------|
| **express** | 웹 API 서버 (라우트, 미들웨어) |
| **cors** | 다른 도메인/포트(프론트)에서 API 호출 허용 |
| **mysql2** | MariaDB/MySQL 접속 (Promise 지원) |
| **dotenv** | `.env`에서 DB 비밀번호 등 읽기 |
| **axios** | Node에서 FastAPI 등 다른 서버로 HTTP 요청 보낼 때 사용 |

### 2-2. 설치 명령어 (한 번에 전부 설치)

**방법 A: package.json 기준으로 설치 (추천)**

```powershell
cd C:\Users\Admin\Desktop\test\node_backend
npm install
```

`package.json`에 적혀 있는 `dependencies` 가 전부 설치됨.

**방법 B: 패키지 이름으로 직접 설치**

```powershell
cd C:\Users\Admin\Desktop\test\node_backend
npm install express cors mysql2 dotenv axios
```

### 2-3. package.json 에 어떻게 정리해 두면 좋은지

- **파일 위치:** `node_backend/package.json`
- **역할:** “이 프로젝트 Node 쪽 이름·버전·필요한 패키지·실행 스크립트”를 한 파일에 정리.
- **패키지 추가 시:**  
  터미널에서 `npm install 패키지명` 하면 `package.json`의 `dependencies`에 자동으로 들어감.  
  또는 직접 `package.json`을 열어서 `dependencies` 안에 `"패키지명": "^버전"` 을 추가한 뒤 `npm install` 해도 됨.

**지금 프로젝트용 예시 (이미 적용되어 있음):**

```json
{
  "name": "node-dashboard-backend",
  "version": "1.0.0",
  "description": "대시보드 API (MariaDB + FastAPI 연동)",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node src/index.js"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "mysql2": "^3.6.5"
  }
}
```

**추가하고 싶을 때:**  
예: `nodemon` 개발용으로 넣기 →  
`npm install nodemon`  
하고, `scripts`에 `"dev": "nodemon src/index.js"` 같이 넣어두면 됨.

---

## 3. 한 번에 복사해서 쓸 수 있는 명령어 모음

### Python (FastAPI + MariaDB)

```powershell
cd C:\Users\Admin\Desktop\test\python_backend
python -m pip install -r requirements.txt
```

### Node.js (대시보드)

```powershell
cd C:\Users\Admin\Desktop\test\node_backend
npm install
```

### 두 개 다 세팅할 때 (순서대로)

```powershell
cd C:\Users\Admin\Desktop\test\python_backend
python -m pip install -r requirements.txt

cd C:\Users\Admin\Desktop\test\node_backend
npm install
```

---

## 4. requirements.txt / package.json 정리 요약

| 항목 | Python | Node.js |
|------|--------|---------|
| 목록 파일 | `python_backend/requirements.txt` | `node_backend/package.json` |
| 한 번에 설치 | `python -m pip install -r requirements.txt` | `npm install` |
| 패키지 추가 | 1) `requirements.txt`에 한 줄 추가<br>2) `pip install -r requirements.txt` | 1) `npm install 패키지명`<br>또는 `package.json` 수정 후 `npm install` |
| 버전 표기 | `패키지명>=1.0.0` 또는 `==1.0.0` | `"패키지명": "^1.0.0"` (package.json 안) |

이렇게 해 두면 “어떤 라이브러리를 썼는지”, “다른 PC에서도 같은 버전으로 맞추기”가 쉬워집니다.
