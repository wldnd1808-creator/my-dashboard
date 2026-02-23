(function () {
  "use strict";

  // ── 로그인 ──
  const AUTH_KEY = "smart_factory_auth";
  const DEMO_USERS = { admin: "admin123", manager: "manager1", viewer: "viewer1" };

  function isLoggedIn() {
    try {
      return !!localStorage.getItem(AUTH_KEY);
    } catch (_) {
      return false;
    }
  }
  function setLoggedIn(userId) {
    localStorage.setItem(AUTH_KEY, userId);
  }
  function clearLogin() {
    localStorage.removeItem(AUTH_KEY);
  }

  function showLogin() {
    const loginEl = document.getElementById("loginScreen");
    const appEl = document.getElementById("appShell");
    if (loginEl) loginEl.classList.remove("hidden");
    if (appEl) appEl.classList.add("hidden");
  }
  function showDashboard() {
    const loginEl = document.getElementById("loginScreen");
    const appEl = document.getElementById("appShell");
    if (loginEl) loginEl.classList.add("hidden");
    if (appEl) appEl.classList.remove("hidden");
  }

  function initLogin() {
    const form = document.getElementById("loginForm");
    const errorEl = document.getElementById("loginError");
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const urlId = params.get("loginId");
    const urlPw = params.get("loginPw");
    if (urlId) form.loginId.value = urlId;
    if (urlPw) form.loginPw.value = urlPw;
    if (urlId && urlPw) {
      const expectedPw = DEMO_USERS[urlId.trim()];
      if (expectedPw && expectedPw === urlPw) {
        setLoggedIn(urlId.trim());
        showDashboard();
        initLogout();
        initDashboard();
        return;
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = (form.loginId?.value || "").trim();
      const pw = form.loginPw?.value || "";
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
      }
      const expectedPw = DEMO_USERS[id];
      if (!expectedPw || expectedPw !== pw) {
        if (errorEl) {
          errorEl.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
          errorEl.classList.remove("hidden");
        }
        return;
      }
      setLoggedIn(id);
      showDashboard();
      initLogout();
      initDashboard();
    });
  }

  function stopAIGuideInterval() {
    if (aiGuideInterval) {
      clearInterval(aiGuideInterval);
      aiGuideInterval = null;
    }
  }

  function initLogout() {
    const btn = document.getElementById("btnLogout");
    if (btn) {
      btn.addEventListener("click", () => {
        clearLogin();
        showLogin();
        stopRealtimeModelFlow();
        stopAIGuideInterval();
      });
    }
  }

  // ── Mock 데이터: 분석·예측 (전·동기간 비교용) ──
  const PREV_WEEK = { power: 3480, production: 810, energyPerProduct: 4.30 };
  const PREV_MONTH = { power: 3720, production: 780, energyPerProduct: 4.77 };

  // ── Mock 데이터: 공정별 전력·생산량·목표생산량 ──
  const PROCESS_DATA = [
    { process: "혼합", power: 420, production: 1200, target_production: 1500 },
    { process: "코팅", power: 580, production: 980, target_production: 1200 },
    { process: "건조", power: 720, production: 850, target_production: 1000 },
    { process: "소성", power: 1500, production: 820, target_production: 1500 },
    { process: "분쇄", power: 380, production: 1500, target_production: 1800 },
  ];

  // ── Mock 데이터: 최근 품질 불량 분석 ──
  const REJECTED_LOTS = [
    { lot: "LOT-20260205-001", recordCount: 1, recentTime: "02. 05. 오전 09:15", lithiumInput: 1.63, processTime: 69.9, humidity: 7.4, tankPressure: 95.1 },
    { lot: "LOT-20260205-002", recordCount: 1, recentTime: "02. 05. 오전 09:42", lithiumInput: 2.46, processTime: 73.0, humidity: 7.4, tankPressure: 106.7 },
    { lot: "LOT-20260204-098", recordCount: 1, recentTime: "02. 04. 오후 03:22", lithiumInput: 1.88, processTime: 71.2, humidity: 8.1, tankPressure: 102.3 },
    { lot: "LOT-20260204-095", recordCount: 1, recentTime: "02. 04. 오후 02:56", lithiumInput: 2.12, processTime: 68.5, humidity: 6.9, tankPressure: 98.4 },
    { lot: "LOT-20260204-089", recordCount: 1, recentTime: "02. 04. 오전 11:30", lithiumInput: 1.95, processTime: 72.1, humidity: 7.8, tankPressure: 104.2 },
    { lot: "LOT-20260203-156", recordCount: 1, recentTime: "02. 03. 오후 04:18", lithiumInput: 2.33, processTime: 70.4, humidity: 7.2, tankPressure: 99.8 },
    { lot: "LOT-20260203-142", recordCount: 1, recentTime: "02. 03. 오후 01:45", lithiumInput: 1.72, processTime: 74.2, humidity: 8.5, tankPressure: 108.1 },
    { lot: "LOT-20260202-201", recordCount: 1, recentTime: "02. 02. 오후 05:02", lithiumInput: 2.05, processTime: 69.8, humidity: 6.7, tankPressure: 93.5 },
    { lot: "LOT-20260202-198", recordCount: 1, recentTime: "02. 02. 오후 04:38", lithiumInput: 1.81, processTime: 71.5, humidity: 7.9, tankPressure: 101.2 },
    { lot: "LOT-20260201-087", recordCount: 1, recentTime: "02. 01. 오후 12:56", lithiumInput: 2.28, processTime: 72.8, humidity: 7.1, tankPressure: 105.6 },
  ];
  const DEFECT_VARS = [
    { name: "품질 불량(quality_defect)", pct: 100.0 },
    { name: "금속 불순물(metal_impurity)", pct: 22.7 },
    { name: "습도(humidity)", pct: 18.4 },
    { name: "리튬 투입량(lithium_input)", pct: 14.2 },
    { name: "공정 시간(process_time)", pct: 9.6 },
    { name: "탱크 압력(tank_pressure)", pct: 6.3 },
    { name: "입도(d50)", pct: 2.1 },
    { name: "소성 온도(sintering_temp)", pct: 1.5 },
    { name: "첨가제 비율(additive_ratio)", pct: 0.8 },
    { name: "코팅 두께(coating_thickness)", pct: 0.4 },
  ];
  const FDC_ALERTS = []; // 관리선 이탈 알림 (없으면 빈 배열)

  // ── 공지사항 (localStorage로 수정·추가·삭제 가능) ──
  const NOTICES_STORAGE_KEY = "smart_factory_notices";
  const NOTICES_DEFAULT = [
    {
      title: "중요 시스템 점검 안내",
      date: "2025.01.27",
      important: true,
      content: `안녕하세요. 스마트 팩토리 시스템 담당자입니다.

공정 에너지 최적화 대시보드 및 관련 시스템 점검을 아래와 같이 실시합니다. 점검 시간 동안 일시적으로 시스템 접속이 제한될 수 있사오니 업무에 참고 부탁드립니다.

【 점검 일시 】
2025년 1월 28일(화) 02:00 ~ 06:00 (4시간)

【 점검 내용 】
- 서버 보안 패치 적용
- 데이터베이스 백업 및 최적화
- API 응답 속도 개선

【 영향 범위 】
점검 시간 동안 대시보드 로그인 및 실시간 데이터 조회가 불가할 수 있습니다.

문의사항은 시스템 관리자에게 연락 부탁드립니다.`,
    },
    {
      title: "신규 기능 업데이트",
      date: "2025.01.25",
      important: false,
      content: `스마트 팩토리 대시보드에 새로운 기능이 추가되었습니다.

【 추가된 기능 】

1. LOT별 합격·불합격 현황
   - LOT 단위 품질 현황을 한 화면에서 확인할 수 있습니다.

2. 공지사항 & 커뮤니티
   - 오른쪽 사이드바에서 공지사항과 커뮤니티 글을 확인할 수 있습니다.
   - 클릭 시 상세 내용을 확인하실 수 있습니다.

3. AI 의사결정 가이드 개선
   - 전기 요금대별 가동 최적화 제안이 강화되었습니다.

추가 문의는 개발팀으로 연락 부탁드립니다.`,
    },
    {
      title: "공정 안전 수칙 변경",
      date: "2025.01.20",
      important: false,
      content: `공정 안전 수칙이 다음과 같이 변경되었습니다.

【 변경 사항 (2025.01.20 시행) 】

1. 소성 공정 작업자 보호구 착용 의무화
   - 고온 구역 진입 시 반드시 내열복 및 안전화 착용

2. 에너지 설비 점검 주기 조정
   - 기존 월 1회 → 2주 1회로 변경

3. 비상 정지 버튼 위치 안내
   - 각 공정별 비상 정지 버튼 위치가 변경되었습니다.
   - 현장 교육 참석 필수 (1/22~1/24)

자세한 내용은 현장 게시판 및 안전 담당자에게 문의하시기 바랍니다.`,
    },
  ];

  function getNotices() {
    try {
      const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(NOTICES_DEFAULT));
  }

  function saveNotices(notices) {
    try {
      localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
    } catch (_) {}
  }

  const COMMUNITY_POSTS = [
    {
      title: "라인 A 온도 이상 확인",
      time: "10:30",
      author: "김철수",
      content: `라인 A 소성로 온도가 설정값 대비 약 15°C 높게 유지되고 있습니다.

현재: 892°C / 설정: 877°C

조치 완료: 오전 10:25에 가스 밸브 조정 및 냉각 팬 점검 진행했습니다. 10분 후 재측정 예정입니다.

추가 이상 시 즉시 보고하겠습니다.`,
    },
    {
      title: "품질 검사 완료 보고",
      time: "10:25",
      author: "이영희",
      content: `LOT-20260205-001~010 품질 검사 완료했습니다.

【 결과 요약 】
- 합격: 9 LOT
- 불합격: 1 LOT (LOT-20260205-007, 금속 불순물 기준 초과)

불합격 LOT은 재공정 처리 예정입니다.
검사 기록은 품질 시스템에 등록 완료했습니다.`,
    },
    {
      title: "설비 점검 요청",
      time: "10:15",
      author: "박민수",
      content: `코팅 공정 설비 #3번에서 이상 진동음이 감지되었습니다.

【 상세 】
- 발생 시각: 오전 10:10경
- 위치: 코팅 라인 3호기 드럼 모터
- 증상: 주기적 찌릿 소리 (약 2초 간격)

운전 중단 후 점검 요청드립니다.
긴급도: 보통 (당일 점검 권장)`,
    },
  ];

  // ── Mock 데이터: LOT별 합격·불합격 ──
  // { lot, passed, recordCount, recentTime }
  function generateLotPassFailData() {
    const lots = [];
    const times = ["오전 09:06", "오전 10:15", "오전 11:22", "오후 01:30", "오후 02:45", "오후 03:18", "오후 04:52"];
    let seq = 8775;
    for (let d = 1; d <= 28; d++) {
      const dateStr = "02. " + String(d).padStart(2, "0") + ".";
      const yyyymmdd = "202602" + String(d).padStart(2, "0");
      for (let i = 0; i < 5; i++) {
        seq++;
        const passed = Math.random() > 0.09;
        lots.push({
          lot: "LOT-" + yyyymmdd + "-" + String(seq).padStart(5, "0"),
          passed,
          recordCount: 1,
          recentTime: dateStr + " " + times[(d + i) % times.length],
        });
      }
    }
    return lots;
  }
  const LOT_PASS_FAIL_LOTS = generateLotPassFailData();

  // ── Mock 데이터: 공정 실시간 모델 (LOT 위치) ──
  const FLOW_STAGES = [
    "원재료 투입",
    "정밀 계량 및 혼합",
    "충진",
    "소성",
    "조분쇄",
    "전자석 달칠",
    "미분쇄",
    "체거름",
    "포장",
  ];
  // { lotId, stageIndex (0~8), passed }
  const REALTIME_LOTS_INIT = [
    { lotId: 55, stageIndex: 0, passed: true },
    { lotId: 56, stageIndex: 0, passed: false },
    { lotId: 57, stageIndex: 1, passed: true },
    { lotId: 58, stageIndex: 1, passed: true },
    { lotId: 59, stageIndex: 1, passed: false },
    { lotId: 60, stageIndex: 2, passed: false },
    { lotId: 61, stageIndex: 2, passed: true },
    { lotId: 62, stageIndex: 3, passed: true },
    { lotId: 63, stageIndex: 4, passed: true },
    { lotId: 64, stageIndex: 5, passed: true },
    { lotId: 65, stageIndex: 6, passed: false },
    { lotId: 66, stageIndex: 7, passed: true },
  ];
  let realtimeLotsState = JSON.parse(JSON.stringify(REALTIME_LOTS_INIT));
  let nextLotId = 67;
  let realtimeModelInterval = null;
  let aiGuideInterval = null;

  // ── Mock 데이터: 공정 현황 (일별 생산량·불량률) ──
  // { "YYYY-MM-DD": { production: kg, defectRate: % } }
  const PROCESS_STATUS_BY_DAY = {
    "2026-02-01": { production: 412.5, defectRate: 3.2 },
    "2026-02-02": { production: 398.7, defectRate: 4.8 },
    "2026-02-03": { production: 425.1, defectRate: 2.1 },
    "2026-02-04": { production: 387.2, defectRate: 6.5 },
    "2026-02-05": { production: 435.8, defectRate: 1.9 },
    "2026-02-06": { production: 401.3, defectRate: 5.4 },
    "2026-02-07": { production: 418.6, defectRate: 3.7 },
    "2026-02-08": { production: 356.2, defectRate: 9.2 },
    "2026-02-09": { production: 198.4, defectRate: 7.8 },
    "2026-02-10": { production: 442.9, defectRate: 2.5 },
    "2026-02-11": { production: 431.5, defectRate: 3.1 },
    "2026-02-12": { production: 408.2, defectRate: 4.6 },
    "2026-02-13": { production: 395.8, defectRate: 5.9 },
    "2026-02-14": { production: 422.3, defectRate: 2.8 },
    "2026-02-15": { production: 0, defectRate: 0 },
    "2026-02-16": { production: 0, defectRate: 0 },
    "2026-02-17": { production: 438.1, defectRate: 2.4 },
    "2026-02-18": { production: 413.7, defectRate: 4.2 },
    "2026-02-19": { production: 389.4, defectRate: 5.7 },
    "2026-02-20": { production: 427.6, defectRate: 3.3 },
    "2026-02-21": { production: 405.9, defectRate: 4.9 },
    "2026-02-22": { production: 418.2, defectRate: 2.6 },
    "2026-02-23": { production: 0, defectRate: 0 },
    "2026-02-24": { production: 392.5, defectRate: 6.1 },
    "2026-02-25": { production: 441.2, defectRate: 1.7 },
    "2026-02-26": { production: 416.8, defectRate: 3.9 },
    "2026-02-27": { production: 403.4, defectRate: 5.2 },
    "2026-02-28": { production: 429.5, defectRate: 2.9 },
  };

  // 요금제 시간 데이터 (한국 TOU 기준, JSON)
  const TARIFF_SCHEDULE = {
    periods: [
      { start: { hour: 0, minute: 0 }, end: { hour: 6, minute: 0 }, rate: 85, label: "야간", isPeak: false },
      { start: { hour: 6, minute: 0 }, end: { hour: 9, minute: 0 }, rate: 95, label: "경부하", isPeak: false },
      { start: { hour: 9, minute: 0 }, end: { hour: 12, minute: 0 }, rate: 180, label: "중간부하", isPeak: false },
      { start: { hour: 12, minute: 0 }, end: { hour: 17, minute: 0 }, rate: 220, label: "최대부하", isPeak: true },
      { start: { hour: 17, minute: 0 }, end: { hour: 22, minute: 0 }, rate: 250, label: "최대부하", isPeak: true },
      { start: { hour: 22, minute: 0 }, end: { hour: 24, minute: 0 }, rate: 95, label: "경부하", isPeak: false },
    ],
    peakStartTimes: [
      { hour: 12, minute: 0 },
      { hour: 17, minute: 0 },
    ],
  };

  const TARIFF_BY_HOUR = [
    { hour: 0, rate: 85, label: "야간" },
    { hour: 6, rate: 95, label: "경부하" },
    { hour: 9, rate: 180, label: "중간부하" },
    { hour: 12, rate: 220, label: "최대부하" },
    { hour: 17, rate: 250, label: "최대부하" },
    { hour: 22, rate: 95, label: "경부하" },
    { hour: 23, rate: 85, label: "야간" },
  ];

  const el = (id) => document.getElementById(id);

  let processEnergyChart = null;
  let tariffChart = null;
  let carbonChart = null;

  function getTariffForHour(h) {
    let rate = 95;
    for (let i = TARIFF_BY_HOUR.length - 1; i >= 0; i--) {
      if (h >= TARIFF_BY_HOUR[i].hour) {
        rate = TARIFF_BY_HOUR[i].rate;
        break;
      }
    }
    return rate;
  }

  function getTariffLabel(h) {
    if (h >= 22 || h < 6) return "야간";
    if (h >= 17 && h < 22) return "최대부하";
    if (h >= 12 && h < 17) return "최대부하";
    if (h >= 9 && h < 12) return "중간부하";
    return "경부하";
  }

  function updateCurrentTimeAndTariff() {
    const now = new Date();
    const h = now.getHours();
    const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const timeEl = el("currentTime");
    const badgeEl = el("tariffBadge");
    if (timeEl) timeEl.textContent = timeStr;
    if (badgeEl) {
      badgeEl.textContent = getTariffLabel(h) + " (현재)";
      badgeEl.className = "tariff-badge";
      if (h >= 12 && h < 22) badgeEl.classList.add("peak");
      else if (h >= 22 || h < 6) badgeEl.classList.add("off-peak");
    }
  }

  // ── AI 의사결정 가이드 생성 (실시간 갱신) ──
  function getVariedProcessDataForAI() {
    const m = new Date().getMinutes();
    const seed = Math.floor(m / 5) * 5;
    return PROCESS_DATA.map((p, i) => {
      const vary = 0.02 * Math.sin((seed + i) * 1.3) * p.production;
      return { ...p, production: Math.round(p.production + vary) };
    });
  }

  function generateAISuggestions() {
    const now = new Date();
    const h = now.getHours();
    const currentTariff = getTariffForHour(h);
    const isPeak = h >= 12 && h < 22;
    const variedData = getVariedProcessDataForAI();
    const suggestions = [];

    // 목표 대비 20% 이상 뒤처진 공정 → 에너지 가속화 제안
    const behindProcesses = variedData.filter((p) => {
      const target = p.target_production ?? p.production;
      return p.production < target * 0.8;
    });
    if (behindProcesses.length > 0) {
      const names = behindProcesses.map((p) => p.process).join(", ");
      suggestions.push({
        icon: "🚀",
        title: "생산량 목표 미달 공정",
        desc: `${names} 공정이 목표 대비 20% 이상 뒤처져 있습니다. 에너지 투입을 늘려 생산 속도를 가속화하세요.`,
        savings: "",
        impact: "high-impact",
      });
    }

    // 핵심 제안: 소성 공정 가동 미루기
    if (isPeak) {
      const delayHours = 2;
      const savings = 15;
      suggestions.push({
        icon: "⚡",
        title: "소성 공정 가동 시프트 제안",
        desc: `현재 전기 요금이 비싼 시간대입니다. 소성 공정 가동을 ${delayHours}시간 뒤로 미루면 비용이 약 ${savings}% 절감됩니다.`,
        savings: `예상 절감: 일 약 180만원 (소성 공정 기준)`,
        impact: "high-impact",
      });
    }

    // 에너지 효율 가장 낮은 공정 개선
    const sorted = [...variedData]
      .map((p) => ({ ...p, perProduct: p.power / Math.max(p.production, 1) }))
      .sort((a, b) => b.perProduct - a.perProduct);
    const worst = sorted[0];
    if (worst && worst.perProduct > 1.5) {
      suggestions.push({
        icon: "📊",
        title: `${worst.process} 공정 에너지 효율 개선`,
        desc: `제품 1개당 ${worst.perProduct.toFixed(2)} kWh로 공정 중 가장 높습니다. 설비 점검 또는 배치 최적화를 권장합니다.`,
        savings: `목표: kWh/개 10% 감소 시 연 2.1억원 절감`,
        impact: "medium-impact",
      });
    }

    // 야간 가동 권장
    if (h >= 9 && h < 17) {
      suggestions.push({
        icon: "🌙",
        title: "야간 시간대 가동 검토",
        desc: "22시~06시 야간 요금(85원/kWh)이 최대부하 대비 66% 저렴합니다. 단계적 야간 이전 검토를 권장합니다.",
        savings: "예상: 야간 30% 이전 시 연 8천만원 절감",
        impact: "medium-impact",
      });
    }

    // 탄소배출
    suggestions.push({
      icon: "🌱",
      title: "탄소배출 모니터링 정상",
      desc: "현재 공정별 탄소배출이 ESG 목표 이내입니다. 재생에너지 구매 계약(REC) 확대 시 추가 감축 가능합니다.",
      savings: "REC 20% 적용 시 tCO₂e 15% 추가 감축",
      impact: "medium-impact",
    });

    if (suggestions.length === 0) {
      suggestions.push({
        icon: "✅",
        title: "현재 최적 운영 중",
        desc: "현재 요금대와 공정 가동이 양호한 상태입니다. 지속 모니터링을 유지해 주세요.",
        savings: "",
        impact: "high-impact",
      });
    }

    return suggestions;
  }

  function renderAISuggestions() {
    const container = el("aiSuggestions");
    if (!container) return;
    const suggestions = generateAISuggestions();
    const lastUpdateEl = el("aiLastUpdate");
    if (lastUpdateEl) lastUpdateEl.textContent = "마지막 갱신: " + new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    container.innerHTML = suggestions
      .map(
        (s) => `
      <div class="ai-suggestion ${s.impact || ""}">
        <span class="ai-suggestion-icon" aria-hidden="true">${s.icon}</span>
        <div class="ai-suggestion-content">
          <div class="ai-suggestion-title">${escapeHtml(s.title)}</div>
          <div class="ai-suggestion-desc">${escapeHtml(s.desc)}</div>
          ${s.savings ? `<div class="ai-suggestion-savings">${escapeHtml(s.savings)}</div>` : ""}
        </div>
      </div>
    `
      )
      .join("");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatChange(pct) {
    const s = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
    return s;
  }

  let heatmapState = { costData: [], globalMax: 0 };
  const CARBON_FACTOR = 0.00042; // kgCO2e per kWh (한국 전력)

  function renderHeatmap() {
    const wrap = el("heatmapWrap");
    if (!wrap) return;
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const rateByHour = hours.map((h) => getTariffForHour(h));
    let globalMax = 0;
    const costData = PROCESS_DATA.map((p) => {
      return hours.map((h) => {
        const share = p.power / 24;
        const cost = share * rateByHour[h];
        if (cost > globalMax) globalMax = cost;
        return cost;
      });
    });
    heatmapState = { costData, globalMax };
    wrap.innerHTML = `
      <div class="heatmap-y-labels">
        ${PROCESS_DATA.map((p) => `<span>${escapeHtml(p.process)}</span>`).join("")}
      </div>
      <div class="heatmap-grid">
        ${costData.map((row, pi) => `
          <div class="heatmap-row">
            ${row.map((cost, hi) => {
              const pct = globalMax > 0 ? (cost / globalMax) * 100 : 0;
              const opacity = 0.2 + (pct / 100) * 0.6;
              return `<div class="heatmap-cell" data-process-index="${pi}" data-hour="${hi}" style="background: rgba(57, 197, 207, ${opacity});" title="약 ${Math.round(cost).toLocaleString()}원 · 클릭하면 상세 분석"></div>`;
            }).join("")}
          </div>
        `).join("")}
      </div>
      <div class="heatmap-x-labels">
        ${hours.map((h) => `<span>${h % 6 === 0 ? h + "시" : ""}</span>`).join("")}
      </div>
    `;
  }

  function openHeatmapDetailModal(processIndex, hour) {
    const p = PROCESS_DATA[processIndex];
    const cost = heatmapState.costData[processIndex][hour];
    const powerPerHour = p.power / 24;
    const carbonKg = powerPerHour * CARBON_FACTOR;
    const carbonT = carbonKg / 1000;
    const pct = heatmapState.globalMax > 0 ? (cost / heatmapState.globalMax) * 100 : 0;
    const isHighCost = pct >= 70;
    const tariffLabel = getTariffLabel(hour);

    const modal = el("heatmapDetailModal");
    const titleEl = el("heatmapDetailTitle");
    const costEl = el("heatmapDetailCost");
    const carbonEl = el("heatmapDetailCarbon");
    const suggestWrap = el("heatmapDetailSuggest");
    const suggestText = el("heatmapDetailSuggestText");
    if (!modal || !titleEl) return;

    titleEl.textContent = `${p.process} 공정 · ${hour}시 (${tariffLabel})`;
    costEl.textContent = Math.round(cost).toLocaleString() + " 원";
    carbonEl.textContent = carbonT.toFixed(4) + " tCO₂e";

    if (isHighCost) {
      suggestWrap.classList.remove("hidden");
      suggestText.innerHTML = `<span class="heatmap-warn-icon" aria-hidden="true">⚠</span> 해당 시간대는 고비용 구간입니다. 야간·경부하 시간대로 가동을 이동하면 15~25% 비용 절감이 예상됩니다.`;
    } else {
      suggestWrap.classList.add("hidden");
    }
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeHeatmapDetailModal() {
    const modal = el("heatmapDetailModal");
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }


  function renderSavingsEffect() {
    const grid = el("savingsGrid");
    if (!grid) return;
    const sorted = [...PROCESS_DATA].map((p) => ({
      ...p,
      perProduct: p.power / Math.max(p.production, 1),
    })).sort((a, b) => b.perProduct - a.perProduct);
    const worst = sorted[0];
    const carbonFactor = 0.00042;
    const avgRate = 150;
    const savings10 = Math.round(worst.power * 0.1 * avgRate * 365 / 10000);
    const carbon10 = ((worst.power * 0.1 * carbonFactor) * 365 / 1000).toFixed(1);
    grid.innerHTML = `
      <div class="savings-card">
        <div class="savings-title">${escapeHtml(worst.process)} 공정 10% 개선 시</div>
        <div class="savings-value">연간 약 <strong>${savings10.toLocaleString()}</strong>만원 절감</div>
        <div class="savings-carbon">탄소 ${carbon10} tCO₂e 감축</div>
      </div>
      <div class="savings-card">
        <div class="savings-title">최악 공정(kWh/개 ↑) 야간 전환 시</div>
        <div class="savings-value">예상 <strong>15~20%</strong> 비용 절감</div>
        <div class="savings-carbon">피크 시간대 가동 축소 권장</div>
      </div>
      <div class="savings-card">
        <div class="savings-title">전 공정 평균 5% 효율화 시</div>
        <div class="savings-value">연간 약 <strong>2.1</strong>억원 절감</div>
        <div class="savings-carbon">ESG 목표 상향 달성</div>
      </div>
    `;
  }

  function renderAnalysisPrediction(totalPower, totalProduction, energyPerProduct) {
    const weekPowerPct = ((totalPower - PREV_WEEK.power) / PREV_WEEK.power) * 100;
    const weekProdPct = ((totalProduction - PREV_WEEK.production) / PREV_WEEK.production) * 100;
    const weekEffPct = ((energyPerProduct - PREV_WEEK.energyPerProduct) / PREV_WEEK.energyPerProduct) * 100;
    const monthPowerPct = ((totalPower - PREV_MONTH.power) / PREV_MONTH.power) * 100;
    const monthProdPct = ((totalProduction - PREV_MONTH.production) / PREV_MONTH.production) * 100;
    const monthEffPct = ((energyPerProduct - PREV_MONTH.energyPerProduct) / PREV_MONTH.energyPerProduct) * 100;

    const setVal = (id, text, isGood) => {
      const elm = el(id);
      if (!elm) return;
      elm.textContent = text;
      elm.className = "analysis-val";
      if (text.includes("+") && !isGood) elm.classList.add("up-bad");
      else if (text.includes("-") && isGood) elm.classList.add("down-good");
      else if (text.includes("+") && isGood) elm.classList.add("up-good");
      else if (text.includes("-") && !isGood) elm.classList.add("down-bad");
    };

    setVal("compWeekPower", formatChange(weekPowerPct), false);
    setVal("compWeekProd", formatChange(weekProdPct), true);
    setVal("compWeekEff", formatChange(weekEffPct), false);
    setVal("compMonthPower", formatChange(monthPowerPct), false);
    setVal("compMonthProd", formatChange(monthProdPct), true);
    setVal("compMonthEff", formatChange(monthEffPct), false);

    const avgRate = 135;
    const predictPower = Math.round(totalPower * 1.02);
    const predictProd = Math.round(totalProduction * 1.03);
    const predictCost = Math.round((predictPower * avgRate) / 1000);

    el("predictPower").textContent = predictPower.toLocaleString() + " kWh";
    el("predictPower").className = "analysis-val";
    el("predictProd").textContent = predictProd.toLocaleString() + "개";
    el("predictProd").className = "analysis-val";
    el("predictCost").textContent = "약 " + predictCost.toLocaleString() + "천원";
    el("predictCost").className = "analysis-val";
  }

  function loadData() {
    const totalPower = PROCESS_DATA.reduce((a, p) => a + p.power, 0);
    const totalProduction = Math.min(...PROCESS_DATA.map((p) => p.production));
    const energyPerProduct = totalPower / Math.max(totalProduction, 1);
    const carbonFactor = 0.00042; // kgCO2e per kWh (한국 전력)
    const carbonEmission = (totalPower * carbonFactor) / 1000;

    const bottleneckIdx = PROCESS_DATA.reduce((i, p, j) => (p.production < PROCESS_DATA[i].production ? j : i), 0);
    const bottleneckTarget = PROCESS_DATA[bottleneckIdx].target_production ?? PROCESS_DATA[bottleneckIdx].production;
    el("totalPower").textContent = totalPower.toLocaleString();
    el("totalProduction").innerHTML = `<span class="prod-current">${totalProduction.toLocaleString()}</span> <span class="prod-sep">/</span> <span class="prod-target">${bottleneckTarget.toLocaleString()}</span>`;
    el("energyPerProduct").textContent = (totalPower / totalProduction).toFixed(2);
    el("carbonEmission").textContent = carbonEmission.toFixed(2);

    const withEff = PROCESS_DATA.map((p) => ({
      ...p,
      perProduct: p.power / Math.max(p.production, 1),
    }));
    const sorted = [...withEff].sort((a, b) => a.perProduct - b.perProduct);
    const bestIdx = PROCESS_DATA.indexOf(sorted[0]);
    const worstIdx = PROCESS_DATA.indexOf(sorted[sorted.length - 1]);

    const getGrade = (perProduct) => {
      const maxP = Math.max(...withEff.map((x) => x.perProduct));
      const minP = Math.min(...withEff.map((x) => x.perProduct));
      const range = maxP - minP || 1;
      const norm = (perProduct - minP) / range;
      if (norm <= 0.33) return { grade: "A", cls: "grade-a" };
      if (norm <= 0.66) return { grade: "B", cls: "grade-b" };
      return { grade: "C", cls: "grade-c" };
    };

    const rowsSimple = withEff.map((p) => {
      const carbon = (p.power * carbonFactor).toFixed(1);
      const target = p.target_production ?? p.production;
      return `<tr>
        <td><strong>${escapeHtml(p.process)}</strong></td>
        <td>${p.power.toLocaleString()}</td>
        <td><span class="prod-current">${p.production.toLocaleString()}</span> <span class="prod-sep">/</span> <span class="prod-target">${target.toLocaleString()}</span></td>
        <td>${p.perProduct.toFixed(2)}</td>
        <td>${carbon}</td>
      </tr>`;
    });
    const rowsVisual = withEff.map((p, i) => {
      const carbon = (p.power * carbonFactor).toFixed(1);
      const target = p.target_production ?? p.production;
      const { grade, cls } = getGrade(p.perProduct);
      const rowClass = i === bestIdx ? "row-best" : i === worstIdx ? "row-worst" : "";
      const badge = i === bestIdx ? " <span class=\"process-badge best\">최선</span>" : i === worstIdx ? " <span class=\"process-badge worst\">최악</span>" : "";
      return `<tr class="${rowClass}">
        <td><strong>${escapeHtml(p.process)}</strong>${badge}</td>
        <td><span class="energy-grade ${cls}">${grade}</span></td>
        <td>${p.power.toLocaleString()}</td>
        <td><span class="prod-current">${p.production.toLocaleString()}</span> <span class="prod-sep">/</span> <span class="prod-target">${target.toLocaleString()}</span></td>
        <td>${p.perProduct.toFixed(2)}</td>
        <td>${carbon}</td>
      </tr>`;
    });
    el("processTableBody").innerHTML = rowsSimple.join("");
    const visualTbody = el("processTableBodyVisual");
    if (visualTbody) visualTbody.innerHTML = rowsVisual.join("");

    renderHeatmap();
    renderSavingsEffect();
    updateProcessEnergyChart();
    updateTariffChart();
    updateCarbonChart();
    renderAnalysisPrediction(totalPower, totalProduction, energyPerProduct);
    renderAISuggestions();
    renderQualityDefect();
    renderLotPassFail();
    renderRightSidebar();
    renderProcessCalendar();
    renderRealtimeModel();
  }

  function openDetailModal(article, type) {
    const modal = el("detailModal");
    const titleEl = el("detailModalTitle");
    const metaEl = el("detailModalMeta");
    const bodyEl = el("detailModalBody");
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.textContent = article.title;
    titleEl.className = "detail-modal-title" + (article.important ? " important" : "");
    if (type === "notice") {
      metaEl.textContent = article.date;
      metaEl.style.display = "";
    } else {
      metaEl.textContent = article.time + " · " + article.author;
      metaEl.style.display = "";
    }
    bodyEl.innerHTML = "<pre class=\"detail-modal-pre\">" + escapeHtml(article.content || "") + "</pre>";
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeDetailModal() {
    const modal = el("detailModal");
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  function renderRightSidebar() {
    const notices = getNotices();
    el("noticeList").innerHTML = notices.map(
      (n, i) => `
      <li class="notice-list-item" data-type="notice" data-index="${i}" tabindex="0" role="button">
        <div class="notice-item">
          <div class="notice-item-content">
            ${n.tag ? `<span class="notice-item-tag">${escapeHtml(n.tag)}</span>` : ""}
            <div class="notice-item-title ${n.important ? "important" : ""}">${escapeHtml(n.title)}</div>
            <div class="notice-item-date">${escapeHtml(n.date)}</div>
          </div>
          <div class="notice-item-actions">
            <button type="button" class="btn-notice-edit" data-index="${i}" aria-label="수정">✎</button>
            <button type="button" class="btn-notice-delete" data-index="${i}" aria-label="삭제">🗑</button>
          </div>
        </div>
      </li>
    `
    ).join("");
    el("communityList").innerHTML = COMMUNITY_POSTS.map(
      (c, i) => `
      <li class="community-list-item" data-type="community" data-index="${i}" tabindex="0" role="button">
        <div class="community-item">
          <div class="community-item-title">${escapeHtml(c.title)}</div>
          <div class="community-item-meta">${escapeHtml(c.time)} · ${escapeHtml(c.author)}</div>
        </div>
      </li>
    `
    ).join("");
  }

  function initDetailModalListeners() {
    el("noticeList")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".btn-notice-edit");
      const deleteBtn = e.target.closest(".btn-notice-delete");
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        openNoticeEditModal(parseInt(editBtn.dataset.index, 10));
        return;
      }
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const i = parseInt(deleteBtn.dataset.index, 10);
        if (!isNaN(i) && confirm("이 공지를 삭제하시겠습니까?")) {
          const notices = getNotices();
          notices.splice(i, 1);
          saveNotices(notices);
          renderRightSidebar();
        }
        return;
      }
      const li = e.target.closest(".notice-list-item");
      if (!li || e.target.closest(".notice-item-actions")) return;
      const i = parseInt(li.dataset.index, 10);
      const notices = getNotices();
      if (!isNaN(i) && notices[i]) openDetailModal(notices[i], "notice");
    });
    el("communityList")?.addEventListener("click", (e) => {
      const li = e.target.closest(".community-list-item");
      if (!li) return;
      const i = parseInt(li.dataset.index, 10);
      if (!isNaN(i) && COMMUNITY_POSTS[i]) openDetailModal(COMMUNITY_POSTS[i], "community");
    });
    el("noticeList")?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const li = e.target.closest(".notice-list-item");
      if (!li) return;
      e.preventDefault();
      const i = parseInt(li.dataset.index, 10);
      const notices = getNotices();
      if (!isNaN(i) && notices[i]) openDetailModal(notices[i], "notice");
    });
    el("communityList")?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const li = e.target.closest(".community-list-item");
      if (!li) return;
      e.preventDefault();
      const i = parseInt(li.dataset.index, 10);
      if (!isNaN(i) && COMMUNITY_POSTS[i]) openDetailModal(COMMUNITY_POSTS[i], "community");
    });
    el("detailModalClose")?.addEventListener("click", closeDetailModal);
    el("detailModalBackdrop")?.addEventListener("click", closeDetailModal);
    el("heatmapDetailModalClose")?.addEventListener("click", closeHeatmapDetailModal);
    el("heatmapDetailModalBackdrop")?.addEventListener("click", closeHeatmapDetailModal);
    el("heatmapWrap")?.addEventListener("click", (e) => {
      const cell = e.target.closest(".heatmap-cell");
      if (!cell) return;
      const pi = parseInt(cell.dataset.processIndex, 10);
      const hi = parseInt(cell.dataset.hour, 10);
      if (isNaN(pi) || isNaN(hi)) return;
      openHeatmapDetailModal(pi, hi);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const aiAlert = el("aiAlertPopup");
        if (aiAlert && !aiAlert.classList.contains("hidden")) { onAIAlertDismiss(); return; }
        const editModal = el("noticeEditModal");
        if (editModal && !editModal.classList.contains("hidden")) closeNoticeEditModal();
        else {
          const heatmapModal = el("heatmapDetailModal");
          if (heatmapModal && !heatmapModal.classList.contains("hidden")) closeHeatmapDetailModal();
          else {
            const modal = el("detailModal");
            if (modal && !modal.classList.contains("hidden")) closeDetailModal();
          }
        }
      }
    });
  }

  function renderLotPassFail() {
    el("lotPassCount").textContent = "1120";
    el("lotFailCount").textContent = "105";
    el("lotPassFailBody").innerHTML = LOT_PASS_FAIL_LOTS.map(
      (l) => `
      <tr>
        <td><code>${escapeHtml(l.lot)}</code></td>
        <td><span class="lot-status-badge ${l.passed ? "pass" : "fail"}">${l.passed ? "합격" : "불합격"}</span></td>
        <td>${l.recordCount}</td>
        <td>${escapeHtml(l.recentTime)}</td>
      </tr>
    `
    ).join("");
  }

  function renderQualityDefect() {
    el("rejectedLotCount").textContent = REJECTED_LOTS.length + "건";
    el("rejectedLotBody").innerHTML = REJECTED_LOTS.map(
      (r) => `
      <tr>
        <td><code>${escapeHtml(r.lot)}</code></td>
        <td>${r.recordCount}</td>
        <td>${escapeHtml(r.recentTime)}</td>
        <td>${r.lithiumInput}</td>
        <td>${r.processTime}</td>
        <td>${r.humidity}</td>
        <td>${r.tankPressure}</td>
      </tr>
    `
    ).join("");

    el("defectVarsList").innerHTML = DEFECT_VARS.map(
      (v, i) => `<li><span>${i + 1}. ${escapeHtml(v.name)}</span><span class="var-pct">${v.pct}%</span></li>`
    ).join("");

    el("fdcAlertCount").textContent = FDC_ALERTS.length + "건";
    const fdcEl = el("fdcAlerts");
    if (FDC_ALERTS.length === 0) {
      fdcEl.innerHTML = '<p class="empty">현재 관리선 이탈 알림이 없습니다.</p>';
      fdcEl.classList.add("empty");
    } else {
      fdcEl.classList.remove("empty");
      fdcEl.innerHTML = FDC_ALERTS.map(
        (a) => `<div class="fdc-alert-item">${escapeHtml(a.message || a)}</div>`
      ).join("");
    }
  }

  function updateProcessEnergyChart() {
    const ctx = document.getElementById("processEnergyChart");
    if (!ctx) return;
    if (processEnergyChart) processEnergyChart.destroy();

    const labels = PROCESS_DATA.map((p) => p.process);
    const powerData = PROCESS_DATA.map((p) => p.power);
    const productionData = PROCESS_DATA.map((p) => p.production);
    const perProductData = PROCESS_DATA.map((p) => (p.power / Math.max(p.production, 1)).toFixed(2));

    processEnergyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "전력 소모 (kWh)",
            data: powerData,
            backgroundColor: "rgba(57, 197, 207, 0.6)",
            borderColor: "rgb(57, 197, 207)",
            borderWidth: 1,
            yAxisID: "y",
          },
          {
            label: "생산량 (개)",
            data: productionData,
            backgroundColor: "rgba(86, 211, 100, 0.5)",
            borderColor: "rgb(86, 211, 100)",
            borderWidth: 1,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#e6edf3" } },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const i = items[0]?.dataIndex;
                if (i != null && perProductData[i])
                  return ["제품 1개당 에너지: " + perProductData[i] + " kWh/개"];
                return [];
              },
            },
          },
        },
        scales: {
          x: { ticks: { color: "#8b949e" }, grid: { display: false } },
          y: {
            type: "linear",
            position: "left",
            title: { display: true, text: "전력 (kWh)", color: "#8b949e" },
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
          },
          y1: {
            type: "linear",
            position: "right",
            title: { display: true, text: "생산량 (개)", color: "#8b949e" },
            ticks: { color: "#8b949e" },
            grid: { display: false },
          },
        },
      },
    });
  }

  function updateTariffChart() {
    const ctx = document.getElementById("tariffChart");
    if (!ctx) return;
    if (tariffChart) tariffChart.destroy();

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const rates = hours.map((h) => getTariffForHour(h));

    tariffChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: hours.map((h) => h + "시"),
        datasets: [
          {
            label: "전기 요금 (원/kWh)",
            data: rates,
            borderColor: "rgb(210, 153, 34)",
            backgroundColor: "rgba(210, 153, 34, 0.15)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#e6edf3" } },
        },
        scales: {
          x: { ticks: { color: "#8b949e" }, grid: { color: "#2d3748" } },
          y: { ticks: { color: "#8b949e" }, grid: { color: "#2d3748" } },
        },
      },
    });
  }

  function updateCarbonChart() {
    const ctx = document.getElementById("carbonChart");
    if (!ctx) return;
    if (carbonChart) carbonChart.destroy();

    const carbonFactor = 0.00042;
    const labels = PROCESS_DATA.map((p) => p.process);
    const carbonData = PROCESS_DATA.map((p) => (p.power * carbonFactor).toFixed(1));

    carbonChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: carbonData,
            backgroundColor: [
              "rgba(57, 197, 207, 0.7)",
              "rgba(86, 211, 100, 0.7)",
              "rgba(163, 113, 247, 0.7)",
              "rgba(248, 81, 73, 0.6)",
              "rgba(210, 153, 34, 0.7)",
            ],
            borderColor: "#141b23",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: "#e6edf3" } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + parseFloat(b), 0);
                const pct = ((parseFloat(ctx.raw) / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.raw} kgCO₂e (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  el("btnRefresh").addEventListener("click", () => {
    loadData();
    updateCurrentTimeAndTariff();
  });

  // ── 왼쪽 사이드바 페이지 전환 ──
  const PAGE_CONFIG = {
    energy: {
      title: "공정 에너지 최적화 & 탄소배출 모니터링",
      subtitle: "비용·환경(ESG) 동시 고려 · AI 의사결정 가이드",
    },
    "energy-visual": {
      title: "에너지 시각 분석",
      subtitle: "에너지 등급·비교 공정·히트맵·절감 예상 효과",
    },
    process: {
      title: "공정 현황",
      subtitle: "공정 데이터(factory DB) 기반 실시간 현황",
    },
    realtime: {
      title: "공정 실시간 모델",
      subtitle: "왼쪽에서 오른쪽으로 흐르는 공정 흐름. LOT이 라인을 따라 이동합니다.",
    },
    lotpass: {
      title: "LOT별 합격·불합격 현황",
      subtitle: "LOT별 합격·불합격 (이번 달 2/1~2/28)",
    },
    quality: {
      title: "최근 품질 불량이 발생한 품목 분석",
      subtitle: "불합격 LOT 목록, 불량 영향 변수, FDC 알림을 한 화면에서 확인합니다.",
    },
  };

  // ── 공정 현황 달력 ──
  let calYear = 2026;
  let calMonth = 2;
  function renderProcessCalendar() {
    const grid = el("calendarGrid");
    const titleEl = el("calTitle");
    if (!grid || !titleEl) return;
    titleEl.textContent = calYear + "년 " + calMonth + "월";

    const firstDay = new Date(calYear, calMonth - 1, 1);
    const lastDay = new Date(calYear, calMonth, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonth = calMonth === 1 ? 12 : calMonth - 1;
    const prevYear = calMonth === 1 ? calYear - 1 : calYear;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();

    let html = "";
    for (let i = 0; i < startOffset; i++) {
      const d = prevLastDay - startOffset + i + 1;
      const key = prevYear + "-" + String(prevMonth).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const data = PROCESS_STATUS_BY_DAY[key] || { production: 0, defectRate: 0 };
      const defectClass = data.defectRate > 0 ? "defect-high" : "defect-zero";
      html += `<div class="calendar-day other-month">
        <div class="calendar-day-num">${d}</div>
        <div class="calendar-day-data">
          <div>생산량: ${data.production.toFixed(3)} kg</div>
          <div class="${defectClass}">불량률: ${data.defectRate.toFixed(1)}%</div>
        </div>
      </div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = calYear + "-" + String(calMonth).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const data = PROCESS_STATUS_BY_DAY[key] || { production: 0, defectRate: 0 };
      const defectClass = data.defectRate > 0 ? "defect-high" : "defect-zero";
      const dayOfWeek = (startOffset + d - 1) % 7;
      const weekendClass = dayOfWeek === 0 ? "weekend-sun" : dayOfWeek === 6 ? "weekend-sat" : "";
      html += `<div class="calendar-day ${weekendClass}">
        <div class="calendar-day-num">${d}</div>
        <div class="calendar-day-data">
          <div>생산량: ${data.production.toFixed(3)} kg</div>
          <div class="${defectClass}">불량률: ${data.defectRate.toFixed(1)}%</div>
        </div>
      </div>`;
    }
    const totalCells = startOffset + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
      const d = i + 1;
      const nextMonth = calMonth === 12 ? 1 : calMonth + 1;
      const nextYear = calMonth === 12 ? calYear + 1 : calYear;
      const key = nextYear + "-" + String(nextMonth).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const data = PROCESS_STATUS_BY_DAY[key] || { production: 0, defectRate: 0 };
      const defectClass = data.defectRate > 0 ? "defect-high" : "defect-zero";
      html += `<div class="calendar-day other-month">
        <div class="calendar-day-num">${d}</div>
        <div class="calendar-day-data">
          <div>생산량: ${data.production.toFixed(3)} kg</div>
          <div class="${defectClass}">불량률: ${data.defectRate.toFixed(1)}%</div>
        </div>
      </div>`;
    }
    grid.innerHTML = html;
  }
  el("calPrev")?.addEventListener("click", () => {
    calMonth--;
    if (calMonth < 1) { calMonth = 12; calYear--; }
    renderProcessCalendar();
  });
  el("calNext")?.addEventListener("click", () => {
    calMonth++;
    if (calMonth > 12) { calMonth = 1; calYear++; }
    renderProcessCalendar();
  });
  document.querySelectorAll(".nav-group-header").forEach((header) => {
    header.addEventListener("click", () => {
      const group = header.closest(".nav-group");
      if (group) {
        group.classList.toggle("collapsed");
        header.setAttribute("aria-expanded", group.classList.contains("collapsed") ? "false" : "true");
      }
    });
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!btn.dataset.page) return;
      const page = btn.dataset.page;
      document.querySelectorAll(".nav-item").forEach((b) => {
        b.classList.remove("active");
        b.removeAttribute("aria-current");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-current", "page");

      const group = btn.closest(".nav-group");
      if (group) {
        group.classList.remove("collapsed");
        const header = group.querySelector(".nav-group-header");
        if (header) header.setAttribute("aria-expanded", "true");
      }

      document.querySelectorAll(".page-panel").forEach((p) => {
        const isActive = p.id === "page-" + page;
        p.classList.toggle("active", isActive);
        p.setAttribute("aria-hidden", !isActive);
      });

      const cfg = PAGE_CONFIG[page];
      if (cfg) {
        el("pageTitle").textContent = cfg.title;
        el("pageSubtitle").textContent = cfg.subtitle;
      }
      if (page === "process") renderProcessCalendar();
      if (page === "realtime") {
        renderRealtimeModel();
        startRealtimeModelFlow();
      } else {
        stopRealtimeModelFlow();
      }
    });
  });

  // ── 공정 실시간 모델 ──
  function advanceRealtimeLots() {
    realtimeLotsState = realtimeLotsState.map((lot) => {
      let nextStage = lot.stageIndex + 1;
      if (nextStage >= FLOW_STAGES.length) {
        return { lotId: nextLotId++, stageIndex: 0, passed: Math.random() > 0.25 };
      }
      return { ...lot, stageIndex: nextStage };
    });
    renderRealtimeModel();
  }
  function startRealtimeModelFlow() {
    if (realtimeModelInterval) clearInterval(realtimeModelInterval);
    realtimeModelInterval = setInterval(advanceRealtimeLots, 2500);
  }
  function stopRealtimeModelFlow() {
    if (realtimeModelInterval) {
      clearInterval(realtimeModelInterval);
      realtimeModelInterval = null;
    }
  }
  const STAGE_ICONS = ["📥", "⚖️", "🛢️", "🔥", "⚙️", "🧲", "⚙️", "🔲", "📦"];

  function renderRealtimeModel() {
    const stagesEl = el("process3dStages");
    const lotsEl = el("process3dLots");
    const totalEl = el("realtimeLotTotal");
    if (!stagesEl || !lotsEl) return;
    const byStage = {};
    FLOW_STAGES.forEach((_, i) => (byStage[i] = []));
    realtimeLotsState.forEach((lot) => byStage[lot.stageIndex].push(lot));
    stagesEl.innerHTML = FLOW_STAGES.map(
      (name, i) => `
      <div class="stage-3d" data-stage="${i}">
        <div class="stage-3d-box">
          <span class="stage-3d-icon">${STAGE_ICONS[i] || "📦"}</span>
          <span class="stage-3d-label">${escapeHtml(name)}</span>
        </div>
        <div class="stage-3d-lots">${(byStage[i] || []).map((l) => `<span class="lot-dot-3d ${l.passed ? "pass" : "fail"}" title="LOT ${l.lotId}"></span>`).join("")}</div>
      </div>
    `
    ).join("");
    lotsEl.innerHTML = "";
    if (totalEl) totalEl.textContent = realtimeLotsState.length + " LOT";

    const pipelineEl = el("flowPipeline");
    const pipelineTotalEl = el("flowPipelineLotTotal");
    if (pipelineEl) {
      pipelineEl.innerHTML = FLOW_STAGES.map(
        (name, i) => {
          const lots = byStage[i] || [];
          const passCount = lots.filter((l) => l.passed).length;
          const failCount = lots.filter((l) => !l.passed).length;
          const segClass = i === 0 ? "flow-seg first" : i === FLOW_STAGES.length - 1 ? "flow-seg last" : "flow-seg";
          return `
          ${i > 0 ? '<div class="flow-connector"></div>' : ""}
          <div class="${segClass}" data-stage="${i}">
            <span class="flow-seg-num">${String(i + 1).padStart(2, "0")}</span>
            <span class="flow-seg-name">${escapeHtml(name)}</span>
            <div class="flow-seg-lots">
              ${passCount ? `<span class="flow-lot-cnt pass">${passCount}</span>` : ""}
              ${failCount ? `<span class="flow-lot-cnt fail">${failCount}</span>` : ""}
            </div>
          </div>
        `;
        }
      ).join("");
    }
    if (pipelineTotalEl) pipelineTotalEl.textContent = realtimeLotsState.length + " LOT";
  }
  el("btnRealtimeRefresh")?.addEventListener("click", () => {
    realtimeLotsState = JSON.parse(JSON.stringify(REALTIME_LOTS_INIT));
    nextLotId = 67;
    renderRealtimeModel();
  });

  function openNoticeEditModal(index) {
    const modal = el("noticeEditModal");
    const titleEl = el("noticeEditTitle");
    const form = el("noticeEditForm");
    const inputTitle = el("noticeEditInputTitle");
    const inputDate = el("noticeEditInputDate");
    const inputImportant = el("noticeEditInputImportant");
    const inputContent = el("noticeEditInputContent");
    if (!modal || !form) return;
    const isNew = index < 0;
    titleEl.textContent = isNew ? "공지 추가" : "공지 수정";
    form.dataset.editIndex = String(index);
    if (isNew) {
      inputTitle.value = "";
      inputDate.value = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
      inputImportant.checked = false;
      inputContent.value = "";
    } else {
      const notices = getNotices();
      const n = notices[index];
      if (n) {
        inputTitle.value = n.title || "";
        inputDate.value = n.date || new Date().toISOString().slice(0, 10).replace(/-/g, ".");
        inputImportant.checked = !!n.important;
        inputContent.value = n.content || "";
      }
    }
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    inputTitle.focus();
  }

  function closeNoticeEditModal() {
    const modal = el("noticeEditModal");
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  function initRightSidebar() {
    el("btnAddNotice")?.addEventListener("click", () => openNoticeEditModal(-1));
    el("btnAddCommunity")?.addEventListener("click", () => alert("커뮤니티 글 작성은 백엔드 연동 후 사용 가능합니다."));
    el("btnChatbot")?.addEventListener("click", () => alert("챗봇 기능은 추후 연동 예정입니다."));
    initDetailModalListeners();
    initNoticeEditModal();
  }

  function initNoticeEditModal() {
    const form = el("noticeEditForm");
    const modal = el("noticeEditModal");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const index = parseInt(form.dataset.editIndex, 10);
      const notices = getNotices();
      const notice = {
        title: el("noticeEditInputTitle").value.trim(),
        date: el("noticeEditInputDate").value.trim(),
        important: el("noticeEditInputImportant").checked,
        content: el("noticeEditInputContent").value.trim() || "(내용 없음)",
      };
      if (index < 0) {
        notices.push(notice);
      } else if (index >= 0 && index < notices.length) {
        notices[index] = notice;
      }
      saveNotices(notices);
      renderRightSidebar();
      closeNoticeEditModal();
    });
    el("noticeEditCancel")?.addEventListener("click", closeNoticeEditModal);
    el("noticeEditModalClose")?.addEventListener("click", closeNoticeEditModal);
    el("noticeEditModalBackdrop")?.addEventListener("click", closeNoticeEditModal);
  }

  // ── AI 사전 대응 알림 팝업 ──
  let aiAlertRemindTimeout = null;
  const AI_ALERT_STORAGE = "ai_alert_shown";
  const PEAK_BEFORE_MINUTES = 30;

  function checkPeakTime() {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    for (const peak of TARIFF_SCHEDULE.peakStartTimes) {
      const peakMin = peak.hour * 60 + peak.minute;
      const beforeMin = peakMin - PEAK_BEFORE_MINUTES;
      if (currentMin >= beforeMin && currentMin < peakMin) return true;
    }
    return false;
  }
  function showAIAlertPopup() {
    const popup = el("aiAlertPopup");
    if (popup) popup.classList.remove("hidden");
  }
  function hideAIAlertPopup() {
    const popup = el("aiAlertPopup");
    if (popup) popup.classList.add("hidden");
  }
  function applySinteringOptimization() {
    const sinter = PROCESS_DATA.find((p) => p.process === "소성");
    if (!sinter) return;
    sinter.target_production = Math.round((sinter.target_production ?? sinter.production) * 0.8);
    sinter.power = Math.round(sinter.power * 0.35);
  }

  function addOptimizationNotice() {
    const now = new Date();
    const dateStr = now.getFullYear() + "." + String(now.getMonth() + 1).padStart(2, "0") + "." + String(now.getDate()).padStart(2, "0");
    const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    const notices = getNotices();
    notices.unshift({
      title: "소성 공정 가동률 20% 조정 완료",
      date: dateStr + " " + timeStr,
      important: true,
      content: "요금 피크 대응으로 소성 공정 전력 소모를 20% 감소시켰습니다. 에너지 등급이 개선되었습니다.",
      tag: "시스템 자동 최적화 완료",
    });
    saveNotices(notices);
  }

  function onAIAlertApply() {
    applySinteringOptimization();
    addOptimizationNotice();
    loadData();
    hideAIAlertPopup();
    try { sessionStorage.setItem(AI_ALERT_STORAGE, "applied"); } catch (_) {}
  }
  function onAIAlertDismiss() {
    hideAIAlertPopup();
    try { sessionStorage.setItem(AI_ALERT_STORAGE, "dismissed"); } catch (_) {}
  }
  function onAIAlertRemind() {
    hideAIAlertPopup();
    if (aiAlertRemindTimeout) clearTimeout(aiAlertRemindTimeout);
    aiAlertRemindTimeout = setTimeout(showAIAlertPopup, 5 * 60 * 1000);
  }
  function checkAndShowAIAlert() {
    if (!el("appShell") || el("appShell").classList.contains("hidden")) return;
    const shown = sessionStorage.getItem(AI_ALERT_STORAGE);
    if (shown === "applied" || shown === "dismissed") return;
    if (checkPeakTime()) showAIAlertPopup();
  }
  function initAIAlert() {
    el("aiAlertApply")?.addEventListener("click", onAIAlertApply);
    el("aiAlertRemind")?.addEventListener("click", onAIAlertRemind);
    el("aiAlertDismiss")?.addEventListener("click", onAIAlertDismiss);
    setInterval(checkAndShowAIAlert, 60 * 1000);
    if (checkPeakTime()) {
      showAIAlertPopup();
    } else {
      setTimeout(() => {
        const shown = sessionStorage.getItem(AI_ALERT_STORAGE);
        if (shown !== "applied" && shown !== "dismissed") showAIAlertPopup();
      }, 8000);
    }
  }

  function initDashboard() {
    updateCurrentTimeAndTariff();
    setInterval(updateCurrentTimeAndTariff, 1000);
    initRightSidebar();
    loadData();
    stopAIGuideInterval();
    aiGuideInterval = setInterval(renderAISuggestions, 20000);
    initAIAlert();
  }

  // 페이지 로드 시 로그인 여부에 따라 화면 전환
  if (isLoggedIn()) {
    showDashboard();
    initLogout();
    initDashboard();
  } else {
    showLogin();
    initLogin();
  }
})();
