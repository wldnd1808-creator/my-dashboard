import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

# 1. 가상 데이터 생성
np.random.seed(42)
data_size = 500
dates = pd.date_range(start='2025-01-01', periods=data_size, freq='D')
models = ['아이오닉 5', 'EV6']
suppliers = ['A사', 'B사']

df = pd.DataFrame({
    '차량ID': [f'EV-{i:04d}' for i in range(data_size)],
    '모델명': np.random.choice(models, data_size),
    '생산월': dates.strftime('%Y-%m'),
    '주행거리': np.random.randint(1000, 30000, data_size),
    '협력사': np.random.choice(suppliers, data_size),
    '외기온도': np.random.randint(-15, 35, data_size),
    '수리비용': 2200000
})

# 특정 조건(A사, 2025-10 생산)에서 고장 확률 높이기
df['고장여부'] = 'N'
mask = (df['협력사'] == 'A사') & (df['생산월'] == '2025-10') & (df['주행거리'] < 10000)
df.loc[mask, '고장여부'] = np.random.choice(['Y', 'N'], size=mask.sum(), p=[0.8, 0.2])
df.loc[df['고장여부'] == 'N', '고장여부'] = np.random.choice(['Y', 'N'], size=(df['고장여부'] == 'N').sum(), p=[0.05, 0.95])

# 2. 대시보드 화면 구성
st.set_page_config(layout="wide")
st.title("🚗 ICCU 결함 및 품질 분석 대시보드")
st.markdown("---")

# 상단 KPI 지표
col1, col2, col3, col4 = st.columns(4)
total_claims = len(df[df['고장여부'] == 'Y'])
early_failure = len(df[(df['고장여부'] == 'Y') & (df['주행거리'] < 10000)])

col1.metric("전체 클레임 건수", f"{total_claims}건")
col2.metric("1만km 이내 조기고장", f"{early_failure}건", delta="위험", delta_color="inverse")
col3.metric("총 AS 예상 비용", f"{(total_claims * 2200000 / 100000000):.1f} 억원")
col4.metric("주요 타겟 LOT", "A사 (25년 10월)")

# 차트 영역
st.markdown("### 📊 상세 분석")
c1, c2 = st.columns(2)

with c1:
    fig1 = px.histogram(df[df['고장여부']=='Y'], x="주행거리", title="주행거리별 고장 빈도 (1만km 집중 확인)", color_discrete_sequence=['#EF553B'])
    st.plotly_chart(fig1, use_container_width=True)

with c2:
    lot_analysis = df[df['고장여부']=='Y'].groupby(['생산월', '협력사']).size().reset_index(name='건수')
    fig2 = px.bar(lot_analysis, x="생산월", y="건수", color="협력사", barmode="group", title="생산월/협력사별 고장 발생 추이")
    st.plotly_chart(fig2, use_container_width=True)

st.markdown("### 🌡️ 환경 변수 분석")
fig3 = px.scatter(df[df['고장여부']=='Y'], x="외기온도", y="주행거리", color="모델명", title="외기온도 대비 고장 발생 분포")
st.plotly_chart(fig3, use_container_width=True)

# 개선안 요약
with st.expander("💡 품질 분석 결과 및 개선안 보기"):
    st.write("""
    - **현상 분석:** A사 생산 2025년 10월분 ICCU에서 1만km 이내 조기 고장이 집중적으로 발생함.
    - **원인 추정:** 특정 LOT 내 전력 반도체 내구성 저하 및 저온 환경에서의 과전류 발생.
    - **대응 전략:** 1. (단기) 해당 LOT 차량 대상 선제적 무상 교체 실시.
        2. (S/W) OTA를 통한 ICCU 과전류 보호 로직 업데이트 배포.
        3. (공급망) A사 공정 품질 감사 및 소자 이원화 검토.
    """)
    