/**
 * 중고차 API 컨트롤러
 * MariaDB 차량 리스트 + FastAPI 예측 가격 병합 후 프론트엔드 전달
 */

const axios = require("axios");
const { getUsedCars } = require("../db");

const PREDICTION_API_URL = process.env.PREDICTION_API_URL || "http://localhost:8000";

/**
 * MariaDB 차량 리스트를 가져와 FastAPI 예측 API로 가격 예측 요청 후 병합
 * @param {Object} options - { limit, offset }
 * @returns {Promise<{ cars: Array<{ ...car, predicted_price: number }>, error?: string }>}
 */
async function getCarsWithPrediction(options = {}) {
  const limit = Math.min(parseInt(options.limit, 10) || 50, 200);
  const offset = Math.max(0, parseInt(options.offset, 10) || 0);

  try {
    const cars = await getUsedCars(limit, offset);
    if (cars.length === 0) {
      return { cars: [], total: 0 };
    }

    const batchBody = {
      cars: cars.map((c) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        model_year: c.model_year,
        mileage: c.mileage,
        accident_count: c.accident_count ?? 0,
      })),
    };

    const apiRes = await axios.post(
      `${PREDICTION_API_URL}/api/predict-price-batch`,
      batchBody,
      { timeout: 15000 }
    );

    const predictions = apiRes.data?.predictions ?? [];
    const priceByCarId = {};
    predictions.forEach((p) => {
      priceByCarId[p.car_id] = p.predicted_price;
    });

    const merged = cars.map((car) => ({
      ...car,
      predicted_price: priceByCarId[car.id] ?? null,
    }));

    return { cars: merged, total: merged.length };
  } catch (err) {
    if (err.response?.status) {
      throw Object.assign(new Error("FastAPI 예측 API 호출 실패"), {
        status: err.response.status,
        detail: err.response.data?.detail ?? err.message,
      });
    }
    throw err;
  }
}

module.exports = {
  getCarsWithPrediction,
};
