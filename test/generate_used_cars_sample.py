#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
중고차 샘플 데이터 500건 생성 (학습용)
- used_cars: 브랜드, 모델, 연식, 주행거리, 사고 이력
- monthly_market_prices: 월별 시장 시세 (최근 12개월)
실행: python generate_used_cars_sample.py [--sql-only] [--db]
  --sql-only: DB 없이 SQL 파일만 생성 (used_cars_sample.sql)
  --db: .env 기반으로 MariaDB에 직접 INSERT (기본 동작)
"""

import argparse
import os
import random
from pathlib import Path

# 프로젝트 루트 기준
ROOT = Path(__file__).resolve().parent
SQL_OUT = ROOT / "docs" / "used_cars_sample.sql"

# 브랜드별 모델 (한국·수입 혼합)
BRAND_MODELS = {
    "현대": ["아반떼", "소나타", "그랜저", "아이오닉5", "투싼", "싼타페", "팰리세이드", "코나", "베뉴"],
    "기아": ["K3", "K5", "K7", "K8", "스포티지", "쏘렌토", "셀토스", "니로", "EV6", "카니발"],
    "제네시스": ["G70", "G80", "GV70", "GV80", "GV60"],
    "쉐보레": ["말리부", "트레일블레이저", "이쿼녹스", "트랙스"],
    "르노코리아": ["SM6", "XM3", "QM6", "코레오스"],
    "한국GM": ["스파크", "트레일블레이저", "이쿼녹스"],
    "BMW": ["3시리즈", "5시리즈", "X3", "X5", "i4", "iX3"],
    "벤츠": ["C클래스", "E클래스", "GLC", "GLE", "EQA", "EQB"],
    "아우디": ["A4", "A6", "Q3", "Q5", "e트론"],
    "폭스바겐": ["골프", "파사트", "티구안", "ID.4"],
    "토요타": ["캠리", "RAV4", "프리우스", "랜드크루저"],
    "혼다": ["어코드", "CR-V", "시빅", "HR-V"],
}

# 사고 이력 메모 샘플
ACCIDENT_NOTES = [
    None, None, None, None, None,  # 무사고 비중 높음
    "경미한 접촉 (도어)",
    "앞범퍼 교환",
    "측면 스크래치 수리",
    "뒷범퍼 접촉 수리",
    "전손 (복구차)",
]

# 기준 시세 범위 (만원) - 연식/급별 대략 구간
BASE_PRICE_RANGES = [
    (800, 1200),   # 소형/준중형
    (1200, 1800),  # 중형
    (1800, 2800),  # 중대형/SUV
    (2800, 4500),  # 대형/수입
]


def pick_brand_model():
    brand = random.choice(list(BRAND_MODELS.keys()))
    model = random.choice(BRAND_MODELS[brand])
    return brand, model


def pick_base_price_range(brand):
    if brand in ("BMW", "벤츠", "아우디", "폭스바겐", "토요타", "혼다"):
        return random.choice(BASE_PRICE_RANGES[2:])
    if brand == "제네시스":
        return random.choice(BASE_PRICE_RANGES[1:])
    return random.choice(BASE_PRICE_RANGES)


def generate_car(rng, year_base=2025):
    brand, model = pick_brand_model()
    # 연식: 최근 2~10년
    model_year = rng.randint(year_base - 10, year_base - 2)
    # 주행거리: 연식에 비례 + 편차 (년당 1.5만~2.5만 km 가정)
    years_old = year_base - model_year
    base_km = years_old * rng.randint(15, 25) * 1000
    mileage = base_km + rng.randint(-20000, 30000)
    mileage = max(1000, min(350000, mileage))
    # 사고 이력
    accident_count = rng.choices([0, 1, 2, 3], weights=[70, 20, 7, 3])[0]
    accident_notes = rng.choice(ACCIDENT_NOTES) if accident_count else None
    return {
        "brand": brand,
        "model": model,
        "model_year": model_year,
        "mileage": mileage,
        "accident_count": accident_count,
        "accident_notes": accident_notes,
    }


def price_for_month(base_price, year_month_str, model_year, mileage, accident_count, rng):
    """월별 시세: 기준가에서 연식·주행·사고 반영 후 약간의 월별 변동."""
    y, m = int(year_month_str[:4]), int(year_month_str[4:6])
    # 연식/주행/사고로 할인
    years_old = y - model_year + (1 - m / 12)
    price = base_price * (1 - 0.04 * years_old)
    price *= 1 - min(0.25, mileage / 500000 * 0.5)
    price *= 1 - accident_count * 0.05
    # 월별 랜덤 변동 (±2%)
    price *= rng.uniform(0.98, 1.02)
    return max(100, int(round(price)))


def generate_monthly_prices(car_id, car, year_months, rng):
    low, high = pick_base_price_range(car["brand"])
    base_price = rng.randint(low, high)
    rows = []
    for ym in year_months:
        mp = price_for_month(
            base_price, ym, car["model_year"], car["mileage"], car["accident_count"], rng
        )
        rows.append((car_id, ym, mp))
    return rows


def year_months(count=12, year_base=2025):
    """기준년도 이전년도의 1~12월 (예: year_base=2025 → 202401~202412)."""
    y = year_base - 1
    return [f"{y}{m:02d}" for m in range(1, min(count, 12) + 1)]


def main():
    parser = argparse.ArgumentParser(description="중고차 샘플 500건 생성")
    parser.add_argument("--sql-only", action="store_true", help="DB 없이 SQL 파일만 생성")
    parser.add_argument("--count", type=int, default=500, help="생성할 차량 수 (기본 500)")
    parser.add_argument("--seed", type=int, default=42, help="random seed")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    n = args.count
    year_months_list = year_months(12)

    cars = [generate_car(rng) for _ in range(n)]

    if args.sql_only:
        # SQL 파일로 출력
        SQL_OUT.parent.mkdir(parents=True, exist_ok=True)
        with open(SQL_OUT, "w", encoding="utf-8") as f:
            f.write("-- 중고차 샘플 데이터 (학습용, {}건)\n".format(n))
            f.write("-- 생성: generate_used_cars_sample.py --sql-only\n\n")
            f.write("SET NAMES utf8mb4;\n\n")
            for i, c in enumerate(cars, start=1):
                notes = ("'" + c["accident_notes"].replace("'", "''") + "'") if c["accident_notes"] else "NULL"
                f.write(
                    "INSERT INTO used_cars (brand, model, model_year, mileage, accident_count, accident_notes) "
                    "VALUES ('{}','{}',{},{},{},{});\n".format(
                        c["brand"].replace("'", "''"),
                        c["model"].replace("'", "''"),
                        c["model_year"],
                        c["mileage"],
                        c["accident_count"],
                        notes,
                    )
                )
            f.write("\n-- 월별 시세 (car_id 1~{} 기준월 12개월)\n".format(n))
            for i, c in enumerate(cars, start=1):
                for (_, ym, mp) in generate_monthly_prices(i, c, year_months_list, rng):
                    f.write(
                        "INSERT INTO monthly_market_prices (car_id, `year_month`, market_price) "
                        "VALUES ({},'{}',{});\n".format(i, ym, mp)
                    )
        print(f"생성 완료: {SQL_OUT} (used_cars {n}건 + monthly_market_prices {n * 12}건)")
        return

    # DB 직접 INSERT
    try:
        from dotenv import load_dotenv
        import pymysql
    except ImportError as e:
        print("DB 삽입을 위해 python-dotenv, pymysql 설치 필요: pip install pymysql python-dotenv")
        print("또는 --sql-only 로 SQL 파일만 생성하세요.")
        raise SystemExit(1) from e

    env_path = ROOT / "python_backend" / ".env"
    if not env_path.exists():
        env_path = ROOT / ".env"
    load_dotenv(env_path)

    conn = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            for c in cars:
                cur.execute(
                    """INSERT INTO used_cars (brand, model, model_year, mileage, accident_count, accident_notes)
                       VALUES (%s,%s,%s,%s,%s,%s)""",
                    (c["brand"], c["model"], c["model_year"], c["mileage"], c["accident_count"], c["accident_notes"]),
                )
                car_id = cur.lastrowid
                for (_, ym, mp) in generate_monthly_prices(car_id, c, year_months_list, rng):
                    cur.execute(
                        "INSERT INTO monthly_market_prices (car_id, `year_month`, market_price) VALUES (%s,%s,%s)",
                        (car_id, ym, mp),
                    )
        conn.commit()
        print(f"DB 삽입 완료: used_cars {n}건, monthly_market_prices {n * 12}건")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
