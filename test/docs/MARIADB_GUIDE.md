# MariaDB 테이블 생성 및 데이터 삽입 가이드

이 가이드는 MariaDB에서 테이블을 생성하고 데이터를 삽입하는 다양한 방법을 설명합니다.

## 목차
1. [기본 개념](#기본-개념)
2. [방법 1: SQL 파일로 테이블 생성](#방법-1-sql-파일로-테이블-생성)
3. [방법 2: Python으로 테이블 생성](#방법-2-python으로-테이블-생성)
4. [방법 3: 직접 SQL 명령어 사용](#방법-3-직접-sql-명령어-사용)
5. [데이터 삽입 방법](#데이터-삽입-방법)
6. [실전 예제](#실전-예제)

---

## 기본 개념

### MariaDB란?
- MySQL과 호환되는 오픈소스 관계형 데이터베이스
- Python, Node.js 등 다양한 언어에서 사용 가능

### 주요 SQL 명령어
- `CREATE TABLE`: 테이블 생성
- `INSERT INTO`: 데이터 삽입
- `SELECT`: 데이터 조회
- `UPDATE`: 데이터 수정
- `DELETE`: 데이터 삭제

---

## 방법 1: SQL 파일로 테이블 생성

### 1-1. SQL 파일 작성

`docs/01_DB_SCHEMA.sql` 파일을 열어보면:

```sql
-- 훈련/원본 데이터 테이블
CREATE TABLE IF NOT EXISTS training_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  feature1 FLOAT COMMENT '입력 특징 1',
  feature2 FLOAT COMMENT '입력 특징 2',
  target FLOAT COMMENT '정답(레이블)'
);

-- 예측 결과 테이블
CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_name VARCHAR(50) COMMENT '사용한 모델 이름',
  input_summary JSON COMMENT '예측에 쓴 입력 요약',
  prediction_value FLOAT COMMENT '예측값',
  meta JSON COMMENT '기타 메타정보'
);
```

### 1-2. SQL 파일 실행 방법

#### 방법 A: 명령줄에서 실행
```bash
mysql -u root -p1234 test_db < docs/01_DB_SCHEMA.sql
```

#### 방법 B: MariaDB 클라이언트에서 실행
```bash
# MariaDB 접속
mysql -u root -p1234 test_db

# SQL 파일 실행
source docs/01_DB_SCHEMA.sql;
```

#### 방법 C: Python 스크립트로 실행
```bash
python create_tables.py
```

---

## 방법 2: Python으로 테이블 생성

### 2-1. 필요한 패키지 설치

```bash
pip install pymysql python-dotenv
```

### 2-2. 데이터베이스 연결 설정

`python_backend/db.py` 파일 참고:

```python
import os
import pymysql
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()

def _conn():
    """MariaDB 접속 설정"""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )

@contextmanager
def get_db():
    """데이터베이스 연결 컨텍스트 매니저"""
    conn = _conn()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    finally:
        conn.close()
```

### 2-3. 테이블 생성 예제

```python
from db import get_db

# 테이블 생성
with get_db() as cur:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS training_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            feature1 FLOAT COMMENT '입력 특징 1',
            feature2 FLOAT COMMENT '입력 특징 2',
            target FLOAT COMMENT '정답(레이블)'
        )
    """)
    print("테이블 생성 완료!")
```

---

## 방법 3: 직접 SQL 명령어 사용

### 3-1. MariaDB 접속

```bash
mysql -u root -p1234 test_db
```

### 3-2. 테이블 생성

```sql
-- 데이터베이스 선택
USE test_db;

-- 테이블 생성
CREATE TABLE IF NOT EXISTS training_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    feature1 FLOAT COMMENT '입력 특징 1',
    feature2 FLOAT COMMENT '입력 특징 2',
    target FLOAT COMMENT '정답(레이블)'
);

-- 테이블 확인
SHOW TABLES;
DESCRIBE training_data;
```

---

## 데이터 삽입 방법

### 방법 1: Python 함수 사용 (권장)

`python_backend/db.py`의 `insert_training_data` 함수 사용:

```python
from db import insert_training_data

# 단일 데이터 삽입
new_id = insert_training_data(
    feature1=909.9,
    feature2=8.4,
    target=205.87
)
print(f"삽입된 ID: {new_id}")
```

### 방법 2: 직접 SQL 실행

```python
from db import get_db

with get_db() as cur:
    cur.execute(
        "INSERT INTO training_data (feature1, feature2, target) VALUES (%s, %s, %s)",
        (909.9, 8.4, 205.87)
    )
    print(f"삽입된 ID: {cur.lastrowid}")
```

### 방법 3: 여러 데이터 일괄 삽입

```python
from db import get_db

data_list = [
    (909.9, 8.4, 205.87),
    (973.0, 9.4, 189.45),
    (804.7, 16.1, 186.51),
]

with get_db() as cur:
    cur.executemany(
        "INSERT INTO training_data (feature1, feature2, target) VALUES (%s, %s, %s)",
        data_list
    )
    print(f"{len(data_list)}건 삽입 완료!")
```

### 방법 4: CSV 파일에서 일괄 삽입

```python
import csv
from db import insert_training_data

with open('cathode_calcination_data.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        insert_training_data(
            feature1=float(row['소성온도']),
            feature2=float(row['소성시간']),
            target=float(row['방전용량'])
        )
```

또는 스크립트 실행:
```bash
python upload_csv_to_db.py
```

---

## 실전 예제

### 예제 1: 완전한 테이블 생성 및 데이터 삽입 스크립트

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
완전한 예제: 테이블 생성 + 데이터 삽입
"""

import sys
from pathlib import Path

# 프로젝트 경로 추가
sys.path.insert(0, str(Path(__file__).parent / "python_backend"))

from db import get_db, insert_training_data
from dotenv import load_dotenv

load_dotenv()

def create_table():
    """테이블 생성"""
    with get_db() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS training_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                feature1 FLOAT COMMENT '입력 특징 1',
                feature2 FLOAT COMMENT '입력 특징 2',
                target FLOAT COMMENT '정답(레이블)'
            )
        """)
        print("✓ 테이블 생성 완료")

def insert_sample_data():
    """샘플 데이터 삽입"""
    sample_data = [
        (909.9, 8.4, 205.87),
        (973.0, 9.4, 189.45),
        (804.7, 16.1, 186.51),
    ]
    
    for feature1, feature2, target in sample_data:
        new_id = insert_training_data(feature1, feature2, target)
        print(f"✓ 데이터 삽입 완료 (ID: {new_id})")

def check_data():
    """데이터 확인"""
    with get_db() as cur:
        cur.execute("SELECT COUNT(*) as total FROM training_data")
        total = cur.fetchone()
        print(f"\n총 데이터 수: {total['total']}건")
        
        cur.execute("SELECT * FROM training_data ORDER BY id DESC LIMIT 5")
        rows = cur.fetchall()
        print("\n최근 5건:")
        for row in rows:
            print(f"  ID: {row['id']}, Feature1: {row['feature1']}, "
                  f"Feature2: {row['feature2']}, Target: {row['target']}")

if __name__ == "__main__":
    print("=" * 50)
    print("테이블 생성 및 데이터 삽입 예제")
    print("=" * 50)
    
    # 1. 테이블 생성
    create_table()
    
    # 2. 데이터 삽입
    print("\n샘플 데이터 삽입 중...")
    insert_sample_data()
    
    # 3. 데이터 확인
    print("\n데이터 확인:")
    check_data()
    
    print("\n완료!")
```

### 예제 2: CSV 파일 업로드 스크립트

```python
import csv
from db import insert_training_data

def upload_csv(csv_file):
    """CSV 파일을 읽어서 DB에 업로드"""
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        count = 0
        
        for row in reader:
            try:
                insert_training_data(
                    feature1=float(row['소성온도']),
                    feature2=float(row['소성시간']),
                    target=float(row['방전용량'])
                )
                count += 1
                if count % 100 == 0:
                    print(f"진행 중... {count}건")
            except Exception as e:
                print(f"오류: {e}")
                continue
        
        print(f"완료! 총 {count}건 업로드")

# 사용
upload_csv('cathode_calcination_data.csv')
```

---

## 주요 SQL 문법 설명

### CREATE TABLE 문법

```sql
CREATE TABLE [IF NOT EXISTS] 테이블명 (
    컬럼명1 데이터타입 [제약조건],
    컬럼명2 데이터타입 [제약조건],
    ...
    PRIMARY KEY (컬럼명)
);
```

**주요 데이터 타입:**
- `INT`: 정수
- `FLOAT`: 실수
- `VARCHAR(n)`: 가변 길이 문자열 (최대 n자)
- `DATETIME`: 날짜/시간
- `JSON`: JSON 데이터

**주요 제약조건:**
- `PRIMARY KEY`: 기본키 (고유 식별자)
- `AUTO_INCREMENT`: 자동 증가
- `DEFAULT 값`: 기본값 설정
- `NOT NULL`: NULL 값 불가
- `COMMENT '설명'`: 컬럼 설명

### INSERT 문법

```sql
-- 단일 행 삽입
INSERT INTO 테이블명 (컬럼1, 컬럼2, 컬럼3) 
VALUES (값1, 값2, 값3);

-- 여러 행 일괄 삽입
INSERT INTO 테이블명 (컬럼1, 컬럼2, 컬럼3) 
VALUES 
    (값1, 값2, 값3),
    (값4, 값5, 값6),
    (값7, 값8, 값9);
```

---

## 문제 해결

### 1. 연결 오류
```
Error: Can't connect to MySQL server
```
**해결:**
- MariaDB 서버가 실행 중인지 확인
- `.env` 파일의 DB 설정 확인
- 방화벽 설정 확인

### 2. 테이블이 이미 존재함
```
Error: Table 'training_data' already exists
```
**해결:**
- `CREATE TABLE IF NOT EXISTS` 사용
- 또는 기존 테이블 삭제: `DROP TABLE training_data;`

### 3. 인코딩 오류
```
UnicodeEncodeError: 'cp949' codec can't encode
```
**해결:**
- 파일 읽기 시 `encoding='utf-8-sig'` 사용
- MariaDB 연결 시 `charset='utf8mb4'` 설정

---

## 체크리스트

테이블 생성 및 데이터 삽입 전 확인사항:

- [ ] MariaDB 서버 실행 중
- [ ] 데이터베이스 생성됨 (`CREATE DATABASE test_db;`)
- [ ] `.env` 파일 설정 완료
- [ ] 필요한 Python 패키지 설치됨
- [ ] SQL 문법 확인 완료

---

## 추가 학습 자료

- [MariaDB 공식 문서](https://mariadb.com/kb/en/)
- [PyMySQL 문서](https://pymysql.readthedocs.io/)
- [SQL 튜토리얼](https://www.w3schools.com/sql/)

---

## 요약

1. **테이블 생성**: SQL 파일 또는 Python 스크립트 사용
2. **데이터 삽입**: `insert_training_data()` 함수 또는 직접 SQL 실행
3. **일괄 업로드**: CSV 파일 읽어서 반복 삽입
4. **확인**: `SELECT` 문으로 데이터 조회

**가장 간단한 방법:**
```bash
# 테이블 생성
python create_tables.py

# CSV 데이터 업로드
python upload_csv_to_db.py
```
