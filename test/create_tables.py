#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MariaDB 테이블 생성 스크립트
docs/01_DB_SCHEMA.sql에 정의된 세 테이블을 생성합니다:
  - training_data  (훈련 데이터)
  - predictions    (예측 결과)
  - alert_events  (위험/이상 징후 알림 로그)

사용법: 이 파일 상단의 DB_CONFIG를 수정한 뒤 실행.
비밀번호가 없으면 password를 "" 또는 None으로 두세요.
"""""

import sys
from pathlib import Path

# =============================================================================
# ★ MariaDB Cloud (SkySQL) 접속 정보 (비밀번호는 SkySQL 콘솔에서 확인 후 입력)
# =============================================================================
DB_CONFIG = {
    "host": "serverless-europe-west9.sysp0000.db2.skysql.com",
    "port": 4078,
    "user": "dbpgf30741618",
    "password": "YOUR_ACTUAL_PASSWORD",   # SkySQL 콘솔 눈 아이콘 클릭 후 표시되는 비밀번호로 교체
    "database": "test_db",
    "charset": "utf8mb4",
    "ssl": True,   # 클라우드 DB이므로 SSL 사용
}

# =============================================================================

try:
    import pymysql
    from pymysql.cursors import DictCursor
except ImportError:
    print("[오류] pymysql이 설치되어 있지 않습니다.")
    print("설치: pip install pymysql")
    sys.exit(1)


def get_connection(use_database=True):
    """DB_CONFIG로 연결. password가 None이면 빈 문자열. use_database=False면 DB 없이 연결(DB 생성용)."""
    kwargs = dict(DB_CONFIG)
    if kwargs.get("password") is None:
        kwargs["password"] = ""
    if not use_database:
        kwargs = {k: v for k, v in kwargs.items() if k != "database"}
    kwargs["cursorclass"] = DictCursor
    return pymysql.connect(**kwargs)


def main():
    base_dir = Path(__file__).resolve().parent
    sql_file = base_dir / "docs" / "01_DB_SCHEMA.sql"

    if not sql_file.exists():
        print(f"[오류] SQL 파일을 찾을 수 없습니다: {sql_file}")
        sys.exit(1)

    print("=" * 50)
    print("MariaDB 테이블 생성")
    print("=" * 50)
    print(f"호스트: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"사용자: {DB_CONFIG['user']}")
    print(f"데이터베이스: {DB_CONFIG['database']}")
    print()

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # 주석 및 빈 줄 제거 후 실행 가능한 문장만 추출
    lines = []
    for line in sql_content.split("\n"):
        line = line.strip()
        if line.startswith("--") or not line:
            continue
        lines.append(line)
    full_sql = "\n".join(lines)

    # 세미콜론으로 문장 분리 (CREATE TABLE 단위)
    statements = [s.strip() for s in full_sql.split(";") if s.strip()]

    # 데이터베이스가 없을 수 있으므로 먼저 DB 없이 연결 후 생성
    conn = get_connection(use_database=False)
    try:
        with conn.cursor() as cur:
            db_name = DB_CONFIG["database"].replace("`", "``")
            cur.execute(
                "CREATE DATABASE IF NOT EXISTS `{}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci".format(db_name)
            )
        conn.close()
    except Exception:
        conn.close()
        raise

    conn = get_connection(use_database=True)
    try:
        with conn.cursor() as cur:
            for i, statement in enumerate(statements, 1):
                if not statement.upper().strip().startswith("CREATE TABLE"):
                    continue
                try:
                    cur.execute(statement)
                    # 테이블 이름 추출 (CREATE TABLE [IF NOT EXISTS] name ...)
                    parts = statement.split("(")[0].split()
                    table_name = parts[-1] if parts else f"statement_{i}"
                    print(f"[{i}] [OK] {table_name} 테이블 생성 완료")
                except pymysql.Error as e:
                    if "already exists" in str(e).lower():
                        print(f"[{i}] [SKIP] 테이블이 이미 존재합니다.")
                    else:
                        print(f"[{i}] [ERROR] {e}")
                        raise

        print()
        print("=" * 50)
        print("생성된 테이블 확인")
        print("=" * 50)

        with conn.cursor() as cur:
            cur.execute("SHOW TABLES")
            rows = cur.fetchall()
            key = "Tables_in_" + DB_CONFIG["database"]
            for row in rows:
                table_name = row.get(key, list(row.values())[0])
                print(f"  - {table_name}")
                cur.execute(f"DESCRIBE `{table_name}`")
                cols = cur.fetchall()
                for col in cols:
                    field = col.get("Field", col.get("field", ""))
                    typ = col.get("Type", col.get("type", ""))
                    print(f"      {field}: {typ}")
                print()

        print("[성공] 테이블 생성이 완료되었습니다.")
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except pymysql.Error as e:
        print(f"[오류] DB 연결/실행 실패: {e}")
        print()
        print("확인 사항:")
        print("1. MariaDB 서버가 실행 중인지")
        print("2. create_tables.py 상단 DB_CONFIG (host, user, password, database)")
        print("3. 비밀번호 없이 접속한다면 password=\"\" 로 두기")
        sys.exit(1)
    except Exception as e:
        print(f"[오류] {e}")
        sys.exit(1)
