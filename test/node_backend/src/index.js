// 가이드 ④·⑤: Node.js 대시보드 백엔드 (Express + MariaDB + FastAPI 연동)
// 이상 징후 자동 알림: 주기적으로 FastAPI 이상 징후 검사 호출
// 설비 고장 확률 >= 0.8 시 Socket.io로 프론트엔드 실시간 알림

const path = require("path");
const http = require("http");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");
const dashboardRouter = require("./routes/dashboard");
const usedCarsRouter = require("./routes/usedCars");
const { getFailureProbability } = require("./services/failureProbabilityService");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const PREDICTION_API_URL = process.env.PREDICTION_API_URL || "http://localhost:8000";
const FAILURE_PROB_THRESHOLD = parseFloat(process.env.FAILURE_PROB_THRESHOLD || "0.8");
const FAILURE_PROB_CHECK_INTERVAL_MS = parseInt(process.env.FAILURE_PROB_CHECK_INTERVAL_MS, 10);
const FAILURE_PROB_CHECK_ENABLED =
  Number.isNaN(FAILURE_PROB_CHECK_INTERVAL_MS) || FAILURE_PROB_CHECK_INTERVAL_MS > 0;
const FAILURE_PROB_INTERVAL_MS = FAILURE_PROB_CHECK_ENABLED
  ? Math.max(Number.isNaN(FAILURE_PROB_CHECK_INTERVAL_MS) ? 60000 : FAILURE_PROB_CHECK_INTERVAL_MS, 30 * 1000)
  : 0;

const ANOMALY_CHECK_INTERVAL_MS = parseInt(process.env.ANOMALY_CHECK_INTERVAL_MS, 10);
const ANOMALY_CHECK_ENABLED = Number.isNaN(ANOMALY_CHECK_INTERVAL_MS) || ANOMALY_CHECK_INTERVAL_MS > 0;
const ANOMALY_INTERVAL_MS = ANOMALY_CHECK_ENABLED
  ? Math.max(ANOMALY_CHECK_INTERVAL_MS || 5 * 60 * 1000, 60 * 1000)
  : 0;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "node-dashboard-backend" });
});

// 대시보드 API (가이드 ④, ⑤)
app.use("/api/dashboard", dashboardRouter);
// 중고차 API (MariaDB 차량 리스트 + FastAPI 예측 가격 병합)
app.use("/api/used-cars", usedCarsRouter);

// 대시보드 정적 파일 (프론트엔드)
const dashboardDir = path.join(__dirname, "..", "..", "dashboard");
app.use(express.static(dashboardDir));
app.get("/", (req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});

function runAnomalyCheck() {
  axios
    .get(`${PREDICTION_API_URL}/api/anomaly/check`, { timeout: 15000 })
    .then((res) => {
      if (res.data && res.data.notified) {
        console.log("[이상 징후] 알림 발송:", res.data.anomalies?.[0]?.message || "이상 징후 감지");
      }
    })
    .catch((err) => {
      if (err.code !== "ECONNREFUSED") {
        console.warn("[이상 징후] 검사 실패:", err.message);
      }
    });
}

/** 고장 확률 주기 검사: 0.8 이상 시 Socket.io로 프론트엔드 실시간 알림 */
function runFailureProbabilityCheck() {
  getFailureProbability({ limit: 200 })
    .then((data) => {
      const prob = data.failure_probability ?? 0;
      if (prob >= FAILURE_PROB_THRESHOLD) {
        const equipmentId = data.equipment_id || "전체";
        const message = `설비 고장 확률 ${(prob * 100).toFixed(1)}% (기준 ${FAILURE_PROB_THRESHOLD * 100}% 이상)`;
        io.emit("failure-alert", {
          equipment_id: equipmentId,
          failure_probability: prob,
          message,
          details: data.details,
          threshold: FAILURE_PROB_THRESHOLD,
        });
        console.log("[고장 알림] Socket.io 발송:", message, "| equipment:", equipmentId);
      }
    })
    .catch((err) => {
      if (err.code !== "ECONNREFUSED") {
        console.warn("[고장 확률] 검사 실패:", err.message);
      }
    });
}

io.on("connection", (socket) => {
  console.log("[Socket.io] 클라이언트 연결:", socket.id);
  socket.on("disconnect", () => {
    console.log("[Socket.io] 클라이언트 연결 해제:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Node 서버: http://localhost:${PORT}`);
  console.log(`  - 대시보드:        GET  /`);
  console.log(`  - 시스템 상태:     GET  /api/dashboard/health-status`);
  console.log(`  - 대시보드 요약:    GET  /api/dashboard/summary`);
  console.log(`  - 훈련 데이터:     GET  /api/dashboard/training`);
  console.log(`  - 예측 결과:       GET  /api/dashboard/predictions`);
  console.log(`  - 고장 확률:       GET  /api/dashboard/failure-probability`);
  console.log(`  - 예측 요청:       POST /api/dashboard/predict  body: { feature1, feature2 }`);
  console.log(`  - 위험/이상 알림:  POST /api/dashboard/alert  (FastAPI → Slack + DB)`);
  console.log(`  - 이벤트 타임라인: GET  /api/dashboard/events`);
  console.log(`  - 이상 징후 검사:      GET  /api/dashboard/anomaly-check (수동)`);
  console.log(`  - 성능 하락 검사:      GET  /api/dashboard/performance-check`);
  console.log(`  - AI 인사이트:         GET  /api/dashboard/insights`);
  console.log(`  - 중고차+예측가격:     GET  /api/used-cars/with-prediction?limit=50&offset=0`);
  console.log(`  - Socket.io: 실시간 고장 알림 (failure-alert, threshold=${FAILURE_PROB_THRESHOLD})`);
  if (ANOMALY_INTERVAL_MS > 0) {
    console.log(`  - 이상 징후 자동 알림: ${ANOMALY_INTERVAL_MS / 1000}초마다 FastAPI /api/anomaly/check 호출`);
    runAnomalyCheck();
    setInterval(runAnomalyCheck, ANOMALY_INTERVAL_MS);
  } else {
    console.log(`  - 이상 징후 자동 알림: 비활성화 (ANOMALY_CHECK_INTERVAL_MS=0 또는 미설정 시 수동만)`);
  }
  if (FAILURE_PROB_INTERVAL_MS > 0) {
    console.log(`  - 고장 확률 자동 검사: ${FAILURE_PROB_INTERVAL_MS / 1000}초마다, >=${FAILURE_PROB_THRESHOLD} 시 Socket.io 알림`);
    runFailureProbabilityCheck();
    setInterval(runFailureProbabilityCheck, FAILURE_PROB_INTERVAL_MS);
  } else {
    console.log(`  - 고장 확률 자동 검사: 비활성화 (FAILURE_PROB_CHECK_INTERVAL_MS 미설정)`);
  }
});
