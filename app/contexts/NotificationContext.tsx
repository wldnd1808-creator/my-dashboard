"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

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
