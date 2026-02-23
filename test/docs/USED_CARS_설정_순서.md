# 중고차 DB 설정 — 차례대로 따라하기

`car_project` 데이터베이스에 **테이블(스키마)** 을 만들고 **샘플 500건**을 넣는 방법입니다.

---

## 준비

- **MariaDB**가 설치되어 있고, 서비스가 **실행 중**이어야 합니다.
- **car_project** 데이터베이스가 이미 있어야 합니다. 없다면:
  ```sql
  CREATE DATABASE car_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- **root 비밀번호**를 알고 있어야 합니다.

---

## 방법 A: 배치 파일로 한 번에 하기 (가장 간단)

### 1단계: 프로젝트 폴더로 이동

1. **Windows 키 + R** → `cmd` 입력 → Enter (명령 프롬프트 열기)
2. 아래 명령 입력 후 Enter:

   ```
   cd c:\Users\Admin\Desktop\test
   ```

### 2단계: 배치 파일 실행

3. 다음 명령 입력 후 Enter:

   ```
   setup_used_cars.bat
   ```

### 3단계: 비밀번호 입력 (3번)

4. **"Enter password:"** 가 나오면 **MariaDB root 비밀번호** 입력 후 Enter. (입력해도 화면에 안 보이는 것이 정상입니다.)
5. 같은 메시지가 **두 번 더** 나오면 같은 비밀번호를 각각 입력합니다.
6. 마지막에 **used_cars 500**, **monthly_market_prices 6000** 건수만 나오면 **완료**입니다.

여기서 끝내면 됩니다. 아래 "방법 B"는 직접 명령을 하나씩 치고 싶을 때 보세요.

---

## 방법 B: 명령을 하나씩 직접 입력하기

**명령 프롬프트(CMD)** 를 쓰는 것을 기준으로 합니다. (PowerShell이면 4단계만 아래 "PowerShell 사용 시" 참고.)

### 1단계: 명령 프롬프트 열고 프로젝트 폴더로 이동

1. **Windows 키 + R** → `cmd` 입력 → Enter
2. 아래를 **그대로** 입력 후 Enter:

   ```
   cd c:\Users\Admin\Desktop\test
   ```

3. 화면에 `c:\Users\Admin\Desktop\test>` 처럼 나오면 정상입니다.

---

### 2단계: 스키마 적용 (테이블 만들기)

4. 아래 명령을 **한 줄 그대로** 입력 후 Enter:

   ```
   mysql -u root -p car_project < docs\05_used_cars_schema.sql
   ```

5. **"Enter password:"** 가 나오면 **root 비밀번호** 입력 후 Enter.
6. 아무 메시지 없이 프롬프트(`c:\Users\Admin\Desktop\test>`)가 다시 나오면 **성공**입니다.  
   에러가 뜨면:
   - 비밀번호가 맞는지,
   - `car_project` DB가 있는지,
   - `docs\05_used_cars_schema.sql` 파일이 `c:\Users\Admin\Desktop\test\docs\` 안에 있는지 확인하세요.

---

### 3단계: 샘플 데이터 500건 넣기

7. 아래 명령을 **한 줄 그대로** 입력 후 Enter:

   ```
   mysql -u root -p car_project < docs\used_cars_sample.sql
   ```

8. 다시 **"Enter password:"** 에 **같은 root 비밀번호** 입력 후 Enter.
9. 에러 없이 프롬프트가 돌아오면 **성공**입니다.

---

### 4단계: 적용 결과 확인

10. 아래 명령을 **한 줄 그대로** 입력 후 Enter:

    ```
    mysql -u root -p car_project -e "SELECT 'used_cars' AS 테이블, COUNT(*) AS 건수 FROM used_cars UNION ALL SELECT 'monthly_market_prices', COUNT(*) FROM monthly_market_prices;"
    ```

11. **"Enter password:"** 에 비밀번호 입력 후 Enter.
12. 결과 예시:
    - **used_cars** → **500**
    - **monthly_market_prices** → **6000**  
    이렇게 나오면 **모두 정상**입니다.

---

### (선택) MariaDB 접속해서 직접 확인

13. MariaDB 클라이언트 접속:

    ```
    mysql -u root -p car_project
    ```

14. 비밀번호 입력 후, 프롬프트가 `MariaDB [car_project]>` 로 바뀝니다.
15. 예시 명령:

    ```sql
    SHOW TABLES;
    SELECT COUNT(*) FROM used_cars;
    SELECT * FROM used_cars LIMIT 3;
    exit
    ```

16. 끝나면 `exit` 입력 후 Enter로 빠져나옵니다.

---

## PowerShell 사용 시 (방법 B만)

**2단계·3단계**에서 `<` 리다이렉션이 PowerShell에서 문제될 수 있으면, **cmd로 한 번만 실행**하세요:

- 스키마:
  ```
  cmd /c "mysql -u root -p car_project < docs\05_used_cars_schema.sql"
  ```
- 샘플 데이터:
  ```
  cmd /c "mysql -u root -p car_project < docs\used_cars_sample.sql"
  ```

그다음 비밀번호 입력은 동일합니다. **4단계 확인**도 그대로 하면 됩니다.

---

## 자주 나오는 오류

| 메시지 | 확인할 것 |
|--------|------------|
| `'mysql'은(는) 인식되지 않습니다` | MariaDB 설치 경로(예: `C:\Program Files\MariaDB 12.1\bin`)를 **시스템 환경 변수 PATH**에 추가했는지 확인 |
| `Access denied for user 'root'` | root 비밀번호가 맞는지 확인 |
| `Unknown database 'car_project'` | `CREATE DATABASE car_project;` 로 DB 먼저 생성 |
| `Failed to open file` 또는 파일을 못 찾음 | 반드시 `cd c:\Users\Admin\Desktop\test` 로 **프로젝트 폴더**에서 명령 실행 |

---

## 요약 순서 (한 줄씩)

1. `cd c:\Users\Admin\Desktop\test`
2. `setup_used_cars.bat` (또는 아래 3·4를 수동 실행)
3. `mysql -u root -p car_project < docs\05_used_cars_schema.sql` → 비밀번호 입력
4. `mysql -u root -p car_project < docs\used_cars_sample.sql` → 비밀번호 입력
5. 4단계 확인 명령으로 500 / 6000 건수 확인

이 순서대로 하면 중고차 스키마와 샘플 500건 적용까지 모두 끝낼 수 있습니다.
