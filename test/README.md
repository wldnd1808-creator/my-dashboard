# Backend API (Express + TypeScript)

Express와 TypeScript로 구성된 REST API 백엔드입니다.

## 시작하기

### 의존성 설치

```bash
npm install
```

### 개발 모드 (핫 리로드)

```bash
npm run dev
```

### 빌드 후 실행

```bash
npm run build
npm start
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| GET | `/api/items` | 전체 항목 목록 |
| GET | `/api/items/:id` | 항목 조회 |
| POST | `/api/items` | 항목 생성 |
| PUT | `/api/items/:id` | 항목 수정 |
| DELETE | `/api/items/:id` | 항목 삭제 |

### 예시

**항목 생성 (POST /api/items)**

```json
{
  "name": "새 항목",
  "description": "설명 (선택)"
}
```

기본 포트: **3000** (환경 변수 `PORT`로 변경 가능)
