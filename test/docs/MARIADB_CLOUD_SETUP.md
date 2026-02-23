# MariaDB Cloud (SkySQL) 스마트 팩토리 예지 보전 설정

## 1. 연결 정보 확인

SkySQL 콘솔에서 다음 정보를 확인하세요:

- **Host**: `serverless-europe-west9.sysp0000.db2.skysql.com` (예시, 실제 Host는 콘솔에서 확인)
- **Port**: 4078
- **User**: DBPGF30741618
- **Password**: 본인 비밀번호
- **SSL**: 필수 (클라우드 환경)

## 2. CA 인증서 다운로드

MariaDB SkySQL SSL 연결을 위해 CA 인증서가 필요합니다.

- [SkySQL SSL Connection Guide](https://support.mariadb.com/s/article/SkySQL-SSL-Connection-Guide)
- SkySQL 콘솔 → 해당 서비스 → **Connect** → **Download CA certificate** (.pem 파일)
- 다운로드한 파일 경로를 `.env`의 `DB_CA_PATH`에 입력

예:
```
DB_CA_PATH=C:/Users/Admin/Downloads/skysql_chain.pem
```

## 3. .env 설정

### Python (FastAPI)

```powershell
cd python_backend
copy .env.mariadb-cloud.example .env
# .env 편집: DB_PASSWORD, DB_CA_PATH, DB_NAME(필요시) 수정
```

### Node.js

```powershell
cd node_backend
copy .env.mariadb-cloud.example .env
# .env 편집: DB_PASSWORD, DB_CA_PATH, DB_NAME(필요시) 수정
```

## 4. 테이블 생성

SkySQL 웹 클라이언트 또는 mysql 클라이언트로:

```bash
mysql -h serverless-europe-west9.sysp0000.db2.skysql.com -P 4078 -u DBPGF30741618 -p --ssl-mode=REQUIRED --ssl-ca=경로/skysql_chain.pem default < docs/04_mariadb_cloud_schema.sql
```

또는 클라이언트에서 `docs/04_mariadb_cloud_schema.sql` 내용을 실행.

## 5. 더미 데이터 삽입

```powershell
python insert_telemetry_dummy.py
```

- `python_backend/.env` 또는 프로젝트 루트 `.env`의 DB 설정 사용
- 센서 5건, 텔레메트리 100건 삽입 (정상/이상 혼합)

## 6. 연결 확인

**Python:**
```powershell
cd python_backend
python check_db.py
```

**Node.js:**
```powershell
cd node_backend
node check_db.js
```

## 참고

- `DB_NAME`: SkySQL Serverless의 기본 DB는 `default` 또는 콘솔에 표시된 DB 이름
- Host가 Google 검색 URL로 보이면, 실제 Host는 SkySQL 콘솔에서 복사하세요
