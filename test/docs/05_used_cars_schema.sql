-- MariaDB: 중고차 시세/이력 관리 스키마
-- 사용: mysql -u 사용자 -p DB이름 < docs/05_used_cars_schema.sql

-- 중고차 마스터 (브랜드, 모델, 연식, 주행거리, 사고 이력)
CREATE TABLE IF NOT EXISTS used_cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(50) NOT NULL COMMENT '브랜드 (현대, 기아, BMW 등)',
  model VARCHAR(100) NOT NULL COMMENT '모델명 (소나타, K5, 3시리즈 등)',
  model_year SMALLINT UNSIGNED NOT NULL COMMENT '연식 (출고년도)',
  mileage INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '주행거리 (km)',
  accident_count TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '사고 이력 횟수',
  accident_notes VARCHAR(500) DEFAULT NULL COMMENT '사고 이력 메모 (경미/전손 등)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brand_model (brand, model),
  INDEX idx_model_year (model_year),
  INDEX idx_mileage (mileage),
  INDEX idx_accident (accident_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '중고차 마스터 (브랜드, 모델, 연식, 주행거리, 사고 이력)';

-- 월별 시장 시세 (차량별·월별 시세)
CREATE TABLE IF NOT EXISTS monthly_market_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT NOT NULL COMMENT '차량 ID (used_cars.id)',
  `year_month` CHAR(6) NOT NULL COMMENT '기준월 (YYYYMM, 예: 202401)',
  market_price INT UNSIGNED NOT NULL COMMENT '시장 시세 (만원 단위)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_car_year_month (car_id, `year_month`),
  INDEX idx_year_month (`year_month`),
  INDEX idx_market_price (market_price),
  CONSTRAINT fk_monthly_car FOREIGN KEY (car_id) REFERENCES used_cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '월별 시장 시세';
