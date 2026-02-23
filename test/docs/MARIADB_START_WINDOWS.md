# Windows에서 MariaDB 켜기 / 끄기

MariaDB가 **Windows 서비스**로 설치되어 있을 때 실행·중지·재시작하는 방법입니다.

---

## 1. 서비스 이름 확인

설치 방식에 따라 서비스 이름이 다를 수 있습니다.

| 설치 방식 | 서비스 이름 예시 |
|-----------|------------------|
| MariaDB 공식 설치 | `MariaDB` |
| ZIP 수동 설치 | `MariaDB` 또는 `mariadb` |
| XAMPP 등 번들 | `MySQL` (XAMPP MariaDB) |

**PowerShell에서 확인:**

```powershell
Get-Service -Name *mariadb*,*mysql* -ErrorAction SilentlyContinue
```

`Name` 컬럼 값이 서비스 이름입니다.

---

## 2. MariaDB **시작** (켜기)

**방법 A: PowerShell (관리자 권한)**

```powershell
Start-Service -Name MariaDB
```

서비스 이름이 `MySQL`이면:

```powershell
Start-Service -Name MySQL
```

**방법 B: CMD (관리자 권한)**

```cmd
net start MariaDB
```

또는

```cmd
net start MySQL
```

**방법 C: 서비스 관리자 GUI**

1. `Win + R` → `services.msc` 입력 → Enter  
2. 목록에서 **MariaDB** 또는 **MySQL** 찾기  
3. 더블클릭 → **시작** 클릭  

---

## 3. MariaDB **중지** (끄기)

```powershell
Stop-Service -Name MariaDB
```

또는 CMD:

```cmd
net stop MariaDB
```

---

## 4. MariaDB **재시작**

중지 후 다시 시작:

```powershell
Stop-Service -Name MariaDB
Start-Service -Name MariaDB
```

또는 CMD:

```cmd
net stop MariaDB
net start MariaDB
```

---

## 5. 실행 여부 확인

**PowerShell:**

```powershell
Get-Service -Name MariaDB
```

`Status`가 **Running**이면 실행 중입니다.

**접속 테스트:**

```powershell
mysql -u root -p -e "SELECT 1"
```

비밀번호 입력 후 `1`이 나오면 정상 동작입니다.

---

## 6. "실행이 안 된다"할 때 체크할 것

- **서비스가 멈춤**  
  → 위 **2. 시작** 방법으로 `Start-Service` / `net start` 실행 (관리자 권한 필요).

- **연결 오류** (`Can't connect to MySQL server` 등)  
  - MariaDB는 켜져 있는데 연결이 안 될 수 있음.  
  - `python_backend/.env`, `node_backend/.env`의 `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` 확인.  
  - `DB_NAME`에 해당하는 DB가 실제로 존재하는지, `CREATE DATABASE` / `01_DB_SCHEMA.sql` 실행했는지 확인.

- **방화벽**  
  - localhost(127.0.0.1)만 쓸 때는 보통 문제 없음. 원격 접속 시 방화벽에서 3306 포트 허용 여부 확인.

---

## 7. 요약

| 하려는 것 | 명령 (서비스 이름이 `MariaDB`인 경우) |
|-----------|---------------------------------------|
| 켜기     | `Start-Service MariaDB` 또는 `net start MariaDB` |
| 끄기     | `Stop-Service MariaDB` 또는 `net stop MariaDB` |
| 재시작   | `Stop-Service MariaDB` 후 `Start-Service MariaDB` |

**관리자 권한**이 필요한 경우: PowerShell 또는 CMD를 **관리자로 실행**한 뒤 위 명령을 실행하세요.
