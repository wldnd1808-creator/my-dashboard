-- MariaDB 테이블 예시 (가이드 ① 단계)
-- 사용법: MariaDB에 접속한 뒤 이 파일 내용을 실행합니다.
--   mysql -u 사용자명 -p 데이터베이스명 < docs/01_DB_SCHEMA.sql

-- 훈련/원본 데이터 (모델 학습에 쓰이는 데이터)
CREATE TABLE IF NOT EXISTS training_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  feature1 FLOAT COMMENT '입력 특징 1',
  feature2 FLOAT COMMENT '입력 특징 2',
  target FLOAT COMMENT '정답(레이블)'
);

-- 예측 결과 (대시보드에서 보여줄 데이터)
CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_name VARCHAR(50) COMMENT '사용한 모델 이름',
  input_summary JSON COMMENT '예측에 쓴 입력 요약',
  prediction_value FLOAT COMMENT '예측값',
  meta JSON COMMENT '기타 메타정보'
);

-- 위험/이상 징후 알림 이벤트 로그 (이상 징후 자동 알림 시스템, Slack 발송 기록)
CREATE TABLE IF NOT EXISTS alert_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type VARCHAR(50) COMMENT 'danger=단건 위험, anomaly=이상 징후(배치), warning 등',
  source VARCHAR(100) COMMENT '발생 소스 (fastapi-predict, fastapi-anomaly-check 등)',
  prediction_id INT NULL COMMENT '연관 예측 id',
  message TEXT COMMENT '알림 메시지',
  payload JSON COMMENT '추가 데이터 (입력값, 예측값, anomalies 목록 등)',
  slack_sent TINYINT(1) DEFAULT 0 COMMENT 'Slack 발송 여부'
);

-- 예시: 테이블 확인
-- SHOW TABLES;
-- DESCRIBE training_data;
-- DESCRIBE predictions;
-- DESCRIBE alert_events;