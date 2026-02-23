'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { HumidityDangerAlert, HUMIDITY_DANGER_THRESHOLD } from '../../components/HumidityDangerAlert';
import { getApprovalTelegramMessage } from '../../lib/telegram';

/** 차트용 humidity 시계열 (최근 N개) */
const INITIAL_HUMIDITY_SERIES = [68, 69, 70, 71, 72, 73, 74, 75];

/** 텔레그램 발송 (클라이언트 → API 라우트 호출) */
async function notifyTelegramApproval(lineLabel: string = '라인 A'): Promise<void> {
  const message = getApprovalTelegramMessage(lineLabel);
  const res = await fetch('/api/telegram-notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn('Telegram 알림 실패:', err?.error ?? res.statusText);
  }
}

export default function AnalyticsPage() {
  const [humiditySeries, setHumiditySeries] = useState<number[]>(INITIAL_HUMIDITY_SERIES);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertShownThisSession, setAlertShownThisSession] = useState(false);
  const [isStabilizing, setIsStabilizing] = useState(false);

  const currentHumidity = humiditySeries[humiditySeries.length - 1] ?? 0;

  // 습도가 72% 근접/초과 시 사전 알림 (한 세션에 한 번만)
  useEffect(() => {
    if (currentHumidity >= HUMIDITY_DANGER_THRESHOLD && !alertShownThisSession && !alertOpen) {
      setAlertShownThisSession(true);
      setAlertOpen(true);
    }
  }, [currentHumidity, alertShownThisSession, alertOpen]);

  const handleApproveControl = useCallback(async () => {
    setIsStabilizing(true);
    try {
      await notifyTelegramApproval('라인 A');
    } catch (e) {
      console.warn('Telegram 전송 오류:', e);
    }
    // 차트 humidity 즉시 하향 안정화 시뮬레이션
    const base = humiditySeries;
    const steps = 15;
    const interval = 400;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, interval));
      setHumiditySeries((prev) => {
        const last = prev[prev.length - 1] ?? 72;
        const target = 52;
        const next = last + (target - last) * 0.25 + (Math.random() - 0.5) * 1.5;
        const nextVal = Math.round(Math.max(45, Math.min(70, next)) * 10) / 10;
        return [...prev.slice(-20), nextVal];
      });
    }
    setIsStabilizing(false);
  }, [humiditySeries]);

  const handleViewDetail = useCallback(() => {
    // 상세 데이터 페이지로 이동 (경로는 프로젝트에 맞게 수정)
    window.location.href = '/defect-analysis/detail';
    // 또는: router.push('/defect-analysis/detail');
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>주요 변수 구간별 불량률 분석</h1>
      <p style={{ color: 'var(--text-muted, #8b949e)', marginBottom: 24 }}>
        humidity(습도) 데이터가 72%에 근접하거나 초과하면 사전 알림이 표시됩니다.
      </p>

      {/* Humidity 차트 (간단 시각화) */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12 }}>Humidity 추이</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            height: 120,
            padding: '12px 0',
          }}
        >
          {humiditySeries.map((val, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 8,
                height: `${Math.max(10, Math.min(100, (val / 100) * 100))}%`,
                background:
                  val >= HUMIDITY_DANGER_THRESHOLD
                    ? 'var(--danger, #f85149)'
                    : 'var(--accent, #39c5cf)',
                borderRadius: 4,
                transition: 'height 0.3s ease',
              }}
              title={`${val}%`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>현재 습도: <strong>{currentHumidity}%</strong></span>
          {isStabilizing && <span>정상화 진행 중...</span>}
        </div>
      </div>

      <HumidityDangerAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        onApproveControl={handleApproveControl}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}
