(function () {
  "use strict";

  const config = typeof DASHBOARD_CONFIG !== 'undefined' ? DASHBOARD_CONFIG : {
    apiBase: "",
    feature1: { label: "소성온도", unit: "°C", min: 750, max: 1000, default: 900, description: "소성온도 (Feature1, °C)" },
    feature2: { label: "소성시간", unit: "시간", min: 8, max: 24, default: 15, description: "소성시간 (Feature2, 시간)" },
    hintMessage: "💡 입력 범위: 소성온도 750~1000°C, 소성시간 8~24시간",
    chartTitle: "소성온도 vs 방전용량 추이",
    chartDescription: "훈련 데이터에서 소성온도(Feature1)에 따른 방전용량(Target)의 변화를 보여줍니다."
  };

  const API_BASE = (config.apiBase != null && config.apiBase !== "") ? config.apiBase.replace(/\/$/, "") : "";
  
  // 설정 적용 함수
  function applyConfig() {
    // 힌트 메시지 업데이트
    const hintEl = document.getElementById('predictHint');
    if (hintEl) {
      hintEl.textContent = config.hintMessage || hintEl.textContent;
    }
    
    // 레이블 업데이트
    const label1 = document.getElementById('feature1Label');
    const label2 = document.getElementById('feature2Label');
    if (label1 && config.feature1) {
      label1.textContent = config.feature1.description || label1.textContent;
    }
    if (label2 && config.feature2) {
      label2.textContent = config.feature2.description || label2.textContent;
    }
    
    // 입력 필드 속성 업데이트
    const input1 = document.getElementById('feature1');
    const input2 = document.getElementById('feature2');
    if (input1 && config.feature1) {
      input1.min = config.feature1.min || input1.min;
      input1.max = config.feature1.max || input1.max;
      input1.value = config.feature1.default || input1.value;
    }
    if (input2 && config.feature2) {
      input2.min = config.feature2.min || input2.min;
      input2.max = config.feature2.max || input2.max;
      input2.value = config.feature2.default || input2.value;
    }
    
    // 차트 제목 업데이트
    const chartTitle = document.getElementById('temperatureChartTitle');
    const chartDesc = document.getElementById('temperatureChartDesc');
    if (chartTitle && config.chartTitle) {
      chartTitle.textContent = config.chartTitle;
    }
    if (chartDesc && config.chartDescription) {
      chartDesc.textContent = config.chartDescription;
    }
    // FastAPI 직접 연결 시 시스템 상태 패널 숨김
    const systemPanel = document.querySelector(".system-status-panel");
    if (systemPanel) {
      systemPanel.style.display = API_BASE === "" ? "" : "none";
    }
  }
  
  // 페이지 로드 시 설정 적용
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyConfig);
  } else {
    applyConfig();
  }

  // 푸터 백엔드 힌트
  const backendHint = document.getElementById('backendHint');
  if (backendHint) {
    backendHint.textContent = API_BASE === ""
      ? "대시보드 API: Node (동일 출처)"
      : "대시보드 API: FastAPI (" + API_BASE + ")";
  }

  const el = (id) => document.getElementById(id);
  
  // 탭 전환
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      tabBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      tabPanels.forEach((p) => {
        const isActive = p.id === "tab-" + tabId;
        p.classList.toggle("active", isActive);
        p.setAttribute("aria-hidden", !isActive);
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
    });
  });
  
  const trainingBody = el("trainingBody");
  const statusNode = el("statusNode");
  const statusFastApi = el("statusFastApi");
  const statusHint = el("statusHint");
  const predictionsBody = el("predictionsBody");
  const trainingEmpty = el("trainingEmpty");
  const predictionsEmpty = el("predictionsEmpty");
  const trainingCount = el("trainingCount");
  const predictionsCount = el("predictionsCount");
  const avgPrediction = el("avgPrediction");
  const latestPrediction = el("latestPrediction");
  const predictForm = el("predictForm");
  const predictResult = el("predictResult");
  const btnRefresh = el("btnRefresh");
  const trainingLimit = el("trainingLimit");
  const predictionsLimit = el("predictionsLimit");
  const timelineList = el("timelineList");
  const timelineEmpty = el("timelineEmpty");
  const eventsLimit = el("eventsLimit");
  const btnTimelineRefresh = el("btnTimelineRefresh");
  const anomalyAlerts = el("anomalyAlerts");
  const performanceAlert = el("performanceAlert");
  const btnInsightsRefresh = el("btnInsightsRefresh");

  // 차트 인스턴스
  let predictionsChart = null;
  let trainingChart = null;
  let temperatureCapacityChart = null;

  // 품질 기준값 (mAh/g)
  const QUALITY_THRESHOLD = 190;

  function clearResult() {
    predictResult.textContent = "";
    predictResult.classList.remove("success", "error");
  }

  function showResult(msg, isError) {
    predictResult.textContent = msg;
    predictResult.classList.add(isError ? "error" : "success");
  }

  function fmtDate(val) {
    if (val == null) return "-";
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString("ko-KR");
  }

  function renderTraining(rows) {
    // 전체 개수는 API에서 받은 counts 사용
    if (rows.length === 0) {
      trainingBody.innerHTML = "";
      trainingEmpty.textContent = "데이터 없음";
      trainingEmpty.classList.remove("hidden");
      return;
    }
    trainingEmpty.classList.add("hidden");
    trainingBody.innerHTML = rows
      .map(
        (r) =>
          `<tr>
            <td>${r.id ?? "-"}</td>
            <td>${fmtDate(r.created_at)}</td>
            <td>${r.feature1 ?? "-"}</td>
            <td>${r.feature2 ?? "-"}</td>
            <td>${r.target ?? "-"}</td>
          </tr>`
      )
      .join("");
  }

  function formatInputSummary(input) {
    if (input == null) return "-";
    if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        if (parsed && (parsed.feature1 != null || parsed.feature2 != null)) input = parsed;
        else return escapeHtml(input);
      } catch (_) {
        return escapeHtml(input);
      }
    }
    const f1 = input.feature1;
    const f2 = input.feature2;
    const u1 = config.feature1?.unit || "°C";
    const u2 = config.feature2?.unit || "시간";
    const n1 = Number(f1), n2 = Number(f2);
    if (f1 != null && f2 != null && !Number.isNaN(n1) && !Number.isNaN(n2)) {
      return escapeHtml(`${n1}${u1} / ${n2}${u2}`);
    }
    return escapeHtml(JSON.stringify(input));
  }

  function renderPredictions(rows) {
    if (rows.length === 0) {
      predictionsBody.innerHTML = "";
      predictionsEmpty.textContent = "데이터 없음";
      predictionsEmpty.classList.remove("hidden");
      return;
    }
    predictionsEmpty.classList.add("hidden");
    predictionsBody.innerHTML = rows
      .map((r) => {
        const inputStr = formatInputSummary(r.input_summary);
        const predValue = parseFloat(r.prediction_value) || 0;
        const isDefective = predValue < QUALITY_THRESHOLD;
        const qualityClass = isDefective ? "defective" : "";
        const qualityBadge = isDefective 
          ? '<span class="quality-badge fail">불량</span>'
          : '<span class="quality-badge pass">양호</span>';
        return `
          <tr class="${qualityClass}">
            <td>${r.id ?? "-"}</td>
            <td>${fmtDate(r.created_at)}</td>
            <td>${r.model_name ?? "-"}</td>
            <td><code>${inputStr}</code></td>
            <td>${predValue.toFixed(2)}</td>
            <td>${qualityBadge}</td>
          </tr>`;
      })
      .join("");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function updatePredictionsChart(predictions) {
    const ctx = document.getElementById("predictionsChart");
    if (!ctx) return;

    if (predictionsChart) {
      predictionsChart.destroy();
    }

    if (predictions.length === 0) {
      ctx.getContext("2d").clearRect(0, 0, ctx.width, ctx.height);
      return;
    }

    // 최근 20개 데이터만 표시
    const recent = predictions.slice(0, 20).reverse();
    const labels = recent.map((r, i) => `#${r.id}`);
    const values = recent.map((r) => parseFloat(r.prediction_value) || 0);
    const dates = recent.map((r) => {
      const d = new Date(r.created_at);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("ko-KR");
    });

    predictionsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "예측값 (mAh/g)",
            data: values,
            borderColor: "rgb(88, 166, 255)",
            backgroundColor: "rgba(88, 166, 255, 0.12)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#e6edf3" },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
          },
          y: {
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
          },
        },
      },
    });
  }

  function updateTemperatureCapacityChart(training) {
    const ctx = document.getElementById("temperatureCapacityChart");
    if (!ctx) return;

    if (temperatureCapacityChart) {
      temperatureCapacityChart.destroy();
    }

    if (training.length === 0) {
      ctx.getContext("2d").clearRect(0, 0, ctx.width, ctx.height);
      return;
    }

    // 소성온도(Feature1)로 정렬
    const sorted = [...training]
      .map((r) => ({
        feature1: parseFloat(r.feature1) || 0,
        target: parseFloat(r.target) || 0,
      }))
      .sort((a, b) => a.feature1 - b.feature1);

    const temperatures = sorted.map((r) => r.feature1);
    const capacities = sorted.map((r) => r.target);

    temperatureCapacityChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: temperatures.map((t) => t.toFixed(1)),
        datasets: [
          {
            label: "방전용량 (mAh/g)",
            data: capacities,
            borderColor: "rgb(88, 166, 255)",
            backgroundColor: "rgba(88, 166, 255, 0.12)",
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: "품질 기준선 (190 mAh/g)",
            data: temperatures.map(() => QUALITY_THRESHOLD),
            borderColor: "rgb(248, 81, 73)",
            backgroundColor: "rgba(248, 81, 73, 0.1)",
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#e6edf3" },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                if (context.datasetIndex === 0) {
                  const feature1Label = config.feature1?.label || "소성온도";
                  const feature1Unit = config.feature1?.unit || "°C";
                  return `방전용량: ${context.parsed.y.toFixed(2)} mAh/g (${feature1Label}: ${temperatures[context.dataIndex].toFixed(1)}${feature1Unit})`;
                }
                return `품질 기준: ${QUALITY_THRESHOLD} mAh/g`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: (config.feature1?.description || "소성온도 (Feature1, °C)"),
              color: "#8b949e",
            },
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
          },
          y: {
            title: {
              display: true,
              text: "방전용량 (Target, mAh/g)",
              color: "#8b949e",
            },
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
            min: Math.min(...capacities) - 10,
            max: Math.max(...capacities) + 10,
          },
        },
      },
    });
  }

  function updateTrainingChart(training) {
    const ctx = document.getElementById("trainingChart");
    if (!ctx) return;

    if (trainingChart) {
      trainingChart.destroy();
    }

    if (training.length === 0) {
      ctx.getContext("2d").clearRect(0, 0, ctx.width, ctx.height);
      return;
    }

    const f1Label = config.feature1?.label || "소성온도";
    const f2Label = config.feature2?.label || "소성시간";
    const f1Unit = config.feature1?.unit || "°C";
    const f2Unit = config.feature2?.unit || "시간";
    const feature1Data = training.map((r) => parseFloat(r.feature1) || 0);
    const feature2Data = training.map((r) => parseFloat(r.feature2) || 0);
    const targetData = training.map((r) => parseFloat(r.target) || 0);

    trainingChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: `${f1Label} vs ${f2Label}`,
            data: feature1Data.map((f1, i) => ({ x: f1, y: feature2Data[i] })),
            backgroundColor: "rgba(88, 166, 255, 0.5)",
            borderColor: "rgb(88, 166, 255)",
            pointRadius: 5,
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
              label: function (context) {
                const idx = context.dataIndex;
                return [
                  `${f1Label}: ${feature1Data[idx]}${f1Unit}`,
                  `${f2Label}: ${feature2Data[idx]}${f2Unit}`,
                  `방전용량: ${targetData[idx]} mAh/g`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: `${f1Label} (${f1Unit})`, color: "#8b949e" },
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
          },
          y: {
            title: { display: true, text: `${f2Label} (${f2Unit})`, color: "#8b949e" },
            ticks: { color: "#8b949e" },
            grid: { color: "#2d3748" },
          },
        },
      },
    });
  }

  /** 이벤트 타임라인 (Node 백엔드에서만 제공) */
  async function fetchEvents(limit = 50) {
    const res = await fetch(`/api/dashboard/events?limit=${limit}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function renderTimeline(events) {
    if (!timelineList || !timelineEmpty) return;
    if (!Array.isArray(events) || events.length === 0) {
      timelineList.innerHTML = "";
      timelineEmpty.classList.remove("hidden");
      timelineEmpty.classList.add("timeline-empty-visible");
      timelineEmpty.textContent = "이벤트 없음";
      return;
    }
    timelineEmpty.classList.add("hidden");
    timelineEmpty.classList.remove("timeline-empty-visible");
    timelineList.innerHTML = events
      .map((ev) => {
        const typeClass = ev.event_type === "danger" ? "danger" : ev.event_type === "anomaly" ? "anomaly" : ev.event_type === "warning" ? "warning" : "danger";
        const timeStr = fmtDate(ev.created_at);
        const msg = ev.message || "이벤트";
        let meta = "";
        if (ev.payload) {
          let p = ev.payload;
          if (typeof p === "string") {
            try {
              p = JSON.parse(p);
            } catch (_) {
              p = {};
            }
          }
          if (p && p.predictionValue != null) meta += `예측값 ${Number(p.predictionValue).toFixed(2)} mAh/g`;
          if (p && p.inputSummary && (p.inputSummary.feature1 != null || p.inputSummary.feature2 != null)) {
            const f1 = p.inputSummary.feature1, f2 = p.inputSummary.feature2;
            meta += (meta ? " · " : "") + `입력: ${f1}°C / ${f2}h`;
          }
        }
        const slackBadge = ev.slack_sent ? '<span class="timeline-slack-badge">Slack 발송</span>' : "";
        return `
          <article class="timeline-item ${typeClass}" data-id="${ev.id ?? ""}">
            <span class="timeline-dot" aria-hidden="true"></span>
            <div class="timeline-body">
              <div class="timeline-time">${escapeHtml(timeStr)}</div>
              <span class="timeline-type ${typeClass}">${escapeHtml(ev.event_type || "danger")}</span>
              ${slackBadge}
              <div class="timeline-message">${escapeHtml(msg)}</div>
              ${meta ? `<div class="timeline-meta"><code>${escapeHtml(meta)}</code></div>` : ""}
            </div>
          </article>`;
      })
      .join("");
  }

  async function loadEvents() {
    if (!timelineList) return;
    try {
      const limit = parseInt(eventsLimit?.value, 10) || 50;
      const data = await fetchEvents(limit);
      renderTimeline(Array.isArray(data) ? data : []);
    } catch (e) {
      timelineList.innerHTML = "";
      if (timelineEmpty) {
        timelineEmpty.classList.remove("hidden");
        timelineEmpty.classList.add("timeline-empty-visible");
        timelineEmpty.textContent = "이벤트를 불러올 수 없습니다. (Node 백엔드 필요)";
      }
    }
  }

  /** 지능형 모니터링 (AI 인사이트): 이상 징후 + 성능 하락 */
  async function fetchInsights() {
    if (API_BASE !== "") {
      const [anomalyRes, perfRes] = await Promise.all([
        fetch(`${API_BASE}/api/anomaly/check`),
        fetch(`${API_BASE}/api/performance/check`),
      ]);
      const anomalies = anomalyRes.ok ? (await anomalyRes.json()).anomalies || [] : [];
      const performance = perfRes.ok ? await perfRes.json() : { alert: false, message: "확인 불가", mae: null, sample_size: 0 };
      return { anomalies, performance };
    }
    const res = await fetch("/api/dashboard/insights");
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function renderAnomalyAlerts(anomalies) {
    if (!anomalyAlerts) return;
    if (!Array.isArray(anomalies) || anomalies.length === 0) {
      anomalyAlerts.innerHTML = '<span class="insight-ok">이상 징후 없음</span>';
      return;
    }
    anomalyAlerts.innerHTML = anomalies
      .map((a) => `<div class="anomaly-card">${escapeHtml(a.message || a.rule || "이상 징후")}</div>`)
      .join("");
  }

  function renderPerformanceAlert(performance) {
    if (!performanceAlert) return;
    if (!performance || performance.mae == null) {
      performanceAlert.innerHTML = '<span class="insight-loading">' + escapeHtml(performance?.message || "확인 중…") + "</span>";
      return;
    }
    if (performance.alert) {
      performanceAlert.innerHTML =
        '<div class="insight-danger">' +
        '<span class="performance-retrain">모델 재학습 필요</span><br>' +
        escapeHtml(performance.message || "") +
        (performance.sample_size ? "<br><small>기준: " + performance.threshold + " mAh/g, 샘플 " + performance.sample_size + "건</small>" : "") +
        "</div>";
    } else {
      performanceAlert.innerHTML =
        '<span class="insight-ok">' +
        escapeHtml(performance.message || "성능 정상") +
        (performance.mae != null ? " (MAE " + performance.mae + " mAh/g)" : "") +
        "</span>";
    }
  }

  async function loadInsights() {
    if (!anomalyAlerts && !performanceAlert) return;
    try {
      const data = await fetchInsights();
      renderAnomalyAlerts(data.anomalies || []);
      renderPerformanceAlert(data.performance);
    } catch (e) {
      if (anomalyAlerts) anomalyAlerts.innerHTML = '<span class="insight-loading">인사이트를 불러올 수 없습니다.</span>';
      if (performanceAlert) performanceAlert.innerHTML = '<span class="insight-loading">인사이트를 불러올 수 없습니다.</span>';
    }
  }

  /** 시스템 상태 (Node + FastAPI) - Node 서빙 시에만 호출 */
  async function updateSystemStatus() {
    if (API_BASE !== "" || !statusNode || !statusFastApi) return;
    try {
      const res = await fetch("/api/dashboard/health-status");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      statusNode.textContent = data.node?.ok ? "연결됨" : "오류";
      statusNode.className = "status-badge " + (data.node?.ok ? "ok" : "fail");
      statusFastApi.textContent = data.fastapi?.ok ? "연결됨" : (data.fastapi?.message || "연결 안 됨");
      statusFastApi.className = "status-badge " + (data.fastapi?.ok ? "ok" : "fail");
      if (statusHint) {
        statusHint.textContent = data.fastapi?.ok
          ? "백엔드가 모두 연결되었습니다. 아래에서 예측을 실행할 수 있습니다."
          : "FastAPI(예측 API)를 연결하려면 python_backend에서 python main.py 를 실행하세요.";
      }
    } catch (_) {
      if (statusNode) {
        statusNode.textContent = "데모 모드";
        statusNode.className = "status-badge ok";
      }
      if (statusFastApi) {
        statusFastApi.textContent = "데모 모드";
        statusFastApi.className = "status-badge ok";
      }
      if (statusHint) {
        statusHint.textContent = "백엔드가 연결되지 않은 상태입니다. 아래 카드에는 데모용 샘플 값이 표시됩니다.";
      }
    }
  }

  /** 백엔드 미연결 시 카드에 표시할 데모 값 */
  function applyDemoStats() {
    if (trainingCount) trainingCount.textContent = "150";
    if (predictionsCount) predictionsCount.textContent = "42";
    if (avgPrediction) avgPrediction.textContent = "198.52";
    if (latestPrediction) latestPrediction.textContent = "195.20";
    const au = document.getElementById("avgPredictionUnit");
    const lu = document.getElementById("latestPredictionUnit");
    if (au) au.textContent = "mAh/g";
    if (lu) lu.textContent = "mAh/g";
  }

  /** 백엔드 미연결 시 인사이트 영역에 표시 */
  function loadInsightsDemo() {
    if (anomalyAlerts) anomalyAlerts.innerHTML = '<span class="insight-ok">데모 모드 — 백엔드 연결 후 확인 가능</span>';
    if (performanceAlert) performanceAlert.innerHTML = '<span class="insight-ok">데모 모드 — 백엔드 연결 후 확인 가능</span>';
  }

  /** Node 백엔드: /api/dashboard/summary | FastAPI 직접: /api/training-data + /api/predictions */
  async function fetchSummary(trainingLimit = 100, predictionsLimit = 100) {
    if (API_BASE === "") {
      const res = await fetch(
        `/api/dashboard/summary?trainingLimit=${trainingLimit}&predictionsLimit=${predictionsLimit}`
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
    const [trainingRes, predictionsRes] = await Promise.all([
      fetch(`${API_BASE}/api/training-data?limit=${trainingLimit}`),
      fetch(`${API_BASE}/api/predictions?limit=${predictionsLimit}`),
    ]);
    if (!trainingRes.ok) throw new Error(await trainingRes.text());
    if (!predictionsRes.ok) throw new Error(await predictionsRes.text());
    const training = await trainingRes.json();
    const predictions = await predictionsRes.json();
    return {
      training: Array.isArray(training) ? training : [],
      predictions: Array.isArray(predictions) ? predictions : [],
      counts: { training: training.length, predictions: predictions.length },
    };
  }

  function calculateStats(predictions) {
    const avgUnit = document.getElementById("avgPredictionUnit");
    const latestUnit = document.getElementById("latestPredictionUnit");
    if (predictions.length === 0) {
      avgPrediction.textContent = "-";
      latestPrediction.textContent = "-";
      if (avgUnit) avgUnit.textContent = "";
      if (latestUnit) latestUnit.textContent = "";
      return;
    }

    const values = predictions
      .map((p) => parseFloat(p.prediction_value))
      .filter((v) => !isNaN(v));

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      avgPrediction.textContent = avg.toFixed(2);
      if (avgUnit) avgUnit.textContent = "mAh/g";
    } else {
      avgPrediction.textContent = "-";
      if (avgUnit) avgUnit.textContent = "";
    }

    const latest = parseFloat(predictions[0]?.prediction_value);
    latestPrediction.textContent = !isNaN(latest) ? latest.toFixed(2) : "-";
    if (latestUnit) latestUnit.textContent = !isNaN(latest) ? "mAh/g" : "";
  }

  /** 데이터가 없을 때 한 번만 안내 메시지 표시 */
  function showEmptyStateGuide(trainingLen, predictionsLen) {
    const guideEl = document.getElementById("emptyStateGuide");
    if (!guideEl) return;
    if (trainingLen > 0 || predictionsLen > 0) {
      guideEl.classList.add("hidden");
      guideEl.innerHTML = "";
      return;
    }
    guideEl.classList.remove("hidden");
    guideEl.innerHTML = `
      <strong>📋 처음 사용하시나요?</strong><br><br>
      <b>1. 훈련 데이터 적재</b><br>
      CSV 파일이 있다면: <code>python upload_csv_to_db.py</code> 또는 FastAPI <code>POST /api/training-data</code> 사용<br><br>
      <b>2. 예측 모델 학습</b><br>
      <code>cd python_backend && python train_model.py</code> 실행 (model.json 생성)<br><br>
      <b>3. 예측 실행</b><br>
      아래 입력란에 소성온도·소성시간을 입력하고 <strong>예측</strong> 버튼을 누르면 결과가 MariaDB에 저장됩니다.
    `;
  }

  function setLoading(loading) {
    const container = document.querySelector(".main");
    const loadingEl = document.getElementById("loadingIndicator");
    if (container) container.classList.toggle("loading", !!loading);
    if (btnRefresh) btnRefresh.disabled = !!loading;
    if (loadingEl) loadingEl.classList.toggle("hidden", !loading);
    if (loading) {
      trainingCount.textContent = "…";
      predictionsCount.textContent = "…";
      avgPrediction.textContent = "…";
      latestPrediction.textContent = "…";
      const au = document.getElementById("avgPredictionUnit");
      const lu = document.getElementById("latestPredictionUnit");
      if (au) au.textContent = "";
      if (lu) lu.textContent = "";
    }
  }

  async function load() {
    setLoading(true);
    try {
      const tLimit = parseInt(trainingLimit.value, 10) || 100;
      const pLimit = parseInt(predictionsLimit.value, 10) || 100;
      const data = await fetchSummary(tLimit, pLimit);
      const training = data.training || [];
      const predictions = data.predictions || [];
      
      // 전체 데이터 개수 업데이트
      if (data.counts) {
        trainingCount.textContent = data.counts.training || training.length;
        predictionsCount.textContent = data.counts.predictions || predictions.length;
      } else {
        trainingCount.textContent = training.length;
        predictionsCount.textContent = predictions.length;
      }
      
      renderTraining(training);
      renderPredictions(predictions);
      calculateStats(predictions);
      updatePredictionsChart(predictions);
      updateTemperatureCapacityChart(training);
      updateTrainingChart(training);
      loadEvents();
      loadInsights();
      showEmptyStateGuide(training.length, predictions.length);
    } catch (e) {
      applyDemoStats();
      trainingBody.innerHTML = "";
      predictionsBody.innerHTML = "";
      trainingEmpty.classList.remove("hidden");
      predictionsEmpty.classList.remove("hidden");
      trainingEmpty.textContent = "백엔드에 연결되지 않았습니다. 데모용 샘플 값이 카드에 표시됩니다. 로컬에서 node_backend를 실행하면 실제 데이터를 볼 수 있습니다.";
      predictionsEmpty.textContent = "백엔드에 연결되지 않았습니다.";
      if (predictionsChart) {
        predictionsChart.destroy();
        predictionsChart = null;
      }
      if (temperatureCapacityChart) {
        temperatureCapacityChart.destroy();
        temperatureCapacityChart = null;
      }
      if (trainingChart) {
        trainingChart.destroy();
        trainingChart = null;
      }
      loadInsightsDemo();
    } finally {
      setLoading(false);
      updateSystemStatus();
    }
  }

  predictForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(predictForm);
    const feature1 = parseFloat(fd.get("feature1"));
    const feature2 = parseFloat(fd.get("feature2"));
    if (Number.isNaN(feature1) || Number.isNaN(feature2)) {
      showResult("feature1, feature2에 숫자를 입력해 주세요.", true);
      return;
    }
    clearResult();
    showResult("예측 중…", false);
    
    // 버튼 비활성화
    const submitBtn = predictForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "예측 중...";
    
    try {
      const predictUrl = API_BASE === "" ? "/api/dashboard/predict" : `${API_BASE}/api/predict`;
      const res = await fetch(predictUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature1, feature2 }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showResult(
          json.detail || json.error || "예측 요청 실패",
          true
        );
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      const pred = json.prediction;
      const predValue = parseFloat(pred) || 0;
      const isDefective = predValue < QUALITY_THRESHOLD;
      const qualityText = isDefective ? " (불량)" : " (양호)";
      const feature1Label = config.feature1?.label || "소성온도";
      const feature1Unit = config.feature1?.unit || "°C";
      const feature2Label = config.feature2?.label || "소성시간";
      const feature2Unit = config.feature2?.unit || "시간";
      
      let resultMsg = `예측값: ${predValue.toFixed(2)} mAh/g${qualityText} (${feature1Label}=${feature1}${feature1Unit}, ${feature2Label}=${feature2}${feature2Unit})`;
      if (json.input_anomaly) resultMsg += "\n⚠️ " + json.input_anomaly;
      if (json.value_anomaly) resultMsg += "\n⚠️ " + json.value_anomaly;
      showResult(resultMsg, isDefective);
      
      // 실시간 갱신 (페이지 새로고침 없이)
      await load();
      loadInsights();
      
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    } catch (err) {
      showResult("연결 실패: " + (err.message || String(err)), true);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  btnRefresh.addEventListener("click", () => {
    clearResult();
    load();
  });

  trainingLimit.addEventListener("change", () => {
    load();
  });

  predictionsLimit.addEventListener("change", () => {
    load();
  });

  if (btnTimelineRefresh) {
    btnTimelineRefresh.addEventListener("click", () => loadEvents());
  }
  if (eventsLimit) {
    eventsLimit.addEventListener("change", () => loadEvents());
  }
  if (btnInsightsRefresh) {
    btnInsightsRefresh.addEventListener("click", () => loadInsights());
  }

  // 프리셋 버튼 이벤트
  document.querySelectorAll(".btn-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const temp = parseFloat(btn.dataset.temp);
      const time = parseFloat(btn.dataset.time);
      if (!isNaN(temp) && !isNaN(time)) {
        el("feature1").value = temp;
        el("feature2").value = time;
        // 자동으로 예측 실행
        predictForm.dispatchEvent(new Event("submit"));
      }
    });
  });

  load();

  setTimeout(function () {
    if (typeof window.initIccu3dResize === "function") window.initIccu3dResize();
  }, 500);

  // Socket.io 실시간 고장 알림 (Node 백엔드에서만 연결)
  if (API_BASE === "" && typeof io !== "undefined") {
    const socket = io();
    const toastEl = el("failureAlertToast");
    let dismissTimer = null;

    socket.on("failure-alert", (data) => {
      if (!toastEl) return;
      const prob = (data.failure_probability * 100).toFixed(1);
      const eq = data.equipment_id || "전체";
      toastEl.innerHTML =
        '<strong>🚨 설비 고장 위험 알림</strong>' +
        '<span class="toast-message">' + (data.message || `고장 확률 ${prob}% (설비: ${eq})`) + '</span>' +
        '<button type="button" class="toast-dismiss" aria-label="닫기">닫기</button>';
      toastEl.classList.remove("hidden");

      toastEl.querySelector(".toast-dismiss")?.addEventListener("click", () => {
        toastEl.classList.add("hidden");
        if (dismissTimer) clearTimeout(dismissTimer);
      });

      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = setTimeout(() => {
        toastEl.classList.add("hidden");
        dismissTimer = null;
      }, 15000);
    });
  }
})();
