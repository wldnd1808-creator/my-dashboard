"""
ICCU 결함 분석 대시보드 - Streamlit
데이터 시각화 + 지표 + 품질 분석 보고서 요약을 브라우저에서 확인
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path

st.set_page_config(page_title="ICCU 품질 분석 대시보드", layout="wide")

BASE_DIR = Path(__file__).parent
CSV_PATH = BASE_DIR / "iccu_defect_analysis_data.csv"


@st.cache_data
def load_data():
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df["주행거리(km)"] = pd.to_numeric(df["주행거리(km)"].astype(str).str.replace(",", ""), errors="coerce")
    df["수리비용"] = pd.to_numeric(df["수리비용"].astype(str).str.replace(",", ""), errors="coerce")
    df["외기온도"] = pd.to_numeric(df["외기온도"], errors="coerce")
    df["고장"] = df["고장발생여부"].str.upper().str.strip() == "Y"
    df["생산일자"] = pd.to_datetime(df["생산일자"], errors="coerce")
    df["생산월"] = df["생산일자"].dt.to_period("M").astype(str)
    return df


def main():
    df_full = load_data()

    # ----- 왼쪽 사이드바: 필터 -----
    st.sidebar.header("필터")
    st.sidebar.caption("선택한 조건에 따라 KPI·차트가 실시간 반영됩니다.")

    model_option = st.sidebar.selectbox(
        "모델명",
        options=["전체", "아이오닉5", "EV6"],
        index=0,
    )
    supplier_option = st.sidebar.selectbox(
        "협력사",
        options=["전체", "A사", "B사"],
        index=0,
    )

    # 필터 적용
    df = df_full.copy()
    if model_option != "전체":
        df = df[df["모델명"] == model_option]
    if supplier_option != "전체":
        df = df[df["협력사"] == supplier_option]

    filter_label = []
    if model_option != "전체":
        filter_label.append(model_option)
    if supplier_option != "전체":
        filter_label.append(supplier_option)
    filter_text = " · ".join(filter_label) if filter_label else "전체"

    st.sidebar.divider()
    st.sidebar.metric("적용 후 차량 수", f"{len(df)}대")

    # ----- 메인 영역 -----
    st.title("ICCU 품질 분석 대시보드")
    st.caption(f"현대/기아 ICCU 결함 가상 데이터 기반 시각화 · **필터: {filter_text}**")

    if len(df) == 0:
        st.warning("선택한 조건에 해당하는 데이터가 없습니다. 필터를 변경해 주세요.")
        return

    # ----- KPI 카드 테두리 (발표용 가독성) -----
    st.markdown("""
    <style>
    div[data-testid="stMetric"] {
        border: 2px solid #2563eb;
        border-radius: 10px;
        padding: 1rem 1rem 1rem 1.25rem;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        background-color: #f8fafc;
    }
    </style>
    """, unsafe_allow_html=True)

    # ----- 핵심 지표 4개 (필터 적용 데이터 기준) -----
    total = len(df)
    claims = df["고장"].sum()
    claim_rate = (claims / total * 100) if total > 0 else 0
    failed = df[df["고장"]]
    early_fail = int((failed["주행거리(km)"] <= 10000).sum()) if len(failed) > 0 else 0
    total_cost = df["수리비용"].sum()
    avg_km_failed = float(failed["주행거리(km)"].mean()) if len(failed) > 0 else 0

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("전체 클레임율", f"{claim_rate:.1f}%")
    with col2:
        st.metric("1만km 이내 조기 고장 (IQS)", f"{early_fail}건")
    with col3:
        st.metric("총 누적 수리 비용 (AS Cost)", f"{total_cost/1e8:.2f}억 원")
    with col4:
        st.metric("고장 차량 평균 주행거리", f"{avg_km_failed:,.0f} km" if total > 0 else "0 km")

    st.divider()

    # 공통 차트 레이아웃: 제목 글자 크기 확대
    chart_title_font = dict(size=20, color="#1e293b")
    axis_title_font = dict(size=14)

    # ----- 차트 1: 주행거리별 고장 빈도 히스토그램 -----
    st.subheader("1. 주행거리별 고장 빈도 히스토그램 (1만km 미만 집중도)")
    failed_km = failed["주행거리(km)"].dropna()
    fig1 = go.Figure()
    if len(failed_km) > 0:
        fig1.add_trace(go.Histogram(x=failed_km, nbinsx=20, name="고장 건수", marker_color="#dc2626"))
    fig1.add_vline(x=10000, line_dash="dash", line_color="#b91c1c", annotation_text="1만km 기준")
    fig1.update_layout(
        xaxis_title="주행거리 (km)", yaxis_title="고장 건수", height=400, showlegend=False,
        title_font=chart_title_font, xaxis_title_font=axis_title_font, yaxis_title_font=axis_title_font,
        font=dict(size=13),
    )
    st.plotly_chart(fig1, use_container_width=True)

    # ----- 차트 2: 생산월별/협력사별 고장 건수 -----
    st.subheader("2. 생산월별/협력사별 고장 발생 건수 (특정 LOT 확인)")
    if len(failed) > 0:
        counts = failed.groupby(["생산월", "협력사"]).size().reset_index(name="건수")
        counts = counts.sort_values("생산월")
        fig2 = px.bar(counts, x="생산월", y="건수", color="협력사", barmode="group",
                      color_discrete_map={"A사": "#2563eb", "B사": "#059669"})
    else:
        fig2 = go.Figure()
        fig2.add_annotation(text="고장 데이터 없음", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False, font=dict(size=18))
    fig2.update_layout(
        height=400, xaxis_tickangle=-45,
        title_font=chart_title_font, xaxis_title_font=axis_title_font, yaxis_title_font=axis_title_font,
        font=dict(size=13), legend_font_size=14,
    )
    st.plotly_chart(fig2, use_container_width=True)

    # ----- 차트 3: 외기온도와 고장 산점도 -----
    st.subheader("3. 외기온도와 고장 발생 관계")
    df_plot = df[["외기온도", "주행거리(km)", "고장"]].dropna(subset=["외기온도", "주행거리(km)"])
    df_plot["고장여부"] = df_plot["고장"].map({True: "고장(Y)", False: "정상(N)"})
    fig3a = px.scatter(df_plot, x="외기온도", y="주행거리(km)", color="고장여부",
                       color_discrete_map={"고장(Y)": "#dc2626", "정상(N)": "#94a3b8"},
                       title="외기온도 vs 주행거리 (색: 고장 여부)")
    fig3a.add_hline(y=10000, line_dash="dash", line_color="#b91c1c")
    fig3a.update_layout(
        height=380,
        title_font=chart_title_font, xaxis_title_font=axis_title_font, yaxis_title_font=axis_title_font,
        font=dict(size=13), legend_font_size=14,
    )
    st.plotly_chart(fig3a, use_container_width=True)

    df_plot["온도구간"] = (df_plot["외기온도"] // 5) * 5
    rate = df_plot.groupby("온도구간")["고장"].mean().reset_index()
    rate["고장률(%)"] = rate["고장"] * 100
    fig3b = px.bar(rate, x="온도구간", y="고장률(%)", title="온도 구간별 고장 발생률 (%)")
    fig3b.update_traces(marker_color="#2563eb")
    fig3b.update_layout(
        height=300,
        title_font=chart_title_font, xaxis_title_font=axis_title_font, yaxis_title_font=axis_title_font,
        font=dict(size=13),
    )
    st.plotly_chart(fig3b, use_container_width=True)

    st.divider()

    # ----- 품질 분석 보고서 요약 (협력사 필터에 따라 조건 분기) -----
    st.subheader("품질 분석 결과")
    with st.expander("현상 · 원인 · 개선안 · 기대효과", expanded=True):
        if supplier_option == "A사":
            st.markdown(f"""
