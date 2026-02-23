# Cursor로 이 프로젝트 시작하기 (어디서부터 할지)

Cursor 개발도구를 쓰면서 **파이썬 분석 모델 + 대시보드 백엔드** 작업을 할 때, "맨 처음 어디서부터 손대면 되는지"를 단계별로 적었습니다.

---

## 0. 전제: Cursor와 이 프로젝트

- **Cursor** = VS Code 기반 코드 에디터 + AI 도우미
- **이 프로젝트** = `test` 폴더 안에 DB 스키마, FastAPI(python_backend), Node.js(node_backend) 뼈대가 들어 있음
- 아래 순서는 **Cursor를 처음 켠 상태**에서, **이 폴더를 연 다음** 어디서부터 무엇을 할지 정한 것입니다.

---

## 1단계: Cursor에서 프로젝트 폴더 열기

**할 일:** "작업할 폴더"를 Cursor에 연다.

1. Cursor 실행
2. **File → Open Folder** (또는 `Ctrl+K Ctrl+O`)
3. `C:\Users\Admin\Desktop\test` 선택 후 **폴더 선택**
4. 왼쪽 **Explorer(탐색기)**에 `test` 아래 파일/폴더가 보이면 성공

**이때 확인할 것:**
- `python_backend`, `node_backend`, `docs` 폴더가 보여야 함
- `BACKEND_GUIDE.md`, `CURSOR_START_GUIDE.md` 같은 문서도 보임

---

## 2단계: "지금 뭘 할지" 문서부터 보기

**할 일:** Cursor 안에서 **무슨 순서로 작업할지** 정한 문서를 먼저 읽는다.

1. 왼쪽 Explorer에서 **`BACKEND_GUIDE.md`** 더블클릭해서 열기
2. **처음부터 끝까지** 한 번 훑어보기 (전체 구조, ①~⑥ 순서만 파악해도 됨)
3. **`CURSOR_START_GUIDE.md`** (이 파일)은 "Cursor에서 **어디서부터** 손대면 되는지"만 설명함

**정리:**
- **BACKEND_GUIDE.md** → "무엇을, 어떤 순서로 만드는지"
- **CURSOR_START_GUIDE.md** → "Cursor 화면에서 **어디를 클릭하고, 어떤 명령부터 실행할지**"

---

## 3단계: 터미널을 Cursor 안에서 열기

**할 일:** 명령어를 칠 **터미널**을 Cursor 안에서 연다.

