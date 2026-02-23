# 가이드 ② 단계: MariaDB 연결과 조회/저장 함수
# 사용 전: .env 에 DB_HOST, DB_USER, DB_PASSWORD, DB_NAME 설정

import os
from contextlib import contextmanager
from pathlib import Path

import pymysql
from dotenv import load_dotenv

# python_backend/.env 를 항상 로드 (실행 경로에 무관)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)


def _conn():
    """MariaDB 접속 설정 (환경변수 사용). 클라우드 사용 시 DB_SSL=true, DB_CA_PATH 로 SSL+CA 적용."""
    kwargs = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME"),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "auth_plugin_map": {},
    }
    if os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes"):
        ca_path = os.getenv("DB_CA_PATH", "").strip()
        if ca_path and Path(ca_path).exists():
            kwargs["ssl"] = {"ca": ca_path}
        else:
            kwargs["ssl"] = True
    return pymysql.connect(**kwargs)


@contextmanager
def get_db():
    """with get_db() as cur: 로 사용. 끝나면 자동으로 연결 종료."""
    conn = _conn()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    finally:
        conn.close()


def get_training_data(limit: int = 100):
    """훈련 데이터 최근 limit 건 조회 → 대시보드/학습용"""
    with get_db() as cur:
        cur.execute(
            "SELECT id, created_at, feature1, feature2, target FROM training_data ORDER BY id DESC LIMIT %s",
            (limit,),
        )
        return cur.fetchall()


def insert_training_data(feature1: float, feature2: float, target: float):
    """훈련 데이터 1건 저장"""
    with get_db() as cur:
        cur.execute(
            "INSERT INTO training_data (feature1, feature2, target) VALUES (%s, %s, %s)",
            (feature1, feature2, target),
        )
        return cur.lastrowid


def get_predictions(limit: int = 100):
    """예측 결과 최근 limit 건 조회 → 대시보드용"""
    with get_db() as cur:
        cur.execute(
            """SELECT id, created_at, model_name, input_summary, prediction_value, meta
               FROM predictions ORDER BY id DESC LIMIT %s""",
            (limit,),
        )
        return cur.fetchall()


def insert_prediction(model_name: str, input_summary: dict, prediction_value: float, meta: dict = None):
    """예측 결과 1건 저장 (가이드 ③에서 모델 호출 후 사용)"""
    import json
    with get_db() as cur:
        cur.execute(
            """INSERT INTO predictions (model_name, input_summary, prediction_value, meta)
               VALUES (%s, %s, %s, %s)""",
            (model_name, json.dumps(input_summary), prediction_value, json.dumps(meta or {})),
        )
        return cur.lastrowid


def get_telemetry(equipment_id: str | None = None, sensor_id: int | None = None, limit: int = 200):
    """
    텔레메트리 시계열 조회 (설비 예지 보전용).
    equipment_id 또는 sensor_id로 필터. 둘 다 없으면 전체 최근 건.
    """
    with get_db() as cur:
        if equipment_id:
            cur.execute(
                """SELECT t.id, t.sensor_id, t.recorded_at, t.value, t.label, t.meta,
                          s.equipment_id, s.sensor_name, s.sensor_type, s.unit, s.normal_min, s.normal_max
                   FROM telemetry t
                   JOIN sensors s ON t.sensor_id = s.id
                   WHERE s.equipment_id = %s
                   ORDER BY t.recorded_at DESC
                   LIMIT %s""",
                (equipment_id, limit),
            )
        elif sensor_id:
            cur.execute(
                """SELECT t.id, t.sensor_id, t.recorded_at, t.value, t.label, t.meta,
                          s.equipment_id, s.sensor_name, s.sensor_type, s.unit, s.normal_min, s.normal_max
                   FROM telemetry t
                   JOIN sensors s ON t.sensor_id = s.id
                   WHERE t.sensor_id = %s
                   ORDER BY t.recorded_at DESC
                   LIMIT %s""",
                (sensor_id, limit),
            )
        else:
            cur.execute(
                """SELECT t.id, t.sensor_id, t.recorded_at, t.value, t.label, t.meta,
                          s.equipment_id, s.sensor_name, s.sensor_type, s.unit, s.normal_min, s.normal_max
                   FROM telemetry t
                   JOIN sensors s ON t.sensor_id = s.id
                   ORDER BY t.recorded_at DESC
                   LIMIT %s""",
                (limit,),
            )
        return cur.fetchall()
