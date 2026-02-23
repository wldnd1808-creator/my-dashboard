# 품질 관리 사전 차단 알림 모듈

azas-project(또는 manufacturing-dashboard)의 **품질/불량 분석 페이지**에 습도 위험 구간 사전 알림을 붙이기 위한 코드 모음입니다.

## 1. 환경 오류 해결 (ts-node-dev / npm run dev)

**manufacturing-dashboard**가 있는 경우:

```powershell
cd manufacturing-dashboard
npm install
npm run dev
```

**현재 워크스페이스 루트**에서 백엔드만 실행하는 경우:

```powershell
cd c:\Users\Admin\Desktop\test
npm install
npm run dev
```

- `ts-node-dev를 찾을 수 없다` 오류는 `npm install`로 해결됩니다.
- 설치 후에도 `npm run dev` 실패 시(예: EPERM), 터미널을 관리자 권한으로 다시 열거나, 해당 폴더에서 `npx ts-node-dev --respawn --transpile-only src/index.ts` 로 직접 실행해 보세요.

---

## 2. 프로젝트에 적용하는 방법

Next.js App Router 기준 경로는 `src/` 루트라고 가정합니다.

| 이 폴더 파일 | 복사할 위치 |
|-------------|-------------|
| `lib/telegram.ts` | `src/lib/telegram.ts` |
| `app/api/telegram-notify/route.ts` | `src/app/api/telegram-notify/route.ts` (route.ts 내부에서 `sendTelegramAlert` import 경로를 `@/lib/telegram` 등으로 수정) |
| `components/HumidityDangerAlert.tsx` | `src/components/HumidityDangerAlert.tsx` |
| `app/analytics/page.tsx` | `src/app/analytics/page.tsx` (import 경로를 `@/components/...`, `@/lib/...` 등으로 수정) |

### 환경 변수 (.env.local)

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

- 텔레그램 봇 토큰: [@BotFather](https://t.me/BotFather)에서 봇 생성 후 발급.
- 채팅 ID: 봇과 대화를 한 뒤 `https://api.telegram.org/bot<TOKEN>/getUpdates` 에서 `chat.id` 확인.

---

## 3. 동작 요약

- **트리거**: humidity ≥ **72%** 일 때 팝업 1회 표시.
- **팝업 메시지**:  
  "🔍 습도 변수가 위험 구간에 진입 중입니다. 현재 추세라면 10분 내 불량률이 12%까지 상승할 것으로 예측됩니다. 제습 설비 강도를 '강'으로 높일까요?"
- **버튼**
  - **[설비 제어 승인]** (Primary): 모달 닫기 + 차트 humidity 하향 시뮬레이션 + 텔레그램 발송 `"라인 A 습도 제어 승인됨 - 정상화 진행 중"`.
  - **[상세 데이터 보기]** (Outline): 모달 닫기 + 상세 페이지 이동(경로는 프로젝트에 맞게 수정).

---

## 4. 기존 defect-analysis 페이지에만 붙이기

이미 `defect-analysis` 페이지가 있고, 해당 페이지의 humidity 데이터만 연결하려면:

1. `HumidityDangerAlert` 컴포넌트를 해당 페이지에 import.
2. humidity 현재값을 state/차트 데이터에서 읽어서 `currentHumidity >= 72` 일 때 `setAlertOpen(true)`.
3. `onApproveControl`에서 기존 차트 데이터를 갱신하는 로직 + `fetch('/api/telegram-notify', { method: 'POST', body: JSON.stringify({ message: '라인 A 습도 제어 승인됨 - 정상화 진행 중' }) })` 호출.

API 라우트와 `lib/telegram.ts`는 위 표대로 두고, `.env` 에만 `TELEGRAM_*` 설정하면 됩니다.
