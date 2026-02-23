# 가이드 ②·③: FastAPI + MariaDB + 예측 모델
# 실행: python main.py  또는  uvicorn main:app --host 0.0.0.0 --port 8000

import json
import math
import os
from pathlib import Path
from typing import Any, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 프로젝트 내 db 모듈 (같은 폴더에 db.py 가 있어야 함)
from db import get_training_data, get_predictions, insert_training_data, insert_prediction, get_telemetry

app = FastAPI(title="분석/예측 API (Python)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

MODELS_DIR = Path(__file__).resolve().parent / "models"
MODEL_JSON = MODELS_DIR / "model.json"
MODEL_PKL = MODELS_DIR / "model.pkl"
_predict_model: Any = None
_model_kind: Optional[str] = None  # "json" | "pkl" | None

# 위험(불량) 판정 기준: 예측값이 이 값 미만이면 위험 신호
DANGER_THRESHOLD = float(os.getenv("DANGER_THRESHOLD", "190"))

# 이상 징후 자동 알림: 분석 구간 및 규칙
ANOMALY_WINDOW = int(os.getenv("ANOMALY_WINDOW", "20"))  # 최근 N건으로 비율/연속 검사
ANOMALY_LOOKBACK = int(os.getenv("ANOMALY_LOOKBACK", "50"))  # 조회 건수
ANOMALY_DEFECT_RATIO = float(os.getenv("ANOMALY_DEFECT_RATIO", "0.3"))  # 불량 비율 이 값 초과 시 이상
ANOMALY_CONSECUTIVE = int(os.getenv("ANOMALY_CONSECUTIVE", "3"))  # 연속 불량 이 건수 이상 시 이상

# 입력 정상 범위 (이상 탐지용)
INPUT_TEMP_MIN = float(os.getenv("INPUT_TEMP_MIN", "750"))
INPUT_TEMP_MAX = float(os.getenv("INPUT_TEMP_MAX", "1000"))
INPUT_TIME_MIN = float(os.getenv("INPUT_TIME_MIN", "8"))
INPUT_TIME_MAX = float(os.getenv("INPUT_TIME_MAX", "24"))

# 성능 하락 알림: 실제 vs 예측 MAE가 이 값 초과 시 "모델 재학습 필요"
PERFORMANCE_MAE_THRESHOLD = float(os.getenv("PERFORMANCE_MAE_THRESHOLD", "15"))
PERFORMANCE_SAMPLE_SIZE = int(os.getenv("PERFORMANCE_SAMPLE_SIZE", "20"))


def _notify_danger_to_node(prediction_id: int, prediction_value: float, input_summary: dict, model_name: str) -> None:
    """위험 감지 시 Node.js 알림 웹훅 호출 (Slack 전송·DB 기록은 Node에서 수행)."""
    url = os.getenv("NODE_ALERT_WEBHOOK_URL", "").strip()
    if not url:
        return
    payload = {
        "eventType": "danger",
        "source": "fastapi-predict",
        "predictionId": prediction_id,
        "predictionValue": prediction_value,
        "inputSummary": input_summary,
        "modelName": model_name,
        "message": f"위험 신호: 예측 방전용량 {prediction_value:.2f} mAh/g (기준 미만, 불량 가능)",
    }
    body = json.dumps(payload).encode("utf-8")
    req = Request(url, data=body, method="POST", headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=5) as _:
            pass
    except (URLError, HTTPError, OSError):
        pass  # 알림 실패해도 예측 API는 성공으로 반환


def _notify_anomaly_to_node(message: str, payload: dict) -> None:
    """이상 징후 감지 시 Node.js 알림 웹훅 호출 (이상 징후 자동 알림 시스템)."""
    url = os.getenv("NODE_ALERT_WEBHOOK_URL", "").strip()
    if not url:
        return
    body_dict = {
        "eventType": "anomaly",
        "source": "fastapi-anomaly-check",
        "predictionId": None,
        "predictionValue": payload.get("recent_avg"),
        "inputSummary": {},
        "modelName": "",
        "message": message,
        "payload": payload,
    }
    body = json.dumps(body_dict).encode("utf-8")
    req = Request(url, data=body, method="POST", headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=5) as _:
            pass
    except (URLError, HTTPError, OSError):
        pass


def _check_anomalies() -> list[dict]:
    """
    최근 예측 데이터를 분석해 이상 징후 여부 반환.
    - 최근 ANOMALY_WINDOW 건 중 불량 비율 > ANOMALY_DEFECT_RATIO
    - 연속 불량 건수 >= ANOMALY_CONSECUTIVE
    """
    try:
        rows = get_predictions(limit=ANOMALY_LOOKBACK)
    except Exception:
        return []
    if not rows or len(rows) < ANOMALY_CONSECUTIVE:
        return []

    # 예측값만 시간순(오래된 것 먼저)으로
    values = []
    for r in reversed(rows):
        v = r.get("prediction_value")
        if v is not None:
            try:
                values.append(float(v))
            except (TypeError, ValueError):
                pass
    if len(values) < ANOMALY_CONSECUTIVE:
        return []

    anomalies = []
    window = values[-ANOMALY_WINDOW:] if len(values) >= ANOMALY_WINDOW else values
    defect_count = sum(1 for v in window if v < DANGER_THRESHOLD)
    defect_ratio = defect_count / len(window)

    # 규칙 1: 불량 비율 초과
    if defect_ratio >= ANOMALY_DEFECT_RATIO:
        anomalies.append({
            "rule": "defect_ratio",
            "message": f"이상 징후: 최근 {len(window)}건 중 불량 비율 {defect_ratio:.1%} (기준 {ANOMALY_DEFECT_RATIO:.0%} 초과)",
            "defect_ratio": defect_ratio,
            "defect_count": defect_count,
            "window_size": len(window),
            "recent_avg": sum(window) / len(window),
        })

    # 규칙 2: 연속 불량
    consecutive = 0
    for v in reversed(values):
        if v < DANGER_THRESHOLD:
            consecutive += 1
        else:
            break
    if consecutive >= ANOMALY_CONSECUTIVE:
        anomalies.append({
            "rule": "consecutive_defect",
            "message": f"이상 징후: 연속 불량 {consecutive}건 (기준 {ANOMALY_CONSECUTIVE}건 이상)",
            "consecutive_defect": consecutive,
            "recent_avg": sum(values[-ANOMALY_WINDOW:]) / len(values[-ANOMALY_WINDOW:]) if len(values) >= ANOMALY_WINDOW else sum(values) / len(values),
        })

    return anomalies


def _load_json_model():
    with open(MODEL_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def _predict_json(model: dict, f1: float, f2: float) -> float:
    b = model["intercept"]
    c1, c2 = model["coef"]
    return b + c1 * f1 + c2 * f2


def get_model():
    global _predict_model, _model_kind
    if _model_kind is not None:
        return _predict_model
    if MODEL_JSON.exists():
        try:
            _predict_model = _load_json_model()
            _model_kind = "json"
            return _predict_model
        except Exception:
            pass
    if MODEL_PKL.exists():
        try:
            import joblib
            _predict_model = joblib.load(MODEL_PKL)
            _model_kind = "pkl"
            return _predict_model
        except Exception:
            pass
    _model_kind = "none"
    return None


def _predict_value(f1: float, f2: float) -> Optional[float]:
    """현재 로드된 모델로 예측값 반환. 모델 없으면 None."""
    model = get_model()
    if _model_kind == "json" and model is not None:
        return _predict_json(model, f1, f2)
    if _model_kind == "pkl" and model is not None:
        return float(model.predict([[f1, f2]])[0])
    return None


def _check_input_anomaly(f1: float, f2: float) -> Optional[str]:
    """입력(온도/시간)이 권장 범위를 벗어나면 경고 메시지 반환."""
    warnings = []
    if f1 < INPUT_TEMP_MIN or f1 > INPUT_TEMP_MAX:
        warnings.append(f"소성온도 {f1}°C가 권장 범위({INPUT_TEMP_MIN}~{INPUT_TEMP_MAX}°C)를 벗어났습니다.")
    if f2 < INPUT_TIME_MIN or f2 > INPUT_TIME_MAX:
        warnings.append(f"소성시간 {f2}h가 권장 범위({INPUT_TIME_MIN}~{INPUT_TIME_MAX}h)를 벗어났습니다.")
    return " ".join(warnings) if warnings else None


def _check_performance() -> dict:
    """
    최근 훈련 데이터(실제값)와 모델 예측값을 비교해 MAE 계산.
    MAE가 기준 초과 시 '모델 재학습 필요' 알림 반환.
    """
    model = get_model()
    if model is None or _model_kind == "none":
        return {"alert": False, "message": "예측 모델이 없어 성능 검사를 건너뜁니다.", "mae": None, "sample_size": 0}

    try:
        rows = get_training_data(limit=PERFORMANCE_SAMPLE_SIZE)
    except Exception:
        return {"alert": False, "message": "훈련 데이터 조회 실패", "mae": None, "sample_size": 0}

    if not rows:
        return {"alert": False, "message": "훈련 데이터가 없어 성능 검사를 건너뜁니다.", "mae": None, "sample_size": 0}

    errors = []
    for r in rows:
        f1 = float(r.get("feature1", 0))
        f2 = float(r.get("feature2", 0))
        actual = float(r.get("target", 0))
        pred = _predict_value(f1, f2)
        if pred is not None:
            errors.append(abs(actual - pred))

    if not errors:
        return {"alert": False, "message": "비교할 예측값이 없습니다.", "mae": None, "sample_size": 0}

    mae = sum(errors) / len(errors)
    alert = mae > PERFORMANCE_MAE_THRESHOLD
    message = (
        f"모델 재학습이 필요합니다. 최근 실제값 대비 평균 오차(MAE) {mae:.2f} mAh/g (기준: {PERFORMANCE_MAE_THRESHOLD})"
        if alert
        else f"모델 성능 정상. 최근 MAE {mae:.2f} mAh/g"
    )
    return {
        "alert": alert,
        "message": message,
        "mae": round(mae, 2),
        "sample_size": len(errors),
        "threshold": PERFORMANCE_MAE_THRESHOLD,
    }


# ---------- ② DB 연동 API ----------

@app.get("/health")
def health():
    return {"status": "ok", "service": "python-backend"}


@app.get("/api/training-data")
def api_training_data(limit: int = 100):
    """훈련 데이터 조회 (대시보드/학습용)"""
    try:
        rows = get_training_data(limit=limit)
        # datetime 등은 JSON 호환 형태로
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predictions")
def api_predictions(limit: int = 100):
    """예측 결과 조회 (대시보드용)"""
    try:
        rows = get_predictions(limit=limit)
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TrainingRow(BaseModel):
    feature1: float
    feature2: float
    target: float


@app.post("/api/training-data")
def api_insert_training(row: TrainingRow):
    """훈련 데이터 1건 저장"""
    try:
        rid = insert_training_data(row.feature1, row.feature2, row.target)
        return {"id": rid, "message": "저장됨"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- ③ 예측 API (모델 붙이기 위한 뼈대) ----------

class PredictRequest(BaseModel):
    feature1: float
    feature2: float


@app.post("/api/predict")
def api_predict(req: PredictRequest):
    """
    예측 수행. models/model.json 또는 model.pkl 이 있으면 해당 모델 사용, 없으면 더미.
    입력/예측값 이상 시 input_anomaly, value_anomaly 필드로 경고 반환.
    """
    model = get_model()
    if _model_kind == "json" and model is not None:
        pred = _predict_json(model, req.feature1, req.feature2)
        model_name = "capacity_linear"
    elif _model_kind == "pkl" and model is not None:
        pred = float(model.predict([[req.feature1, req.feature2]])[0])
        model_name = "capacity_pkl"
    else:
        pred = (req.feature1 + req.feature2) / 2.0
        model_name = "dummy_model"
    input_summary = {"feature1": req.feature1, "feature2": req.feature2}

    # 입력 이상 탐지: 권장 범위 벗어나면 경고
    input_anomaly = _check_input_anomaly(req.feature1, req.feature2)

    # 예측값 이상 탐지: 최근 예측 평균 대비 크게 벗어나면 경고
    value_anomaly = None
    try:
        recent = get_predictions(limit=ANOMALY_WINDOW)
        if len(recent) >= 5:
            vals = [float(r.get("prediction_value", 0)) for r in recent if r.get("prediction_value") is not None]
            if vals:
                mean_v = sum(vals) / len(vals)
                import math
                std_v = math.sqrt(sum((x - mean_v) ** 2 for x in vals) / len(vals)) if len(vals) > 1 else 0
                if std_v > 0 and abs(pred - mean_v) > 2 * std_v:
                    value_anomaly = f"예측값 {pred:.1f} mAh/g가 최근 평균({mean_v:.1f}) 대비 크게 벗어납니다."
    except Exception:
        pass

    prediction_id = None
    try:
        prediction_id = insert_prediction(model_name, input_summary, pred, {"note": "모델 예측" if model else "더미"})
    except Exception:
        pass
    # 위험(불량) 감지 시 Node 웹훅으로 알림 → Node가 Slack 전송 + DB 기록
    if pred < DANGER_THRESHOLD and prediction_id is not None:
        _notify_danger_to_node(prediction_id, pred, input_summary, model_name)

    result = {"prediction": pred, "input": input_summary}
    if input_anomaly:
        result["input_anomaly"] = input_anomaly
    if value_anomaly:
        result["value_anomaly"] = value_anomaly
    return result


# ---------- 중고차 가격 예측 API (Node 연동용) ----------

# 브랜드별 기준 시세 구간 (만원) - 더미 모델용
_BRAND_BASE_PRICE = {
    "현대": 1500, "기아": 1450, "제네시스": 2800, "쉐보레": 1200, "르노코리아": 1300,
    "한국GM": 1100, "BMW": 3200, "벤츠": 3500, "아우디": 3000, "폭스바겐": 2200,
    "토요타": 2500, "혼다": 2300,
}


def _predict_car_price(brand: str, model: str, model_year: int, mileage: int, accident_count: int) -> int:
    """중고차 예측 가격(만원). 더미: 브랜드 기준가 - 연식/주행/사고 할인."""
    base = _BRAND_BASE_PRICE.get(brand, 1500)
    from datetime import date
    year_now = date.today().year
    years_old = max(0, year_now - model_year)
    price = base * (1.0 - 0.05 * years_old)
    price *= max(0.5, 1.0 - (mileage / 300_000) * 0.3)
    price *= max(0.7, 1.0 - accident_count * 0.08)
    return max(100, int(round(price)))


class PredictPriceRequest(BaseModel):
    brand: str
    model: str
    model_year: int
    mileage: int
    accident_count: int = 0


class PredictPriceCarItem(BaseModel):
    id: Optional[int] = None
    brand: str
    model: str
    model_year: int
    mileage: int
    accident_count: int = 0


class PredictPriceBatchRequest(BaseModel):
    cars: list[PredictPriceCarItem]


@app.post("/api/predict-price")
def api_predict_price(req: PredictPriceRequest):
    """중고차 1건 예측 가격(만원). Node에서 차량 리스트와 병합해 프론트 전달용."""
    price = _predict_car_price(
        req.brand, req.model, req.model_year, req.mileage, req.accident_count
    )
    return {"predicted_price": price}


@app.post("/api/predict-price-batch")
def api_predict_price_batch(req: PredictPriceBatchRequest):
    """중고차 여러 건 일괄 예측. Node에서 차량 리스트와 병합할 때 사용."""
    predictions = []
    for i, car in enumerate(req.cars):
        price = _predict_car_price(
            car.brand, car.model, car.model_year, car.mileage, car.accident_count
        )
        predictions.append({"car_id": car.id if car.id is not None else i + 1, "predicted_price": price})
    return {"predictions": predictions}


# ---------- 이상 징후 자동 알림 시스템 ----------

@app.get("/api/anomaly/check")
def api_anomaly_check():
    """
    최근 예측 데이터를 분석해 이상 징후(불량 비율·연속 불량)를 검사하고,
    이상 시 Node 알림 웹훅을 호출합니다. Node에서 주기적으로 호출하면 자동 알림이 동작합니다.
    """
    anomalies = _check_anomalies()
    notified = False
    if anomalies:
        # 첫 번째 이상 징후로 알림 1회 전송 (중복 알림 방지)
        first = anomalies[0]
        payload = {
            "anomalies": anomalies,
            "recent_avg": first.get("recent_avg"),
            "defect_ratio": first.get("defect_ratio"),
            "consecutive_defect": first.get("consecutive_defect"),
        }
        _notify_anomaly_to_node(first["message"], payload)
        notified = True
    return {"anomalies": anomalies, "notified": notified}


# ---------- 설비 예지 보전: 고장 확률 API (Z-score 기반) ----------

def _compute_failure_probability(rows: list[dict]) -> tuple[float, dict]:
    """
    scipy Z-score 기반 통계적 이상 탐지로 고장 확률 0~1 계산.
    - 센서별로 Z-score 계산, 가장 이상 징후가 큰 센서 기준으로 확률 산출
    - |z| >= 3 이면 고위험(확률 1에 근접), z≈0 이면 정상(확률 0에 근접)
    """
    from collections import defaultdict
    from scipy import stats
    import numpy as np

    if not rows:
        return 0.0, {"message": "데이터 없음", "sensors": []}

    # 센서별 value 시계열 (최신순이므로 시간순으로 쓰려면 reverse)
    by_sensor: dict[int, list[float]] = defaultdict(list)
    sensor_info: dict[int, dict] = {}
    for r in rows:
        sid = r.get("sensor_id")
        val = r.get("value")
        if sid is not None and val is not None:
            try:
                by_sensor[sid].append(float(val))
            except (TypeError, ValueError):
                pass
        if sid and sid not in sensor_info:
            sensor_info[sid] = {
                "sensor_id": sid,
                "sensor_name": r.get("sensor_name"),
                "sensor_type": r.get("sensor_type"),
                "equipment_id": r.get("equipment_id"),
            }

    details = []
    max_abs_z = 0.0
    for sid, vals in by_sensor.items():
        if len(vals) < 2:
            z_last = 0.0
        else:
            arr = np.array(vals)
            zs = stats.zscore(arr, nan_policy="omit")
            z_last = float(zs[-1]) if not np.isnan(zs[-1]) else 0.0
        abs_z = abs(z_last)
        max_abs_z = max(max_abs_z, abs_z)
        info = sensor_info.get(sid, {})
        details.append({
            **info,
            "value_last": vals[-1] if vals else None,
            "z_score": round(z_last, 4),
            "sample_count": len(vals),
        })

    # |z| -> 확률: min(1, |z|/3) 로 단순 매핑 (3-sigma 초과 시 1)
    prob = min(1.0, max(0.0, max_abs_z / 3.0))

    return round(prob, 4), {"method": "zscore", "max_abs_z": round(max_abs_z, 4), "sensors": details}


@app.get("/api/equipment/failure-probability")
def api_failure_probability(equipment_id: str | None = None, sensor_id: int | None = None, limit: int = 200):
    """
    telemetry 테이블 데이터를 조회해 현재 장비의 고장 확률(0~1)을 반환합니다.
    scipy Z-score 기반 통계적 이상 탐지 사용 (실제 모델 대체용).

    - equipment_id: 설비 ID로 필터 (예: EQ-DUMMY-01)
    - sensor_id: 특정 센서만 조회 시
    - limit: 조회할 텔레메트리 건수 (기본 200)
    """
    try:
        rows = get_telemetry(equipment_id=equipment_id, sensor_id=sensor_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텔레메트리 조회 실패: {e}")

    prob, details = _compute_failure_probability(rows)
    return {
        "equipment_id": equipment_id,
        "sensor_id": sensor_id,
        "failure_probability": prob,
        "details": details,
    }


# ---------- 성능 하락 알림 (모델 재학습 필요) ----------

@app.get("/api/performance/check")
def api_performance_check():
    """
    최근 훈련 데이터(실제 방전용량)와 모델 예측값을 비교해 MAE를 계산합니다.
    MAE가 기준을 초과하면 '모델 재학습 필요' 알림을 반환합니다.
    """
    return _check_performance()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