**1. 현상 — A사 공급분에서의 문제 집중**
- **A사** 공급 ICCU에서 **1만 km 미만 조기 고장**이 두드러집니다. 고장 차량 평균 주행거리 약 **{avg_km_failed:,.0f} km** (IQS 구간).
- A사 기준 클레임율 **{claim_rate:.1f}%**, 1만 km 이내 조기 고장 **{early_fail}건**으로, **협력사 중 상대적으로 고장률이 높은 편**입니다.

**2. 원인 — A사 특정 로트·공정 이슈**
- **A사** 단독 필터에서도 **특정 생산월(2025년 10월 등)** 구간에서 고장이 급증하는 패턴이 확인됩니다.
- 부품 로트·공정 불량 또는 설계 검증 미흡 가능성이 있으며, **A사 측 품질 관리 강화가 시급**합니다.

**3. 개선안 (A사 대상)**
- **선별 리콜**: A사·해당 생산월 대상 특정이 가능하므로, 하드웨어 결함 시 선별 리콜 우선 검토.
- **A사 공급사 품질 감사 및 4M(인력·자재·방법·설비) 점검** 권장.
- OTA는 모니터링·경고 보완용으로 병행.

**4. 기대효과**
- 현재 A사 구간 누적 수리비용 약 **{total_cost/1e4:.1f}만 원**. 동일 패턴 재발 방지 시 AS 비용 절감 및 브랜드 신뢰도 개선 기대.
            """)
        elif supplier_option == "B사":
            st.markdown(f"""
