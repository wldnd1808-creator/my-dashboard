# 자동차 조립 품질 대시보드

Streamlit 기반 품질 데이터 시각화 대시보드입니다.

## 기능

- **가상 품질 데이터**: Pandas로 날짜, 공정명(엔진/의장/도장), 생산량, 불량수, 불량유형 생성
- **상단 메트릭**: 전체 합격률(Yield Rate), 총 생산량, 총 불량수, 불량률
- **공정별 불량 빈도**: Plotly 바 차트
- **날짜별 불량률 추이**: Plotly 라인 차트
- **사이드바 필터**: 공정(엔진, 의장, 도장) 선택

## 실행 방법

```bash
# 의존성 설치
pip install -r requirements.txt

# 대시보드 실행
streamlit run app.py
```

브라우저에서 `http://localhost:8501` 로 접속합니다.
