"""
자동차 조립 공정 품질 데이터 시각화 Streamlit 대시보드
- 가상 품질 데이터 생성 (Pandas)
- Yield Rate 메트릭 카드
- 공정별 불량 빈도 바 차트 (Plotly)
- 날짜별 불량률 추이 라인 차트
- 사이드바 공정 필터 (엔진, 의장, 도장)
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta
import numpy as np

# 페이지 설정
st.set_page_config(
    page_title="자동차 조립 품질 대시보드",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# 가상 품질 데이터 생성
@st.cache_data
def generate_quality_data(days: int = 90):
    """날짜, 공정명, 생산량, 불량수, 불량유형을 가진 가상 품질 데이터 생성"""
    np.random.seed(42)
    processes = ["엔진", "의장", "도장"]
    defect_types = {
        "엔진": ["이물질", "치수불량", "누유", "이음불량", "표면결함"],
        "의장": ["스크래치", "조립불량", "이물질", "색차", "간극불량"],
        "도장": ["도장불량", "오염", "피막", "색차", "박리"],
    }
    start_date = datetime.now() - timedelta(days=days)
    rows = []
    for i in range(days * 3):  # 일별 3공정
        date = start_date + timedelta(days=i // 3)
        process = processes[i % 3]
        production = int(np.random.uniform(80, 200))
        defect_count = int(np.random.uniform(2, 25))
        defect_count = min(defect_count, production)
        types = defect_types[process]
        defect_type = np.random.choice(types, size=defect_count, p=[0.3, 0.25, 0.2, 0.15, 0.1])
        for dt in defect_type:
            rows.append({
                "날짜": date.date(),
                "공정명": process,
                "생산량": production,
                "불량수": 1,
                "불량유형": dt,
            })
    df = pd.DataFrame(rows)
    # 일별·공정별로 집계 (생산량은 첫 행만 유지하고 합산)
    agg = df.groupby(["날짜", "공정명", "불량유형"]).agg(
        생산량=("생산량", "first"),
        불량수=("불량수", "sum"),
    ).reset_index()
    # 같은 날짜·공정의 생산량 통일
    day_process = agg.groupby(["날짜", "공정명"])["생산량"].first().reset_index()
    agg = agg.merge(day_process, on=["날짜", "공정명"], suffixes=("", "_y"))
    agg["생산량"] = agg["생산량_y"]
    agg = agg[["날짜", "공정명", "생산량", "불량수", "불량유형"]]
    # 공정+날짜별 총 불량수
    total_defect = agg.groupby(["날짜", "공정명"]).agg(
        생산량=("생산량", "first"),
        불량수=("불량수", "sum"),
    ).reset_index()
    return total_defect, agg

# 데이터 로드
total_df, detail_df = generate_quality_data(90)

# 사이드바: 공정 필터
st.sidebar.header("🔧 필터")
selected_processes = st.sidebar.multiselect(
    "공정 선택",
    options=["엔진", "의장", "도장"],
    default=["엔진", "의장", "도장"],
    help="표시할 공정을 선택하세요.",
)

if not selected_processes:
    st.warning("최소 하나의 공정을 선택해 주세요.")
    st.stop()

# 필터 적용
filtered_total = total_df[total_df["공정명"].isin(selected_processes)].copy()
filtered_detail = detail_df[detail_df["공정명"].isin(selected_processes)].copy()

# 상단 메트릭: 전체 합격률(Yield Rate)
total_production = filtered_total["생산량"].sum()
total_defects = filtered_total["불량수"].sum()
yield_rate = (1 - total_defects / total_production) * 100 if total_production > 0 else 0

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric(
        label="전체 합격률 (Yield Rate)",
        value=f"{yield_rate:.1f}%",
        delta=None,
    )
with col2:
    st.metric(label="총 생산량", value=f"{total_production:,}")
with col3:
    st.metric(label="총 불량수", value=f"{total_defects:,}")
with col4:
    defect_rate = (total_defects / total_production * 100) if total_production > 0 else 0
    st.metric(label="불량률", value=f"{defect_rate:.2f}%")

st.divider()

# 공정별 불량 발생 빈도 바 차트 (Plotly)
st.subheader("📊 공정별 불량 발생 빈도")
defect_by_process = filtered_total.groupby("공정명")["불량수"].sum().reset_index()
fig_bar = px.bar(
    defect_by_process,
    x="공정명",
    y="불량수",
    color="불량수",
    color_continuous_scale="Reds",
    labels={"공정명": "공정", "불량수": "불량 수"},
    text_auto=".0f",
)
fig_bar.update_layout(
    showlegend=False,
    xaxis_title="공정",
    yaxis_title="불량 수",
    margin=dict(t=20, b=20),
)
st.plotly_chart(fig_bar, use_container_width=True)

# 날짜별 불량률 추이 라인 차트
st.subheader("📈 날짜별 불량률 추이")
filtered_total["불량률(%)"] = (
    filtered_total["불량수"] / filtered_total["생산량"] * 100
)
daily_rate = (
    filtered_total.groupby(["날짜", "공정명"])
    .agg(생산량=("생산량", "sum"), 불량수=("불량수", "sum"))
    .reset_index()
)
daily_rate["불량률(%)"] = daily_rate["불량수"] / daily_rate["생산량"] * 100
daily_rate["날짜"] = pd.to_datetime(daily_rate["날짜"])

fig_line = px.line(
    daily_rate,
    x="날짜",
    y="불량률(%)",
    color="공정명",
    markers=True,
    labels={"불량률(%)": "불량률 (%)", "공정명": "공정"},
)
fig_line.update_layout(
    xaxis_title="날짜",
    yaxis_title="불량률 (%)",
    legend_title="공정",
    hovermode="x unified",
    margin=dict(t=20, b=20),
)
st.plotly_chart(fig_line, use_container_width=True)

# raw 데이터 표시 (접이식)
with st.expander("📋 필터된 품질 데이터 미리보기"):
    st.dataframe(
        filtered_total.sort_values(["날짜", "공정명"]).reset_index(drop=True),
        use_container_width=True,
    )