**1. 현상 — B사 공급분 품질 개요**
- **B사** 공급 ICCU는 A사 대비 **조기 고장·클레임 건수가 상대적으로 낮은 편**입니다.
- B사 기준 클레임율 **{claim_rate:.1f}%**, 1만 km 이내 조기 고장 **{early_fail}건**, 고장 차량 평균 주행거리 약 **{avg_km_failed:,.0f} km** (데이터 존재 시).

**2. 원인 — B사에서의 주의점**
- B사 단독으로는 **특정 생산월·로트에서의 집중 이슈**가 A사만큼 뚜렷하지 않을 수 있으나, **저온/고온 구간 등 사용 환경에 따른 고장**은 지속 모니터링이 필요합니다.
- A사 대비 양호하다고 판단되더라도 **동일 스펙·동일 사용 조건** 하에서의 장기 데이터 추적을 권장합니다.

**3. 개선안 (B사 대상)**
- **예방적 품질 관리 유지**: 현재 수준 유지를 위한 공정 관리 및 출하 검사 강화.
- **환경 시험(저온/고온) 강화**로 극한 조건에서의 고장 가능성 선제 점검.
- A사 리콜·개선 사례를 참고한 **설계·공정 벤치마크** 적용 검토.

**4. 기대효과**
- B사 구간 누적 수리비용 약 **{total_cost/1e4:.1f}만 원**. 안정적 품질 유지 시 고객 만족도 및 리콜 리스크 최소화 기대.
            """)
        else:
            # 전체 선택 시: A사 vs B사 비교·종합 요약
            st.markdown(f"""
**1. 현상 (어느 구간에서 문제가 집중되는가?)**
- **1만 km 미만**에서 고장 집중. 고장 차량 평균 주행거리 약 **{avg_km_failed:,.0f} km** (IQS 구간).
- 전체 클레임율 **{claim_rate:.1f}%**, 1만 km 이내 조기 고장 **{early_fail}건**.

**2. 원인 (특정 협력사·생산 시점인가?)**
- **협력사 A사** 공급분에서 고장 다수.
- **2025년 10월 생산분**에서 고장 건수 급증.
- **A사 + 2025년 10월 로트**가 원인으로 추정.

**3. 개선안 (OTA vs 리콜)**
- **선별 리콜 우선**: A사·2025-10 대상 특정 가능, 하드웨어 결함 가능성 높음.
- **OTA**는 모니터링·경고 보완용.
- **선별 리콜 + OTA 보완** 전략 권장.

**4. 기대효과 (AS 비용 절감)**
- 현재: 총 수리비용 약 **{total_cost/1e4:.1f}만 원**{f', 건당 평균 약 **{total_cost/claims:,.0f}만 원** (고장 건 기준)' if claims > 0 else ''}.
- 동일 패턴 재발 방지 시 연간 AS 비용 절감 및 품질 신뢰도 개선 기대.
            """)

    # ----- 원본 데이터 테이블 (필터 적용된 데이터) -----
    with st.expander("원본 데이터 (CSV 미리보기)"):
        st.dataframe(df, use_container_width=True, height=300)

    st.divider()
    st.caption("데이터: iccu_defect_analysis_data.csv | 실행: streamlit run iccu_streamlit_app.py")


if __name__ == "__main__":
    main()
