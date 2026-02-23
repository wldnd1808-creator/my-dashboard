'use client';

import React from 'react';

const HUMIDITY_DANGER_THRESHOLD = 72;

export type HumidityDangerAlertProps = {
  open: boolean;
  onClose: () => void;
  onApproveControl: () => void | Promise<void>;
  onViewDetail: () => void;
};

export function HumidityDangerAlert({
  open,
  onClose,
  onApproveControl,
  onViewDetail,
}: HumidityDangerAlertProps) {
  if (!open) return null;

  const handleApprove = async () => {
    await onApproveControl();
    onClose();
  };

  const handleViewDetail = () => {
    onViewDetail();
    onClose();
  };

  return (
    <div
      className="humidity-warning-overlay is-open"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="humidityWarningTitle"
      style={overlayStyle}
    >
      <div className="humidity-warning-modal" style={modalStyle}>
        <div className="humidity-warning-modal__header" style={headerStyle}>
          <h2 id="humidityWarningTitle" style={titleStyle}>
            <span className="icon">🔍</span> 습도 위험 구간 진입 경고
          </h2>
        </div>
        <div className="humidity-warning-modal__body" style={bodyStyle}>
          습도 변수가 위험 구간에 진입 중입니다. 현재 추세라면 10분 내 불량률이 <strong>12%</strong>까지 상승할 것으로 예측됩니다. 제습 설비 강도를 <strong>&apos;강&apos;</strong>으로 높일까요?
        </div>
        <div className="humidity-warning-modal__actions" style={actionsStyle}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleApprove}
            style={primaryBtnStyle}
          >
            설비 제어 승인
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleViewDetail}
            style={secondaryBtnStyle}
          >
            상세 데이터 보기
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--surface, #141b23)',
  border: '1px solid var(--border, #2d3748)',
  borderRadius: 'var(--radius, 12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px 12px',
  borderBottom: '1px solid var(--border, #2d3748)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--text, #e6edf3)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const bodyStyle: React.CSSProperties = {
  padding: '20px 24px',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  color: 'var(--text-muted, #8b949e)',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: '16px 24px 20px',
  borderTop: '1px solid var(--border, #2d3748)',
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 20px',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--accent, #39c5cf) 0%, #2da8b0 100%)',
  color: '#0a0e14',
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 20px',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  fontWeight: 600,
  borderRadius: 8,
  cursor: 'pointer',
  background: 'var(--surface-hover, #1a222c)',
  color: 'var(--text-muted, #8b949e)',
  border: '1px solid var(--border, #2d3748)',
};

export { HUMIDITY_DANGER_THRESHOLD };
