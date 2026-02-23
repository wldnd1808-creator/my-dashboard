/**
 * 중고차 API 라우트
 * GET /api/used-cars/with-prediction - MariaDB 차량 리스트 + FastAPI 예측 가격 병합
 */

const express = require("express");
const { getCarsWithPrediction } = require("../controllers/usedCarsController");

const router = express.Router();

/** 차량 리스트 + 예측 가격 병합 (프론트엔드 전달용) */
router.get("/with-prediction", async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;
    const result = await getCarsWithPrediction({ limit, offset });
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    const detail = err.detail || err.message;
    res.status(status).json({
      error: "차량 리스트·예측 병합 실패",
      detail: String(detail),
    });
  }
});

module.exports = router;
