# 데이터베이스 연결 확인용 스크립트
# 실행: python check_db.py (python_backend 폴더에서)

import os
import sys

# 프로젝트 루트가 path에 있도록
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# .env 파일 직접 읽기 (dotenv가 작동하지 않을 때 대안)
env_path = os.path.join(script_dir, ".env")
if os.path.exists(env_path):
    print(f"DEBUG: .env 파일 읽기 시작: {env_path}")
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                os.environ[key] = value
                print(f"DEBUG: 설정됨 {key}={value}")
else:
    print(f"DEBUG: .env 파일 없음: {env_path}")
    # dotenv도 시도
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path, override=True)
    except ImportError:
        pass

def check():
    db_user = os.getenv("DB_USER")
    db_name = os.getenv("DB_NAME")
    
    # 디버깅: 읽힌 값 확인
    print(f"DEBUG: DB_USER={db_user}, DB_NAME={db_name}")
    
    if not db_user or db_user == "your_user":
        print("[X] .env 파일에 DB_USER를 넣어주세요. (.env.example 을 복사해 .env 를 만든 뒤 값 채우기)")
        return False
    if not db_name or db_name == "your_database":
        print("[X] .env 파일에 DB_NAME을 넣어주세요.")
        return False

    try:
        import pymysql
        # 인증 플러그인 문제 해결: init_command로 인증 방식 명시
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            charset="utf8mb4",
            init_command="SET sql_mode='STRICT_TRANS_TABLES'",
            auth_plugin_map={},
        )
        conn.close()
        print("[OK] 연결 성공")
        print(f"   DB: {os.getenv('DB_NAME')} @ {os.getenv('DB_HOST', 'localhost')}")
        return True
    except Exception as e:
        error_msg = str(e)
        print(f"[X] 연결 실패: {error_msg}")
        if "auth_gssapi_client" in error_msg or "Authentication plugin" in error_msg:
            print("\n[해결 방법]")
            print("MariaDB에서 사용자 인증 방식을 변경하세요:")
            print(f"  ALTER USER '{os.getenv('DB_USER')}'@'localhost' IDENTIFIED WITH mysql_native_password BY '비밀번호';")
            print("  FLUSH PRIVILEGES;")
        return False

if __name__ == "__main__":
    ok = check()
    sys.exit(0 if ok else 1)
