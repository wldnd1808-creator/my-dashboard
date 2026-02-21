"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { AlertMessage } from "@/lib/sensor-alerts";

interface NotificationContextType {
  alerts: AlertMessage[];
  unreadCount: number;
  addAlert: (alert: AlertMessage) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function createDemoAlert(): AlertMessage {
  return {
    id: `demo-${Date.now()}`,
    message: "[ICCU 모니터] 온도 82도 이상 발생 - 즉시 확인 필요",
    equipmentName: "ICCU 모니터",
    type: "temperature",
    value: 82,
    timestamp: Date.now(),
    aiInsight: "과거 데이터 패턴 분석 결과, 30분 내 과열로 인한 정지 확률 64%입니다.",
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>(() => [createDemoAlert()]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAlerts((prev) => (prev.length === 0 ? [createDemoAlert()] : prev));
  }, []);

  const addAlert = useCallback((alert: AlertMessage) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 50)); // 최대 50개 유지
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      alerts.forEach((a) => next.add(a.id));
      return next;
    });
  }, [alerts]);

  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  return (
    <NotificationContext.Provider
      value={{ alerts, unreadCount, addAlert, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

const DEFAULT_NOTIFICATIONS: NotificationContextType = {
  alerts: [],
  unreadCount: 0,
  addAlert: () => {},
  markAllRead: () => {},
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  return ctx ?? DEFAULT_NOTIFICATIONS;
}
