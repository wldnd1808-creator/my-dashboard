/**
 * FastAPI 고장 확률 API 호출 Service 레이어
 * /api/equipment/failure-probability 결과를 조회합니다.
 */

const axios = require("axios");

const PREDICTION_API_URL = process.env.PREDICTION_API_URL || "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * FastAPI에서 장비 고장 확률을 조회합니다.
 * @param {Object} options
 * @param {string} [options.equipmentId] - 설비 ID (예: EQ-DUMMY-01)
 * @param {number} [options.sensorId] - 특정 센서 ID
 * @param {number} [options.limit=200] - 조회할 텔레메트리 건수
 * @returns {Promise<Object>} { equipment_id, failure_probability, details }
 */
async function getFailureProbability(options = {}) {
  const { equipmentId, sensorId, limit = 200 } = options;
  const params = new URLSearchParams();
  if (equipmentId) params.set("equipment_id", equipmentId);
  if (sensorId != null) params.set("sensor_id", String(sensorId));
  params.set("limit", String(Math.min(limit, 500)));

  const url = `${PREDICTION_API_URL}/api/equipment/failure-probability?${params.toString()}`;
  const res = await axios.get(url, { timeout: DEFAULT_TIMEOUT_MS });
  return res.data;
}

module.exports = {
  getFailureProbability,
};
