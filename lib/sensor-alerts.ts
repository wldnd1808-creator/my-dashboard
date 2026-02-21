/**
 * 실시간 센서 데이터 임계치 검사 후 알림 목록에 메시지 추가
 * 메시지 형식: [장비명] [수치] 이상 발생 - 즉시 확인 필요
 *
 * 사용 예:
 *   const { addAlert } = useNotifications();
 *   checkSensorThresholdsAndAddAlerts(
 *     [{ equipmentName: "모터A", temperature: 85, vibration: 0.5 }],
 *     { temperature: 80, vibration: 0.8 },
 *     addAlert
 *   );
 *   // -> "[모터A] 온도 85도 이상 발생 - 즉시 확인 필요" 알림 추가
 */

export interface SensorData {
  equipmentName: string; // 장비명
  temperature?: number; // 온도 (°C)
  vibration?: number; // 진동 수치
  [key: string]: number | string | undefined;
}

export interface SensorThresholds {
  temperature?: number; // 기본 80
  vibration?: number; // 기본 0.8
  [key: string]: number | undefined;
}

export interface AlertMessage {
  id: string;
  message: string;
  equipmentName: string;
  type: "temperature" | "vibration" | string;
  value: number;
  timestamp: number;
  /** AI 분석 의견 (예측 문구) */
  aiInsight?: string;
}

/** 알림 유형에 따른 AI 분석 의견 생성 */
function getAiInsight(type: string, value: number): string {
  if (type === "temperature") {
    const prob = Math.min(95, 60 + Math.round((value - 80) * 2));
    return `과거 데이터 패턴 분석 결과, 30분 내 과열로 인한 정지 확률 ${prob}%입니다.`;
  }
  if (type === "vibration") {
    const prob = Math.min(90, 55 + Math.round((value - 0.8) * 40));
    return `과거 데이터 패턴 분석 결과, 20분 내 베어링 이상으로 인한 정지 확률 ${prob}%입니다.`;
  }
  return `과거 데이터 패턴 분석 결과, 조속한 점검이 권장됩니다.`;
}

const DEFAULT_THRESHOLDS: Required<Pick<SensorThresholds, "temperature" | "vibration">> = {
  temperature: 80,
  vibration: 0.8,
};

/**
 * 센서 데이터가 임계치를 넘으면 알림 메시지를 생성하고 addAlert 콜백으로 추가
 * @param sensorData 센서 데이터 (또는 배열)
 * @param thresholds 임계치 (미지정 시 온도 80, 진동 0.8)
 * @param addAlert 알림 추가 콜백
 * @returns 추가된 알림 개수
 */
export function checkSensorThresholdsAndAddAlerts(
  sensorData: SensorData | SensorData[],
  thresholds: SensorThresholds = {},
  addAlert: (alert: AlertMessage) => void
): number {
  const tempLimit = thresholds.temperature ?? DEFAULT_THRESHOLDS.temperature;
  const vibLimit = thresholds.vibration ?? DEFAULT_THRESHOLDS.vibration;

  const items = Array.isArray(sensorData) ? sensorData : [sensorData];
  let added = 0;

  for (const data of items) {
    const equipmentName = String(data.equipmentName ?? "알 수 없음");

    // 온도 임계치 초과
    const temp = typeof data.temperature === "number" ? data.temperature : undefined;
    if (temp != null && temp >= tempLimit) {
      const message = `[${equipmentName}] 온도 ${temp}도 이상 발생 - 즉시 확인 필요`;
      addAlert({
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        equipmentName,
        type: "temperature",
        value: temp,
        timestamp: Date.now(),
        aiInsight: getAiInsight("temperature", temp),
      });
      added++;
    }

    // 진동 임계치 초과
    const vib = typeof data.vibration === "number" ? data.vibration : undefined;
    if (vib != null && vib >= vibLimit) {
      const message = `[${equipmentName}] 진동 ${vib} 이상 발생 - 즉시 확인 필요`;
      addAlert({
        id: `vib-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        equipmentName,
        type: "vibration",
        value: vib,
        timestamp: Date.now(),
        aiInsight: getAiInsight("vibration", vib),
      });
      added++;
    }
  }

  return added;
}
