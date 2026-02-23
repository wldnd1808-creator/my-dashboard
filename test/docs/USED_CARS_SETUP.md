# 중고차 DB 설정 가이드 (Windows)

## 터미널에서 나온 오류 정리

| 오류 | 원인 | 해결 |
|------|------|------|
| `Failed to open file 'docs\used_cars_sample.sql'` | MariaDB 클라이언트는 **실행한 위치**(예: `C:\Program Files\MariaDB 12.1\bin`)를 기준으로 경로를 찾습니다. 프로젝트 폴더가 아니라서 파일을 못 찾음. | **방법 1:** 명령 프롬프트에서 프로젝트 폴더로 이동한 뒤 `mysql ... < docs\used_cars_sample.sql` 로 실행. **방법 2:** MariaDB 안에서 쓸 때는 **절대 경로** 사용: `source c:/Users/Admin/Desktop/test/docs/used_cars_sample.sql;` |
| `Table 'car_project.used_cars' doesn't exist` | 테이블을 만드는 **스키마**를 먼저 적용하지 않음. | 반드시 **먼저** `05_used_cars_schema.sql` 로 테이블을 만든 다음, 그 다음에 `used_cars_sample.sql` 로 데이터 삽입. |
| `'docs'은(는) 내부 또는 외부 명령이 아닙니다` | SQL 파일은 **실행 파일이 아니라** mysql/mariadb **클라이언트에 넘겨서** 실행해야 함. | `docs\05_used_cars_schema.sql` 이렇게만 치지 말고, `mysql -u root -p car_project < docs\05_used_cars_schema.sql` 처럼 실행. |
| `'generate_used_cars_sample.py'은(는) 내부 또는 외부 명령이 아닙니다` | Python 스크립트는 **python**으로 실행해야 함. | `python generate_used_cars_sample.py` (그리고 **프로젝트 폴더**에서 실행: `cd c:\Users\Admin\Desktop\test`) |

---

## 한 번에 하기 (권장)

**프로젝트 폴더** `c:\Users\Admin\Desktop\test` 에서:

```
setup_used_cars.bat
```

더블클릭하거나, 명령 프롬프트에서:

```
cd c:\Users\Admin\Desktop\test
setup_used_cars.bat
```

비밀번호를 두 번 묻습니다(스키마 적용 시, 샘플 데이터 적용 시).  
비밀번호를 매번 입력하기 싫다면 `setup_used_cars.bat` 안의 `-p` 를 `-p본인비밀번호` 로 바꿀 수 있습니다(보안 주의).

---

## 수동으로 하기

1. **명령 프롬프트를 연 다음, 반드시 프로젝트 폴더로 이동:**

   ```
   cd c:\Users\Admin\Desktop\test
   ```

2. **스키마 적용 (테이블 생성):**

   ```
   mysql -u root -p car_project < docs\05_used_cars_schema.sql
   ```

3. **샘플 데이터 적용:**

   ```
   mysql -u root -p car_project < docs\used_cars_sample.sql
   ```

4. **Python으로 샘플만 다시 넣고 싶을 때** (테이블은 이미 있는 경우):

   ```
   cd c:\Users\Admin\Desktop\test
   python generate_used_cars_sample.py
   ```
   (DB 접속 정보는 `python_backend\.env` 또는 `.env` 에 필요)

---

## MariaDB 클라이언트 안에서 `source` 쓸 때

이미 `mysql -u root -p car_project` 로 접속한 상태라면:

- 상대 경로 `source docs/used_cars_sample.sql` 은 **현재 작업 디렉터리가 MariaDB bin 폴더**라서 실패할 수 있음.
- **절대 경로**로 실행:

  ```sql
  source c:/Users/Admin/Desktop/test/docs/05_used_cars_schema.sql;
  source c:/Users/Admin/Desktop/test/docs/used_cars_sample.sql;
  ```

  (Windows라도 경로는 슬래시 `/` 로 적어도 됩니다.)
