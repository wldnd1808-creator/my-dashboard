# 습도 위험 구간 경고 팝업 - defect-analysis 페이지 통합 가이드

이 가이드는 `https://azas-project.vercel.app/defect-analysis`의 **주요 변수 구간별 불량률 분석** 페이지에 예측 기반 경고 팝업을 추가하는 방법을 설명합니다.

## 1. HTML 추가

`defect-analysis` 페이지의 `<body>` 끝 직전에 아래 모달 블록을 추가하세요:

```html
<!-- 예측 기반 습도 위험 구간 경고 모달 -->
<div id="humidityWarningOverlay" class="humidity-warning-overlay" role="alertdialog" aria-modal="true" aria-labelledby="humidityWarningTitle">
  <div class="humidity-warning-modal">
    <div class="humidity-warning-modal__header">
      <h2 id="humidityWarningTitle" class="humidity-warning-modal__title">
        <span class="icon">🔍</span> 습도 위험 구간 진입 경고
      </h2>
    </div>
    <div class="humidity-warning-modal__body">
      습도 변수가 위험 구간에 진입 중입니다. 현재 추세라면 10분 내 불량률이 <strong>12%</strong>까지 상승할 것으로 예측됩니다. 제습 설비 강도를 <strong>'강'</strong>으로 높일까요?
    </div>
    <div class="humidity-warning-modal__actions">
      <button type="button" class="btn btn--primary" id="btnApproveControl">설비 제어 승인</button>
      <button type="button" class="btn btn--secondary" id="btnViewDetail">상세 데이터 보기</button>
    </div>
  </div>
</div>
```

## 2. CSS 추가

기존 대시보드 CSS 파일에 아래 스타일을 추가하세요. 테마 변수(`--bg`, `--surface`, `--accent` 등)가 이미 정의되어 있다면 그대로 사용됩니다:

```css
/* 습도 위험 구간 경고 모달 */
.humidity-warning-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.25s ease;
}
.humidity-warning-overlay.is-open {
  display: flex;
}

.humidity-warning-modal {
  width: 100%;
  max-width: 420px;
  background: var(--surface, #141b23);
  border: 1px solid var(--border, #2d3748);
  border-radius: var(--radius, 12px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.humidity-warning-modal__header {
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border, #2d3748);
}
.humidity-warning-modal__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text, #e6edf3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.humidity-warning-modal__body {
  padding: 20px 24px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-muted, #8b949e);
}
.humidity-warning-modal__body strong { color: var(--text, #e6edf3); }

.humidity-warning-modal__actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border, #2d3748);
}
.humidity-warning-modal__actions .btn {
  flex: 1;
  padding: 12px 20px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.humidity-warning-modal__actions .btn:hover { transform: translateY(-1px); }
.humidity-warning-modal__actions .btn--primary {
  background: linear-gradient(135deg, var(--accent, #39c5cf) 0%, #2da8b0 100%);
  color: #0a0e14;
}
.humidity-warning-modal__actions .btn--secondary {
  background: var(--surface-hover, #1a222c);
  color: var(--text-muted, #8b949e);
  border: 1px solid var(--border, #2d3748);
}
.humidity-warning-modal__actions .btn--secondary:hover {
  color: var(--text, #e6edf3);
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
```

## 3. JavaScript 통합

humidity 차트의 현재 값이 72%를 넘을 때 모달을 표시하도록 연결하세요.

### 3-1. 모달 표시/숨김 함수

```javascript
const HUMIDITY_DANGER_THRESHOLD = 72;
let humidityWarningShownThisSession = false; // 중복 방지용 (선택)

function showHumidityWarningModal() {
  document.getElementById('humidityWarningOverlay')?.classList.add('is-open');
}

function hideHumidityWarningModal() {
  document.getElementById('humidityWarningOverlay')?.classList.remove('is-open');
}

function checkHumidityAndWarn(currentHumidity) {
  if (currentHumidity > HUMIDITY_DANGER_THRESHOLD && !humidityWarningShownThisSession) {
    humidityWarningShownThisSession = true;
    showHumidityWarningModal();
  }
}
```

### 3-2. humidity 차트/데이터에 연결

humidity 값을 가져오는 방식에 맞게 아래 중 하나를 사용하세요:

**A. 실시간/폴링 데이터인 경우**
```javascript
// 예: 10초마다 습도 확인
setInterval(function() {
  const currentHumidity = getCurrentHumidityFromChart(); // 실제 습도 조회 함수
  checkHumidityAndWarn(currentHumidity);
}, 10000);
```

**B. Chart.js 데이터셋에서 읽는 경우**
```javascript
// humidity 차트의 마지막 데이터 포인트가 현재값이라면
const humidityChart = /* your Chart.js instance */;
const lastValue = humidityChart?.data?.datasets?.[0]?.data?.slice(-1)?.[0];
if (typeof lastValue === 'number') checkHumidityAndWarn(lastValue);
```

**C. API/이벤트 기반인 경우**
```javascript
// humidity 값이 업데이트될 때마다 호출
onHumidityUpdate(function(value) {
  checkHumidityAndWarn(value);
});
```

### 3-3. 버튼 이벤트 바인딩

```javascript
document.getElementById('btnApproveControl')?.addEventListener('click', () => {
  hideHumidityWarningModal();
  // TODO: 제습 설비 '강'으로 제어 API 호출
});

document.getElementById('btnViewDetail')?.addEventListener('click', () => {
  hideHumidityWarningModal();
  // TODO: 상세 데이터 페이지로 이동 (예: location.href = '/defect-analysis/detail')
});
```

## 4. 테마 변수

azas-project 대시보드에서 다른 CSS 변수를 사용 중이라면, 위 스타일의 `var(--surface, #141b23)` 형태의 fallback을 해당 프로젝트 변수로 맞춰주세요.

## 5. 데모 확인

`humidity-warning-modal.html` 파일을 브라우저에서 열어 팝업 동작을 확인할 수 있습니다. 습도 72 초과 값 입력 후 "습도 확인" 버튼을 누르면 모달이 표시됩니다.
