# 데이터베이스 연결 설정 가이드

MariaDB에 연결할 수 있도록 **Python(FastAPI)** 과 **Node.js** 양쪽에서 설정하는 방법입니다.

---

## 순서 요약

1. **MariaDB에서 DB·사용자 준비**
2. **테이블 생성** (`docs/01_DB_SCHEMA.sql` 실행)
3. **Python 백엔드** → `.env` 만들고 연결 확인
4. **Node.js 백엔드** → `.env` 만들고 연결 확인

---

## 1단계: MariaDB에서 DB·사용자 준비

MariaDB가 이미 설치·실행 중이어야 합니다.

**Windows에서 MariaDB 켜기:** 서비스가 꺼져 있으면 PowerShell(관리자)에서  
`Start-Service -Name MariaDB` 또는 `net start MariaDB` 로 시작할 수 있습니다.  
자세한 절차는 **[docs/MARIADB_START_WINDOWS.md](MARIADB_START_WINDOWS.md)**를 참고하세요.

### 1-1. MariaDB 접속

**명령 줄에서:**

```bash
mysql -u root -p
```

(비밀번호 입력 후 접속)

**HeidiSQL, DBeaver 등 GUI 도구**를 쓰면 그곳에서 아래 SQL을 실행해도 됩니다.

### 1-2. DB·사용자 만들기

접속한 뒤 아래 SQL을 **그대로 또는 값만 바꿔서** 실행하세요.

```sql
-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS dashboard_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 전용 사용자 생성 (비밀번호는 반드시 다른 걸로 바꾸세요)
CREATE USER IF NOT EXISTS 'dashboard_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 이 DB에 대한 권한 부여
GRANT ALL PRIVILEGES ON dashboard_db.* TO 'dashboard_user'@'localhost';
FLUSH PRIVILEGES;

-- 사용할 DB 선택
USE dashboard_db;
```

**직접 바꿀 부분:**

- `dashboard_db` → 쓰고 싶은 **DB 이름**
- `dashboard_user` → 쓰고 싶은 **사용자 이름**
- `your_secure_password` → **사용자 비밀번호**

이 값들을 **메모해 두었다가** 다음 단계의 `.env`에 그대로 넣습니다.

---

## 2단계: 테이블 생성

방금 만든 DB에 **훈련 데이터·예측 결과**용 테이블을 만듭니다.

### 방법 A: 명령 줄에서 파일로 실행

```bash
mysql -u dashboard_user -p dashboard_db < "C:\Users\Admin\Desktop\test\docs\01_DB_SCHEMA.sql"
```

(비밀번호 입력 후 실행)

### 방법 B: 클라이언트에서 SQL 복사해 실행

1. `docs/01_DB_SCHEMA.sql` 파일을 Cursor에서 연다.
2. 내용 전체 복사한다.
3. HeidiSQL/DBeaver 등에서 `dashboard_db`(또는 사용 중인 DB)에 붙여넣고 실행한다.

### 확인

```sql
USE dashboard_db;   -- 또는 사용 중인 DB 이름
SHOW TABLES;
```

`training_data`, `predictions` 두 개가 보이면 성공입니다.

---

## 3단계: Python 백엔드(FastAPI) 연결 설정

### 3-1. `.env` 파일 만들기

1. Cursor에서 **`python_backend`** 폴더를 연다.
2. **`python_backend/.env.example`** 내용을 복사한다.
3. **`python_backend`** 에 **`.env`** 파일을 새로 만든다.
   - Explorer에서 `python_backend` 우클릭 → **New File** → 이름에 `.env` 입력
4. 아래 형식으로 **본인 DB 정보**를 채운다.

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=dashboard_user
DB_PASSWORD=your_secure_password
DB_NAME=dashboard_db
```

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`은 1단계에서 정한 값과 **완전히 같게** 쓴다.
- 비밀번호에 `#`, `=`, 공백이 있으면 따옴표로 감싼다.  
  예: `DB_PASSWORD="my pass#123"`

### 3-2. 연결 확인 (Python)

**방법 A: 연결 전용 스크립트 실행**

```powershell
cd C:\Users\Admin\Desktop\test\python_backend
python check_db.py
```

