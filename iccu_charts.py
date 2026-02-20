"""
ICCU 결함 데이터 시각화 - 3가지 차트
1. 주행거리별 고장 빈도 히스토그램 (1만km 미만 집중도)
2. 생산월별/협력사별 고장 발생 건수 막대 그래프
3. 외기온도와 고장 발생률 산점도

실행 전: pip install matplotlib pandas
또는: pip install -r requirements_iccu.txt
"""

import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

CSV_PATH = Path(__file__).parent / "iccu_defect_analysis_data.csv"
OUTPUT_DIR = Path(__file__).parent


def load_data() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df["주행거리(km)"] = pd.to_numeric(df["주행거리(km)"].astype(str).str.replace(",", ""), errors="coerce")
    df["수리비용"] = pd.to_numeric(df["수리비용"].astype(str).str.replace(",", ""), errors="coerce")
    df["외기온도"] = pd.to_numeric(df["외기온도"], errors="coerce")
    df["고장"] = df["고장발생여부"].str.upper().str.strip() == "Y"
    df["생산일자"] = pd.to_datetime(df["생산일자"], errors="coerce")
    df["생산월"] = df["생산일자"].dt.to_period("M").astype(str)
    return df


def chart1_histogram_mileage(df: pd.DataFrame) -> None:
    """1. 주행거리별 고장 빈도 히스토그램 (1만km 미만 집중도 확인용)"""
    failed = df[df["고장"]]["주행거리(km)"].dropna()
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(failed, bins=20, color="coral", edgecolor="white", alpha=0.85)
    ax.axvline(10000, color="red", linestyle="--", linewidth=2, label="1만km 기준선")
    ax.set_xlabel("주행거리 (km)", fontsize=11)
    ax.set_ylabel("고장 건수", fontsize=11)
    ax.set_title("주행거리별 고장 빈도 히스토그램 (1만km 미만 집중도 확인)", fontsize=12)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "iccu_chart1_histogram_mileage.png", dpi=120, bbox_inches="tight")
    plt.close()
    print("저장: iccu_chart1_histogram_mileage.png")


def chart2_bar_month_supplier(df: pd.DataFrame) -> None:
    """2. 생산월별/협력사별 고장 발생 건수 막대 그래프 (특정 LOT 문제 확인용)"""
    failed = df[df["고장"]].copy()
    counts = failed.groupby(["생산월", "협력사"]).size().unstack(fill_value=0)
    counts = counts.reindex(sorted(counts.index), axis=0)
    fig, ax = plt.subplots(figsize=(12, 5))
    x = range(len(counts))
    width = 0.35
    if "A사" in counts.columns and "B사" in counts.columns:
        ax.bar([i - width / 2 for i in x], counts["A사"], width, label="A사", color="steelblue")
        ax.bar([i + width / 2 for i in x], counts["B사"], width, label="B사", color="seagreen")
    else:
        for col in counts.columns:
            ax.bar(x, counts[col], label=col)
    ax.set_xticks(x)
    ax.set_xticklabels(counts.index, rotation=45, ha="right")
    ax.set_xlabel("생산월", fontsize=11)
    ax.set_ylabel("고장 발생 건수", fontsize=11)
    ax.set_title("생산월별/협력사별 고장 발생 건수 (특정 LOT 문제 확인용)", fontsize=12)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "iccu_chart2_bar_month_supplier.png", dpi=120, bbox_inches="tight")
    plt.close()
    print("저장: iccu_chart2_bar_month_supplier.png")


def chart3_scatter_temperature_failure(df: pd.DataFrame) -> None:
    """3. 외기온도와 고장 발생률의 상관관계 산점도"""
    df_plot = df[["외기온도", "주행거리(km)", "고장"]].dropna(subset=["외기온도", "주행거리(km)"])
    df_plot["온도구간"] = (df_plot["외기온도"] // 5) * 5
    rate_by_temp = df_plot.groupby("온도구간").agg(
        고장률=("고장", "mean"),
        건수=("고장", "count"),
    ).reset_index()
    rate_by_temp["고장률(%)"] = rate_by_temp["고장률"] * 100

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    for is_fail, label, color in [(True, "고장(Y)", "coral"), (False, "정상(N)", "lightgray")]:
        sub = df_plot[df_plot["고장"] == is_fail]
        ax1.scatter(sub["외기온도"], sub["주행거리(km)"], alpha=0.6, label=label, c=color, s=40, edgecolors="black", linewidths=0.3)
    ax1.axhline(10000, color="red", linestyle="--", linewidth=1, alpha=0.7)
    ax1.set_xlabel("외기온도 (°C)", fontsize=11)
    ax1.set_ylabel("주행거리 (km)", fontsize=11)
    ax1.set_title("외기온도 vs 주행거리 (색: 고장 여부)", fontsize=12)
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    ax2.bar(rate_by_temp["온도구간"], rate_by_temp["고장률(%)"], width=4, color="steelblue", edgecolor="white")
    ax2.set_xlabel("외기온도 구간 (°C)", fontsize=11)
    ax2.set_ylabel("고장 발생률 (%)", fontsize=11)
    ax2.set_title("온도 구간별 고장 발생률", fontsize=12)
    ax2.grid(axis="y", alpha=0.3)
    plt.suptitle("기온도와 고장 발생률의 상관관계", fontsize=13, y=1.02)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "iccu_chart3_scatter_temperature_failure.png", dpi=120, bbox_inches="tight")
    plt.close()
    print("저장: iccu_chart3_scatter_temperature_failure.png")


def main():
    df = load_data()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    chart1_histogram_mileage(df)
    chart2_bar_month_supplier(df)
    chart3_scatter_temperature_failure(df)
    print("차트 3개 생성 완료.")


if __name__ == "__main__":
    main()
