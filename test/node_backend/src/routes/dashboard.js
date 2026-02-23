// 가이드 ④·⑤: 대시보드용 API + FastAPI 예측 호출 + 위험 알림(Slack·DB)

const express = require("express");
const axios = require("axios");
const {
  getTrainingData,
  getPredictions,
  getTrainingDataCount,
  getPredictionsCount,
  getAlertEvents,
  insertAlertEvent,
} = require("../db");
const { getFailureProbability } = require("../services/failureProbabilityService");

const router = express.Router();
const PREDICTION_API_URL = process.env.PREDICTION_API_URL || "http://localhost:8000";

/** 시스템 상태: Node + FastAPI 연결 여부 (대시보드 상단 표시용) */
router.get("/health-status", async (req, res) => {
  const nodeOk = true;
  let fastApiOk = false;
  let fastApiMessage = "";
  try {
    const apiRes = await axios.get(`${PREDICTION_API_URL}/health`, { timeout: 3000 });
    fastApiOk = apiRes.data && apiRes.data.status === "ok";
    fastApiMessage = fastApiOk ? "" : (apiRes.data?.detail || "응답 이상");
  } catch (err) {
    fastApiMessage = err.code === "ECONNREFUSED" ? "연결 불가 (서버 미실행)" : err.message || "연결 실패";
  }
  res.json({
    node: { ok: nodeOk, service: "node-dashboard-backend" },
    fastapi: { ok: fastApiOk, service: "python-backend", message: fastApiMessage },
  });
});

