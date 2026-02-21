"use client";

import { useCallback } from "react";
import {
  checkSensorThresholdsAndAddAlerts,
  type SensorData,
  type SensorThresholds,
} from "@/lib/sensor-alerts";
import { useNotifications } from "../contexts/NotificationContext";

/**
 * 실시간 센서 데이터를 모니터링하다가 임계치를 넘으면 알림 목록에 추가하는 훅
 * @param thresholds 임계치 (예: { temperature: 80, vibration: 0.8 })
 * @returns checkAndAddAlerts(sensorData) - 센서 데이터가 들어올 때마다 호출
 */
export function useSensorMonitor(thresholds: SensorThresholds = {}) {
  const { addAlert } = useNotifications();

  const checkAndAddAlerts = useCallback(
    (sensorData: SensorData | SensorData[]) => {
      return checkSensorThresholdsAndAddAlerts(sensorData, thresholds, addAlert);
    },
    [thresholds, addAlert]
  );

  return { checkAndAddAlerts };
}
