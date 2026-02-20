"""
현대/기아 ICCU 결함 분석 - 핵심 지표 계산
CSV: iccu_defect_analysis_data.csv
"""

import pandas as pd
from pathlib import Path

CSV_PATH = Path(__file__).parent / "iccu_defect_analysis_data.csv"


def load_data(path: Path = CSV_PATH) -> pd.DataFrame:
    """CSV 로드 및 기본 전처리"""
    df = pd.read_csv(path, encoding="utf-8-sig")
    if df["주행거리(km)"].dtype == object:
        df["주행거리(km)"] = pd.to_numeric(df["주행거리(km)"].astype(str).str.replace(",", ""), errors="coerce")
    if df["수리비용"].dtype == object:
        df["수리비용"] = pd.to_numeric(df["수리비용"].astype(str).str.replace(",", ""), errors="coerce")
    df["수리비용"] = df["수리비용"].fillna(0)
    return df


def calc_claim_rate(df: pd.DataFrame) -> float:
    """1. 전체 클레임율 (%)"""
    total = len(df)
    claims = (df["고장발생여부"].str.upper().str.strip() == "Y").sum()
    return (claims / total * 100) if total > 0 else 0.0


def calc_early_failure_iqs(df: pd.DataFrame, km_threshold: int = 10000) -> int:
    """2. 1만km 이내 조기 고장 건수 (IQS 관련)"""
    failed = df[df["고장발생여부"].str.upper().str.strip() == "Y"].copy()
    failed["주행거리(km)"] = pd.to_numeric(failed["주행거리(km)"], errors="coerce")
    return int((failed["주행거리(km)"] <= km_threshold).sum())


def calc_total_repair_cost(df: pd.DataFrame) -> float:
    """3. 총 누적 수리 비용(AS Cost)"""
    cost = pd.to_numeric(df["수리비용"], errors="coerce").fillna(0)
    return float(cost.sum())


def calc_avg_mileage_failed(df: pd.DataFrame) -> float:
    """4. 고장 차량의 평균 주행거리 (km)"""
    failed = df[df["고장발생여부"].str.upper().str.strip() == "Y"].copy()
    failed["주행거리(km)"] = pd.to_numeric(failed["주행거리(km)"], errors="coerce")
    if len(failed) == 0:
        return 0.0
    return float(failed["주행거리(km)"].mean())


if __name__ == "__main__":
    df = load_data()
    print("=" * 50)
    print("ICCU 결함 분석 - 핵심 지표")
    print("=" * 50)
    print(f"총 차량 수: {len(df):,}대")
    print()
    print(f"1. 전체 클레임율: {calc_claim_rate(df):.2f}%")
    print(f"2. 1만km 이내 조기 고장 건수 (IQS): {calc_early_failure_iqs(df):,}건")
    print(f"3. 총 누적 수리 비용(AS Cost): {calc_total_repair_cost(df):,.0f}원")
    print(f"4. 고장 차량의 평균 주행거리: {calc_avg_mileage_failed(df):,.1f}km")
    print("=" * 50)
