# 공정 에너지 최적화 & 탄소배출 모니터링 대시보드

생산량뿐 아니라 **비용**과 **환경(ESG)** 을 동시에 고려하는 스마트 팩토리 대시보드입니다.

## 핵심 기능

- **공정별 전력 vs 생산량**: 전력 소모량과 생산량 비교, **제품 1개당 에너지 효율(kWh/개)** 계산
- **탄소배출 모니터링**: 공정별 kgCO₂e 표시 (ESG 리포트 대응)
- **시간대별 전기 요금(TOU)**: 최대부하/야간 등 요금대 시각화

## AI 의사결정 가이드 (심화)

현재 전기 요금대에 따라 AI가 실시간으로 제안합니다.

- **예**: "현재 전기 요금이 비싼 시간대이니, 소성 공정 가동을 2시간 뒤로 미루면 비용이 15% 절감됩니다"
- 에너지 효율이 낮은 공정 개선 제안
- 야간 가동 시 비용 절감 권고

## 실행 방법

```powershell
# energy_dashboard 폴더에서 index.html 더블클릭 또는:
run-energy-dashboard.bat

# 또는 로컬 서버로 실행 (CORS 이슈 방지):
npx serve energy_dashboard -p 3333
# 브라우저에서 http://localhost:3333 접속
```

## 누구나 접속 가능하게 (공개 URL)

- **즉시 공유**: `share-dashboard.bat` 실행 → ngrok 주소 복사 후 공유
- **영구 배포**: `DEPLOY_PUBLIC.md` 참고 (GitHub Pages, Netlify)

## 데이터

현재 **Mock 데이터**로 동작합니다. 실제 DB/API 연동 시 `app.js`의 `PROCESS_DATA`와 AI 제안 로직을 백엔드 API로 교체하면 됩니다.
