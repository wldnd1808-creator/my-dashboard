#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MariaDB Cloud: sensors, telemetry 테이블에 장비 상태 더미 데이터(~100건) 삽입
SSL(CA 인증서) 연결 지원. .env 설정 후 실행: python insert_telemetry_dummy.py

실행 전:
  1. docs/04_mariadb_cloud_schema.sql 로 테이블 생성
  2. python_backend/.env 또는 프로젝트 루트 .env 에 DB 접속 정보 설정
  3. DB_SSL=true, DB_CA_PATH=인증서경로 설정
"""

import os
import random
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
import pymysql

# python_backend/.env 또는 프로젝트 루트 .env
_env_paths = [
    Path(__file__).resolve().parent / "python_backend" / ".env",
    Path(__file__).resolve().parent / ".env",
]
for p in _env_paths:
    if p.exists():
        load_dotenv(p)
        break


def get_conn():
    """MariaDB Cloud SSL(CA) 연결."""
    kwargs = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME"),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
    }
    if os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes"):
        ca_path = os.getenv("DB_CA_PATH", "").strip()
        if ca_path and Path(ca_path).exists():
            kwargs["ssl"] = {"ca": ca_path}
        else:
            kwargs["ssl"] = True
    return pymysql.connect(**kwargs)


# 센서 정의: (equipment_id, sensor_name, sensor_type, location, unit, normal_min, normal_max)
SENSORS = [
    ("EQ-SF-01", "모터 베어링 온도", "temperature", "A동 1호기", "°C", 55, 85),
    ("EQ-SF-01", "모터 진동", "vibration", "A동 1호기", "mm/s", 2.0, 8.0),
    ("EQ-SF-02", "펌프 출구 압력", "pressure", "B동 2호기", "MPa", 0.3, 0.7),
    ("EQ-SF-02", "펌프 진동", "vibration", "B동 2호기", "mm/s", 1.5, 7.0),
    ("EQ-SF-03", "구동부 온도", "temperature", "C동 3호기", "°C", 50, 80),
]

# 센서별 정상/이상 값 범위 (정상일 확률 70%)
def gen_value(sensor_idx: int, is_anomaly: bool) -> tuple[float, str]:
    ranges = [
        (55, 85, 40, 100),   # 0: 온도
        (2, 8, 0.5, 18),     # 1: 진동
        (0.3, 0.7, 0.1, 0.95),
        (1.5, 7, 0.5, 14),
        (50, 80, 40, 95),
    ]
    n_min, n_max, a_low, a_high = ranges[sensor_idx % len(ranges)]
    if is_anomaly:
        # 정상 범위 밖
        if random.random() < 0.5:
            value = random.uniform(a_low, n_min - 0.1)
        else:
            value = random.uniform(n_max + 0.1, a_high)
        return round(value, 2), "anomaly"
    value = random.uniform(n_min, n_max)
    return round(value, 2), "normal"


def main():
    conn = get_conn()
    try:
        cur = conn.cursor()

        # 1. 기존 EQ-SF-* 센서 확인 또는 삽입
        cur.execute("SELECT id FROM sensors WHERE equipment_id LIKE 'EQ-SF-%%' ORDER BY id")
        existing = cur.fetchall()
        if existing:
            sensor_ids = [r["id"] for r in existing]
            print(f"기존 센서 {len(sensor_ids)}건 사용")
        else:
            print("센서 마스터 삽입...")
            for eq, name, stype, loc, unit, nmin, nmax in SENSORS:
                cur.execute(
                    """INSERT INTO sensors (equipment_id, sensor_name, sensor_type, location, unit, normal_min, normal_max)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (eq, name, stype, loc, unit, nmin, nmax),
                )
            conn.commit()
            sensor_ids = [i + 1 for i in range(len(SENSORS))]

        # 2. 텔레메트리 ~100건 삽입 (정상 ~70%, 이상 ~30%)
        print("텔레메트리 더미 데이터 삽입...")
        base_time = datetime.utcnow() - timedelta(days=7)
        count = 0
        for _ in range(100):
            sensor_id = random.choice(sensor_ids)
            sensor_idx = sensor_id - 1
            is_anomaly = random.random() < 0.3
            value, label = gen_value(sensor_idx, is_anomaly)
            recorded_at = base_time + timedelta(minutes=random.randint(0, 7 * 24 * 60))
            cur.execute(
                "INSERT INTO telemetry (sensor_id, recorded_at, value, label) VALUES (%s, %s, %s, %s)",
                (sensor_id, recorded_at, value, label),
            )
            count += 1
        conn.commit()
        print(f"완료: 센서 {len(SENSORS)}건, 텔레메트리 {count}건 삽입됨")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
