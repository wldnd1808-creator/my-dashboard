-- MariaDB Cloud (SkySQL): 스마트 팩토리 예지 보전용 sensors, telemetry 테이블
-- 사용법: SkySQL 클라이언트 또는 mysql --ssl-mode=REQUIRED 로 실행

-- 센서 마스터 (설비별 센서 정보)
CREATE TABLE IF NOT EXISTS sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id VARCHAR(50) NOT NULL COMMENT '설비 식별자',
  sensor_name VARCHAR(100) NOT NULL COMMENT '센서 이름',
  sensor_type VARCHAR(50) NOT NULL COMMENT '센서 유형 (temperature, vibration, pressure, current 등)',
  location VARCHAR(100) DEFAULT NULL COMMENT '설치 위치',
  unit VARCHAR(20) DEFAULT NULL COMMENT '측정 단위 (°C, mm/s, MPa, A 등)',
  normal_min DOUBLE DEFAULT NULL COMMENT '정상 하한 (참고용)',
  normal_max DOUBLE DEFAULT NULL COMMENT '정상 상한 (참고용)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_equipment (equipment_id),
  INDEX idx_sensor_type (sensor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '스마트팩토리 예지보전 센서 마스터';

-- 원격 측정 시계열 데이터 (텔레메트리)
CREATE TABLE IF NOT EXISTS telemetry (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id INT NOT NULL COMMENT '센서 ID (sensors.id)',
  recorded_at DATETIME NOT NULL COMMENT '측정 시각',
  value DOUBLE NOT NULL COMMENT '측정값',
  label VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT '정상/이상 레이블: normal, anomaly',
  meta JSON DEFAULT NULL COMMENT '추가 메타 (원시값, 보정계수 등)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sensor_recorded (sensor_id, recorded_at),
  INDEX idx_recorded (recorded_at),
  INDEX idx_label (label),
  CONSTRAINT fk_telemetry_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '스마트팩토리 예지보전 텔레메트리 시계열';