/** 대시보드용 요약: 훈련 데이터 + 예측 결과 최근 N건 */
router.get("/summary", async (req, res) => {
  try {
    const trainingLimit = Math.min(parseInt(req.query.trainingLimit, 10) || 100, 200);
    const predictionsLimit = Math.min(parseInt(req.query.predictionsLimit, 10) || 100, 200);
    const [training, predictions, trainingCount, predictionsCount] = await Promise.all([
      getTrainingData(trainingLimit),
      getPredictions(predictionsLimit),
      getTrainingDataCount(),
      getPredictionsCount(),
    ]);
    res.json({ 
      training, 
      predictions,
      counts: {
        training: trainingCount,
        predictions: predictionsCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** 훈련 데이터만 조회 (Node가 DB 직접 조회) */
router.get("/training", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const rows = await getTrainingData(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** 예측 결과만 조회 (대시보드용) */
router.get("/predictions", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const rows = await getPredictions(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** 예측 요청 → FastAPI 호출 (가이드 ⑤) */
router.post("/predict", async (req, res) => {
  try {
    const { feature1, feature2 } = req.body || {};
    const apiRes = await axios.post(`${PREDICTION_API_URL}/api/predict`, {
      feature1: Number(feature1),
      feature2: Number(feature2),
    }, { timeout: 10000 });
    res.json(apiRes.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || err.message;
    res.status(status).json({ error: "예측 API 호출 실패", detail: String(detail) });
  }
});

/** 위험/이상 징후 알림 웹훅 (FastAPI에서 호출) → DB 기록 + Slack 전송 */
router.post("/alert", async (req, res) => {
  try {
    const body = req.body || {};
    const eventType = body.eventType || "danger";
    const source = body.source || "fastapi-predict";
    const predictionId = body.predictionId ?? null;
    const predictionValue = body.predictionValue;
    const inputSummary = body.inputSummary || {};
    const modelName = body.modelName || "";
    const message = body.message || "위험 신호가 감지되었습니다.";
    const payloadBody = body.payload || {};

    const payload = {
      predictionValue,
      inputSummary,
      modelName,
      ...payloadBody,
    };

    let slackSent = 0;
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackUrl && slackUrl.startsWith("https://hooks.slack.com/")) {
      try {
        const isAnomaly = eventType === "anomaly";
        const headerText = isAnomaly ? "⚠️ 이상 징후 감지" : "🚨 위험 신호 감지";
        const headerEmoji = isAnomaly ? "⚠️" : "🚨";

        const blocks = [
          {
            type: "header",
            text: { type: "plain_text", text: headerText, emoji: true },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*메시지:*\n${message}` },
              {
                type: "mrkdwn",
                text: `*예측/평균:*\n${predictionValue != null ? Number(predictionValue).toFixed(2) : "-"} mAh/g`,
              },
            ],
          },
        ];

        if (isAnomaly && payloadBody.anomalies && payloadBody.anomalies.length) {
          const detail = payloadBody.anomalies
            .map((a) => `• ${a.message || a.rule}`)
            .join("\n");
          blocks.push({
            type: "section",
            text: { type: "mrkdwn", text: `*상세:*\n${detail}` },
          });
        } else {
          blocks.push({
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*모델:*\n${modelName || "-"}` },
              {
                type: "mrkdwn",
                text: `*입력:*\n소성온도 ${inputSummary.feature1 ?? "-"}°C / 소성시간 ${inputSummary.feature2 ?? "-"}h`,
              },
            ],
          });
        }

        blocks.push({
          type: "context",
          elements: [{ type: "mrkdwn", text: `소스: ${source} | 예측 ID: ${predictionId ?? "-"}` }],
        });

        await axios.post(
          slackUrl,
          { text: isAnomaly ? "⚠️ 이상 징후 알림" : "🚨 위험 알림", blocks },
          { timeout: 5000 }
        );
        slackSent = 1;
      } catch (slackErr) {
        console.warn("Slack 전송 실패:", slackErr.message);
      }
    }

    const id = await insertAlertEvent(eventType, source, predictionId, message, payload, slackSent);
    res.status(201).json({ ok: true, id, slackSent });
  } catch (err) {
    console.error("Alert webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

/** 이상 징후 검사 수동 실행 (FastAPI /api/anomaly/check 호출 → 이상 시 자동 알림) */
router.get("/anomaly-check", async (req, res) => {
  try {
    const apiRes = await axios.get(`${PREDICTION_API_URL}/api/anomaly/check`, { timeout: 15000 });
    res.json(apiRes.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data || err.message;
    res.status(status).json({ error: "이상 징후 검사 실패", detail: String(detail) });
  }
});

/** 성능 하락 검사 (실제 vs 예측 MAE → 모델 재학습 필요 알림) */
router.get("/performance-check", async (req, res) => {
  try {
    const apiRes = await axios.get(`${PREDICTION_API_URL}/api/performance/check`, { timeout: 15000 });
    res.json(apiRes.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data || err.message;
    res.status(status).json({ error: "성능 검사 실패", detail: String(detail), alert: false });
  }
});

/** 지능형 모니터링 요약: 이상 징후 + 성능 하락 한 번에 조회 (대시보드 AI 인사이트용) */
router.get("/insights", async (req, res) => {
  try {
    const [anomalyRes, perfRes] = await Promise.allSettled([
      axios.get(`${PREDICTION_API_URL}/api/anomaly/check`, { timeout: 10000 }),
      axios.get(`${PREDICTION_API_URL}/api/performance/check`, { timeout: 10000 }),
    ]);
    const anomalies = anomalyRes.status === "fulfilled" && anomalyRes.value?.data?.anomalies
      ? anomalyRes.value.data.anomalies
      : [];
    const performance = perfRes.status === "fulfilled" && perfRes.value?.data
      ? perfRes.value.data
      : { alert: false, message: "성능 검사 불가 (FastAPI 연결 확인)", mae: null, sample_size: 0 };
    res.json({ anomalies, performance });
  } catch (err) {
    res.status(500).json({
      anomalies: [],
      performance: { alert: false, message: "인사이트 조회 실패", mae: null, sample_size: 0 },
    });
  }
});

/** 설비 고장 확률 조회 (FastAPI /api/equipment/failure-probability) */
router.get("/failure-probability", async (req, res) => {
  try {
    const equipmentId = req.query.equipment_id || null;
    const sensorId = req.query.sensor_id != null ? parseInt(req.query.sensor_id, 10) : null;
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const data = await getFailureProbability({ equipmentId, sensorId, limit });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || err.message;
    res.status(status).json({ error: "고장 확률 조회 실패", detail: String(detail) });
  }
});

/** 이벤트 타임라인 (알림 이벤트 목록) */
router.get("/events", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const rows = await getAlertEvents(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
