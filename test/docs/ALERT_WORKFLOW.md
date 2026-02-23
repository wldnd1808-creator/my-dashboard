# 이상 징후 자동 알림 시스템

FastAPI(main.py) + Node.js(server/index.js) + MariaDB(schema: `docs/01_DB_SCHEMA.sql`) 기반으로 **위험 신호**와 **이상 징후**를 감지해 Slack 알림을 보내고 `alert_events` 테이블에 기록합니다.

---

## 1. 흐름 요약

| 구분 | 트리거 | 동작 |
|------|--------|------|
| **단건 위험** | 예측 API 호출 시 예측값 &lt; 기준(190 mAh/g) | FastAPI → Node `/api/dashboard/alert` → Slack + DB |
| **이상 징후** | Node가 주기적으로 FastAPI `/api/anomaly/check` 호출 | FastAPI가 최근 예측 데이터 분석 → 이상 시 Node 알림 → Slack + DB |

- **FastAPI**: 예측 수행, 위험 단건 감지, 이상 징후 분석(불량 비율·연속 불량) API 제공
- **Node.js**: 알림 웹훅 수신 → Slack 전송 + `alert_events` 저장, **주기적 이상 징후 검사** 스케줄러
- **DB**: `alert_events`에 `event_type` = `danger`(단건 위험) / `anomaly`(이상 징후) 등으로 기록

---

## 2. 이상 징후 검사 규칙 (FastAPI)

- **불량 비율**: 최근 N건(기본 20건) 중 예측값 &lt; 190 인 비율이 기준(기본 30%) 초과 → 이상
- **연속 불량**: 최근 예측이 연속 K건(기본 3건) 이상 불량 → 이상

이상이 하나라도 있으면 FastAPI가 Node 알림 웹훅을 1회 호출하고, Node가 Slack 전송 + DB 기록합니다.

---

## 3. 설정

### 3.1 MariaDB: `alert_events` 테이블

```bash
python create_tables.py
```

또는 `docs/01_DB_SCHEMA.sql`의 `alert_events` CREATE 문을 직접 실행합니다.

### 3.2 FastAPI (python_backend/.env)

```env
NODE_ALERT_WEBHOOK_URL=http://localhost:3000/api/dashboard/alert
DANGER_THRESHOLD=190
```

이상 징후 규칙(선택):

```env
ANOMALY_WINDOW=20
ANOMALY_LOOKBACK=50
ANOMALY_DEFECT_RATIO=0.3
ANOMALY_CONSECUTIVE=3
```

### 3.3 Node.js (node_backend/.env)

```env
PREDICTION_API_URL=http://localhost:8000
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

이상 징후 검사 주기(선택, 기본 5분):

```env
ANOMALY_CHECK_INTERVAL_MS=300000
```

### 3.4 실행 순서

1. MariaDB 실행
2. `python create_tables.py` (최초 1회)
3. FastAPI: `cd python_backend && python main.py` (포트 8000)
4. Node: `cd node_backend && npm start` (포트 3000)
5. 브라우저: `http://localhost:3000`

- **단건 위험**: 대시보드에서 불량 가능 조건(예: 780°C, 9h)으로 예측 시 즉시 위험 알림
- **이상 징후**: Node가 설정한 주기마다 FastAPI `/api/anomaly/check` 호출, 이상 시 자동 알림
- **수동 검사**: `GET http://localhost:3000/api/dashboard/anomaly-check` 호출로 즉시 이상 징후 검사 가능

이벤트는 대시보드 **이벤트 타임라인**에서 확인할 수 있습니다.