1. 상단 메뉴 **Terminal → New Terminal** (또는 `` Ctrl+` ``)
2. 아래쪽에 터미널 패널이 열리고, 현재 경로가 `...\test` 인지 확인
3. 기본 셸이 PowerShell이면 그대로 사용 (Bash 쓰려면 Git Bash 등을 터미널 프로필로 선택)

**자주 쓰게 될 것:**
- Python / pip / Node / npm 명령은 **이 터미널**에서 실행
- 서버를 띄운 뒤에는 **또 다른 터미널**을 새로 열어서(터미널 우측 + 버튼) 두 번째 명령을 칠 수 있음

---

## 4단계: DB 설계부터 (Cursor에서는 “파일만 열어두기”)

**할 일:** MariaDB 테이블 설계를 **코드/문서**로 정리해 둔 파일을 Cursor에서 연다.

1. Explorer에서 **`docs`** 폴더 펼치기
2. **`01_DB_SCHEMA.sql`** 클릭해서 열기
3. 내용 보면서 "훈련 데이터·예측 결과를 이 테이블에 넣을 거다"라고만 이해
4. **실제 DB 작업**은 Cursor 밖에서:
   - MariaDB 클라이언트(HeidiSQL, DBeaver, mysql 클라이언트 등)로 DB 접속
   - `docs/01_DB_SCHEMA.sql` 내용 복사해서 실행하거나, 파일 경로로 실행  
     예: `mysql -u 사용자 -p DB이름 < docs/01_DB_SCHEMA.sql`

**Cursor에서의 시작점:**  
"DB 스키마는 `docs/01_DB_SCHEMA.sql` 이다"라고 알고, 이 파일을 **수정하고 싶을 때** Cursor에서 열어두고 편집하면 됨.  
테이블을 바꾸고 싶으면 이 파일을 고친 뒤, 다시 DB에서 실행하는 순서로 가면 됨.

---

## 5단계: FastAPI 백엔드부터 손대기 (추천 시작점)

**할 일:** Cursor에서 **FastAPI 쪽 폴더**를 작업 단위로 열고, "연결 정보 → DB 연결 → API" 순서로 파일을 연다.

### 5-1. 작업 폴더 정하기

1. Explorer에서 **`python_backend`** 폴더 펼치기
2. 이 폴더 안에서만 편집·실행할 거라고 생각하고 진행

### 5-2. 환경 변수 파일 만들기

1. **`python_backend/.env.example`** 클릭해서 열기
2. **같은 폴더에 `.env` 만들기:**
   - Explorer에서 `python_backend` 우클릭 → **New File**
   - 이름에 **`.env`** 입력
3. `.env.example` 내용을 **복사**해서 `.env`에 붙여넣기
4. `your_user`, `your_password`, `your_database` 등을 **본인 MariaDB 정보**로 수정
5. **`.env`는 git에 올리면 안 되므로** `.gitignore`에 `.env` 있는지 확인 (없으면 추가)

### 5-3. DB 연결·API 코드 보기

1. **`python_backend/db.py`** 더블클릭해서 열기  
   - "여기서 MariaDB 접속하고, 훈련/예측 조회·저장한다"는 걸 파악
2. **`python_backend/main.py`** 더블클릭해서 열기  
   - "여기서 FastAPI 라우트가 정해져 있고, `db.py`를 부른다"는 걸 파악

### 5-4. 패키지 설치 후 서버 실행 (Cursor 터미널에서)

1. 터미널에서 **작업 디렉터리를 `python_backend`로** 옮기기:
   ```powershell
   cd python_backend
   ```
2. 패키지 설치:
   ```powershell
   python -m pip install -r requirements.txt
   ```
3. 서버 실행:
   ```powershell
   python main.py
   ```
4. 브라우저에서 `http://localhost:8000/docs` 열어서 API가 보이는지 확인

**Cursor에서의 시작점 요약:**  
**`python_backend` 폴더를 연 다음 → `.env` 만들고 → `db.py` / `main.py`를 보면서 수정**하는 걸 "첫 작업"으로 두면 됩니다.

---

## 6단계: Node.js 백엔드 손대기 (FastAPI 다음으로)

**할 일:** 대시보드용 API를 만드는 **Node 쪽**을 Cursor에서 같은 방식으로 연다.

### 6-1. 작업 폴더 정하기

1. Explorer에서 **`node_backend`** 폴더 펼치기
2. **`node_backend`** 안에서만 편집·실행할 거라고 생각

### 6-2. 환경 변수 파일 만들기

1. **`node_backend/.env.example`** 열기
2. **`node_backend/.env`** 새 파일로 만들고, example 내용 복사
3. DB 접속 정보 넣고, **`PREDICTION_API_URL=http://localhost:8000`** 넣기 (FastAPI 주소)

### 6-3. 코드 보기

1. **`node_backend/src/db.js`**  
   - Node에서 MariaDB 연결, 훈련/예측 조회
2. **`node_backend/src/routes/dashboard.js`**  
   - 대시보드용 API + FastAPI `/api/predict` 호출
3. **`node_backend/src/index.js`**  
   - Express 앱, 포트 3000, 라우트 연결

### 6-4. 패키지 설치 후 서버 실행 (Cursor 터미널에서)

1. **FastAPI는 이미 켜 둔 상태**에서, **새 터미널** 열기 (Terminal → New Terminal 또는 + 버튼)
2. Node 쪽으로 이동 후 설치·실행:
   ```powershell
   cd node_backend
   npm install
   npm start
   ```
3. 브라우저에서 `http://localhost:3000/api/dashboard/summary` 호출해서 응답 오는지 확인

**Cursor에서의 시작점 요약:**  
**`node_backend` 폴더를 연 다음 → `.env` 만들고 → `src/db.js`, `src/routes/dashboard.js`를 보면서 수정**하는 걸 두 번째 작업으로 두면 됩니다.

---

## 7단계: Cursor에서 “어디서부터 시작할지” 한줄 요약

| 순서 | Cursor에서 할 일 | 비고 |
|------|------------------|------|
| 1 | **Open Folder**로 `test` 열기 | 맨 먼저 |
| 2 | **BACKEND_GUIDE.md** 읽어서 ①~⑥ 흐름 파악 | |
| 3 | **Terminal 열기** (`` Ctrl+` ``) | 아래 명령어용 |
| 4 | **docs/01_DB_SCHEMA.sql** 열어두고, DB는 외부 도구로 실행 | |
| 5 | **python_backend** 열고 → `.env` 만들고 → `db.py`, `main.py` 보면서 수정 | **실제 코딩 시작점** |
| 6 | 터미널에서 `cd python_backend` → `pip install -r requirements.txt` → `python main.py` | FastAPI 확인 |
| 7 | **node_backend** 열고 → `.env` 만들고 → `src/db.js`, `routes/dashboard.js` 보면서 수정 | 두 번째 작업 |
| 8 | 새 터미널에서 `cd node_backend` → `npm install` → `npm start` | Node + FastAPI 연동 확인 |

---

## 8단계: AI(Cursor Chat) 쓸 때 편한 질문 예시

Cursor 오른쪽 **Chat**에서 이렇게 물어보면, "어디서부터"가 더 분명해집니다.

- **"python_backend의 db.py에서 MariaDB 연결이 실패해. 어디를 수정해야 해?"**  
  → `db.py`와 `.env`를 같이 보여 주고 질문하면 됨  
- **"main.py에 우리가 쓸 예측 모델(.pkl) 불러와서 /api/predict에 붙이는 방법 알려줘"**  
  → `python_backend/main.py`를 연 채로, `api_predict` 부분을 지정해서 질문  
- **"node_backend에서 FastAPI 호출이 안 돼. PREDICTION_API_URL이랑 코드 확인해줘"**  
  → `node_backend/src/routes/dashboard.js`와 `.env`를 같이 보여 주고 질문  

**팁:** 수정하고 싶은 **파일을 먼저 열어 두고**, 그 파일 이름/함수 이름을 말하면서 질문하면, "어디서부터 고치면 되는지" 답이 훨씬 구체적으로 나옵니다.

---

## 9단계: 파일 기준 “시작 위치” 정리

**"Cursor 개발도구를 쓰면서, 코드는 어디서부터 손대면 되나?"**에 대한 답:

1. **문서:**  
   **`BACKEND_GUIDE.md`** → **`CURSOR_START_GUIDE.md`** 순서로 읽기
2. **DB:**  
   **`docs/01_DB_SCHEMA.sql`** 을 “스키마의 시작”으로 두고, Cursor에서는 이 파일만 열어두고 수정
3. **백엔드 코드의 시작:**  
   **`python_backend/`** 가 첫 작업 구역  
   - 그 안에서의 시작: **`.env` 만들기** → **`db.py`** 보기 → **`main.py`** 보기 → 터미널에서 `python main.py`
4. **그 다음:**  
   **`node_backend/`** 가 두 번째 작업 구역  
   - **`.env`** → **`src/db.js`** → **`src/routes/dashboard.js`** 순서로 보면서 수정

즉, **Cursor에서는 “폴더 연 다음 → 문서 읽기 → python_backend부터”**가 시작 위치이고, 그 다음이 **node_backend**입니다.
