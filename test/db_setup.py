#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MariaDB Cloud DB 설정: sensors, telemetry 테이블 생성 + 장비 10개 분량 더미 데이터(~100건) 삽입
skysql_ca.pem 인증서를 사용한 SSL 보안 연결

실행: python db_setup.py
필수: .env 또는 python_backend/.env 에 DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME 설정
      skysql_ca.pem 파일 (프로젝트 루트 또는 DB_CA_PATH 경로)
"""

import os
import random
from datetime import datetime, timedelta
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

# .env 로드 (python_backend 또는 프로젝트 루트)
for p in [
    Path(__file__).resolve().parent / "python_backend" / ".env",
    Path(__file__).resolve().parent / ".env",
]:
    if p.exists():
        load_dotenv(p)
        break

# CA 인증서 경로 탐색
# 1) DB_CA_PATH 환경변수 (절대/상대 경로)
# 2) DB_CA_FILENAME 환경변수 (프로젝트 폴더 내 파일명)
# 3) 프로젝트 폴더에서 .pem 파일 자동 탐색
_PROJECT_ROOT = Path(__file__).resolve().parent
_CA_SEARCH_DIRS = [_PROJECT_ROOT, _PROJECT_ROOT / "python_backend"]


def _get_ca_path() -> str:
    # 1) DB_CA_PATH가 있으면 우선 사용
    ca = os.getenv("DB_CA_PATH", "").strip()
    if ca:
        p = Path(ca)
        if p.is_absolute() and p.exists():
            return str(p)
        for base in _CA_SEARCH_DIRS:
            cand = base / ca if not p.is_absolute() else p
            if cand.exists():
                return str(cand)

    # 2) DB_CA_FILENAME으로 프로젝트 폴더 내 파일 지정
    fname = os.getenv("DB_CA_FILENAME", "").strip()
    if fname:
        for base in _CA_SEARCH_DIRS:
            cand = base / fname
            if cand.exists():
                return str(cand)

    # 3) 프로젝트 폴더에서 .pem 파일 자동 탐색 (일반적인 SkySQL 인증서명 우선)
    common_names = ["skysql_chain.pem", "skysql_ca.pem", "skysql-ca.pem", "ca.pem"]
    for base in _CA_SEARCH_DIRS:
        for name in common_names:
            cand = base / name
            if cand.exists():
                return str(cand)
        # 그 외 .pem 파일
        for f in base.glob("*.pem"):
            if f.is_file():
                return str(f)

    return str(_PROJECT_ROOT / "skysql_chain.pem")


def get_conn():
    """skysql_ca.pem 기반 SSL 보안 연결"""
    ca_path = _get_ca_path()
    if not Path(ca_path).exists():
        raise FileNotFoundError(
            f"CA 인증서를 찾을 수 없습니다.\n"
            f"프로젝트 폴더({_PROJECT_ROOT})에 .pem 파일을 넣거나,\n"
            ".env 에 DB_CA_PATH 또는 DB_CA_FILENAME 을 설정하세요."
        )
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        ssl_ca=ca_path,
        ssl_verify_cert=True,
    )


# 장비 10개 × 센서 1개씩 (총 10센서)
SENSORS = [
    ("EQ-SF-01", "모터 베어링 온도", "temperature", "A동 1호기", "°C", 55, 85),
    ("EQ-SF-02", "모터 진동", "vibration", "A동 2호기", "mm/s", 2.0, 8.0),
    ("EQ-SF-03", "펌프 출구 압력", "pressure", "B동 1호기", "MPa", 0.3, 0.7),
    ("EQ-SF-04", "펌프 진동", "vibration", "B동 2호기", "mm/s", 1.5, 7.0),
    ("EQ-SF-05", "구동부 온도", "temperature", "C동 1호기", "°C", 50, 80),
    ("EQ-SF-06", "콘베이어 모터 온도", "temperature", "C동 2호기", "°C", 45, 75),
    ("EQ-SF-07", "로봇 암 진동", "vibration", "D동 1호기", "mm/s", 1.0, 6.0),
    ("EQ-SF-08", "히터 온도", "temperature", "D동 2호기", "°C", 60, 90),
    ("EQ-SF-09", "압축기 압력", "pressure", "E동 1호기", "MPa", 0.4, 0.8),
    ("EQ-SF-10", "팬 베어링 진동", "vibration", "E동 2호기", "mm/s", 2.5, 7.5),
]


def _gen_value(sensor_idx: int, is_anomaly: bool) -> tuple[float, str]:
    """센서별 정상/이상 값 생성 (정상 70%, 이상 30%)"""
    ranges = [
        (55, 85, 40, 100), (2, 8, 0.5, 18), (0.3, 0.7, 0.1, 0.95),
        (1.5, 7, 0.5, 14), (50, 80, 40, 95), (45, 75, 35, 90),
        (1, 6, 0.3, 12), (60, 90, 45, 105), (0.4, 0.8, 0.15, 1.0), (2.5, 7.5, 0.8, 15),
    ]
    n_min, n_max, a_low, a_high = ranges[sensor_idx % len(ranges)]
    if is_anomaly:
        value = random.uniform(a_low, n_min - 0.1) if random.random() < 0.5 else random.uniform(n_max + 0.1, a_high)
        return round(value, 2), "anomaly"
    return round(random.uniform(n_min, n_max), 2), "normal"


def create_tables(cur):
    """sensors, telemetry 테이블 생성"""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sensors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          equipment_id VARCHAR(50) NOT NULL COMMENT '설비 식별자',
          sensor_name VARCHAR(100) NOT NULL COMMENT '센서 이름',
          sensor_type VARCHAR(50) NOT NULL COMMENT '센서 유형',
          location VARCHAR(100) DEFAULT NULL,
          unit VARCHAR(20) DEFAULT NULL,
          normal_min DOUBLE DEFAULT NULL,
          normal_max DOUBLE DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_equipment (equipment_id),
          INDEX idx_sensor_type (sensor_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          sensor_id INT NOT NULL,
          recorded_at DATETIME NOT NULL,
          value DOUBLE NOT NULL,
          label VARCHAR(20) NOT NULL DEFAULT 'normal',
          meta JSON DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_sensor_recorded (sensor_id, recorded_at),
          INDEX idx_recorded (recorded_at),
          INDEX idx_label (label),
          CONSTRAINT fk_telemetry_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("테이블 생성 완료: sensors, telemetry")


def insert_sensors_and_dummy(cur, conn):
    """센서 삽입 후 장비 10개 분량 텔레메트리 ~100건 삽입"""
    # 기존 EQ-SF-* 센서 확인
    cur.execute("SELECT id FROM sensors WHERE equipment_id LIKE 'EQ-SF-%%' ORDER BY id")
    rows = cur.fetchall()
    if rows:
        sensor_ids = [r[0] for r in rows]
        print(f"기존 센서 {len(sensor_ids)}건 사용")
    else:
        print("센서 10건 삽입...")
        for eq, name, stype, loc, unit, nmin, nmax in SENSORS:
            cur.execute(
                """INSERT INTO sensors (equipment_id, sensor_name, sensor_type, location, unit, normal_min, normal_max)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (eq, name, stype, loc, unit, nmin, nmax),
            )
        conn.commit()
        sensor_ids = list(range(1, len(SENSORS) + 1))
        print(f"센서 {len(sensor_ids)}건 삽입 완료")

    # 텔레메트리 ~100건 (정상 ~70%, 이상 ~30%)
    print("텔레메트리 더미 데이터 100건 삽입...")
    base_time = datetime.utcnow() - timedelta(days=7)
    for i in range(100):
        sensor_idx = i % len(sensor_ids)
        sensor_id = sensor_ids[sensor_idx]
        is_anomaly = random.random() < 0.3
        value, label = _gen_value(sensor_idx, is_anomaly)
        recorded_at = base_time + timedelta(minutes=random.randint(0, 7 * 24 * 60))
        cur.execute(
            "INSERT INTO telemetry (sensor_id, recorded_at, value, label) VALUES (%s, %s, %s, %s)",
            (sensor_id, recorded_at, value, label),
        )
    conn.commit()
    print("텔레메트리 100건 삽입 완료")


def main():
    print("MariaDB Cloud DB 설정 시작 (skysql_ca.pem SSL 연결)")
    conn = get_conn()
    try:
        cur = conn.cursor()
        create_tables(cur)
        insert_sensors_and_dummy(cur, conn)
        cur.close()
        print("DB 설정 완료.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
