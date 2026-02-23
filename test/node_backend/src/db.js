// 가이드 ④: Node.js에서 MariaDB 연결 (대시보드용 데이터 조회)
// MariaDB Cloud: DB_SSL=true, DB_CA_PATH 로 SSL+CA 인증서 연결

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

let pool = null;

function getPool() {
  if (!pool) {
    const opts = {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    const useSsl = /^(true|1|yes)$/i.test(process.env.DB_SSL || "");
    if (useSsl) {
      const caPath = (process.env.DB_CA_PATH || "").trim();
      if (caPath && fs.existsSync(caPath)) {
        opts.ssl = { ca: fs.readFileSync(caPath) };
      } else {
        opts.ssl = true;
      }
    }
    pool = mysql.createPool(opts);
  }
  return pool;
}

/** 훈련 데이터 최근 limit 건 */
async function getTrainingData(limit = 100) {
  const [rows] = await getPool().query(
    "SELECT id, created_at, feature1, feature2, target FROM training_data ORDER BY id DESC LIMIT ?",
    [limit]
  );
  return rows;
}

/** 예측 결과 최근 limit 건 (대시보드용) */
async function getPredictions(limit = 100) {
  const [rows] = await getPool().query(
    "SELECT id, created_at, model_name, input_summary, prediction_value, meta FROM predictions ORDER BY id DESC LIMIT ?",
    [limit]
  );
  return rows;
}

/** 훈련 데이터 전체 개수 */
async function getTrainingDataCount() {
  const [rows] = await getPool().query("SELECT COUNT(*) as count FROM training_data");
  return rows[0].count;
}

/** 예측 결과 전체 개수 */
async function getPredictionsCount() {
  const [rows] = await getPool().query("SELECT COUNT(*) as count FROM predictions");
  return rows[0].count;
}

/** 알림 이벤트 최근 limit 건 (타임라인용) */
async function getAlertEvents(limit = 50) {
  const [rows] = await getPool().query(
    "SELECT id, created_at, event_type, source, prediction_id, message, payload, slack_sent FROM alert_events ORDER BY id DESC LIMIT ?",
    [limit]
  );
  return rows;
}

/** 중고차 리스트 조회 (used_cars 테이블) */
async function getUsedCars(limit = 100, offset = 0) {
  const [rows] = await getPool().query(
    "SELECT id, brand, model, model_year, mileage, accident_count, accident_notes, created_at FROM used_cars ORDER BY id ASC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  return rows;
}

/** 알림 이벤트 1건 저장 */
async function insertAlertEvent(eventType, source, predictionId, message, payload, slackSent = 0) {
  const [result] = await getPool().query(
    "INSERT INTO alert_events (event_type, source, prediction_id, message, payload, slack_sent) VALUES (?, ?, ?, ?, ?, ?)",
    [
      eventType,
      source,
      predictionId ?? null,
      message ?? "",
      payload ? JSON.stringify(payload) : "{}",
      slackSent ? 1 : 0,
    ]
  );
  return result.insertId;
}

module.exports = {
  getPool,
  getTrainingData,
  getPredictions,
  getTrainingDataCount,
  getPredictionsCount,
  getUsedCars,
  getAlertEvents,
  insertAlertEvent,
};