- `연결 성공` 이 나오면 설정이 맞는 것입니다.
- 에러가 나오면 메시지에 따라 `.env` 값, MariaDB 실행 여부, 사용자 권한을 다시 확인하세요.

**방법 B: FastAPI 서버로 확인**

```powershell
cd C:\Users\Admin\Desktop\test\python_backend
python main.py
```

브라우저에서 **http://localhost:8000/api/training-data** 를 연다.

- `[]` (빈 배열) → DB 연결 성공, 아직 데이터 없음.
- 500 에러 또는 DB 관련 에러 → `.env` 또는 MariaDB 설정을 다시 점검하세요.

---

## 4단계: Node.js 백엔드 연결 설정

### 4-1. `.env` 파일 만들기

1. Cursor에서 **`node_backend`** 폴더를 연다.
2. **`node_backend/.env.example`** 내용을 복사한다.
3. **`node_backend`** 에 **`.env`** 파일을 새로 만든다.
4. 아래처럼 **Python과 같은 DB 정보**를 넣는다.

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=dashboard_user
DB_PASSWORD=your_secure_password
DB_NAME=dashboard_db

PREDICTION_API_URL=http://localhost:8000
```

- `DB_*` 는 **python_backend/.env 와 동일한 값**으로 두는 것이 좋습니다.
- `PREDICTION_API_URL` 은 나중에 FastAPI 서버 주소를 바꿀 때만 수정하면 됩니다.

### 4-2. 연결 확인 (Node.js)

**방법 A: 연결 전용 스크립트 실행**

```powershell
cd C:\Users\Admin\Desktop\test\node_backend
node check_db.js
```

- `연결 성공` 이 나오면 설정이 맞습니다.

**방법 B: 서버로 확인**

```powershell
cd C:\Users\Admin\Desktop\test\node_backend
npm start
```

브라우저에서 **http://localhost:3000/api/dashboard/summary** 를 연다.

- `{"training":[],"predictions":[]}` 비슷한 JSON → DB 연결 성공.
- 500 또는 DB 관련 에러 → `.env` 와 MariaDB 설정을 다시 확인하세요.

---

## 5단계: 한 번에 볼 수 있는 체크리스트

| 단계 | 할 일 | 확인 방법 |
|------|--------|-----------|
| 1 | MariaDB에 DB·사용자 생성 | `mysql -u dashboard_user -p dashboard_db -e "SELECT 1"` 가 에러 없이 실행 |
| 2 | `01_DB_SCHEMA.sql` 실행 | `SHOW TABLES;` 에 `training_data`, `predictions` 표시 |
| 3 | python_backend `.env` 작성 | `python check_db.py` → `연결 성공` |
| 4 | node_backend `.env` 작성 | `node check_db.js` → `연결 성공` |

---

## 자주 나오는 오류와 대처

| 증상 | 점검할 것 |
|------|------------|
| `Access denied for user` | `.env` 의 `DB_USER`, `DB_PASSWORD` 가 MariaDB 사용자/비밀번호와 일치하는지, `CREATE USER`·`GRANT` 를 실행했는지 |
| `Unknown database` | `DB_NAME` 이 실제 만든 DB 이름과 똑같은지, `CREATE DATABASE` 를 실행했는지 |
| `connect ECONNREFUSED` / 연결 거부 | MariaDB 서비스가 실행 중인지([MARIADB_START_WINDOWS.md](MARIADB_START_WINDOWS.md)), `DB_HOST`, `DB_PORT` 가 맞는지 |
| `Can't connect to MySQL server` | 방화벽, MariaDB가 다른 호스트/포트에서만 받도록 설정돼 있는지 |

---

## 정리

1. **MariaDB** → DB·사용자 생성 후 `docs/01_DB_SCHEMA.sql` 로 테이블 생성  
2. **python_backend** → `.env` 에 `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` 넣고 `python check_db.py` 로 확인  
3. **node_backend** → 같은 값으로 `.env` 만들고 `node check_db.js` 로 확인  

두 백엔드 모두 같은 DB를 쓰도록 **DB 이름·사용자·비밀번호를 동일하게** 두면 됩니다.
