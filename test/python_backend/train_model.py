# -*- coding: utf-8 -*-
"""
훈련 데이터(CSV)로 방전용량 선형 회귀 학습 후 models/model.json 에 계수 저장.
표준 라이브러리만 사용. 실행: python train_model.py
"""

from pathlib import Path
import csv
import json


def load_csv():
    """CSV에서 소성온도, 소성시간, 방전용량 추출 → (X, y)."""
    X, y = [], []
    root = Path(__file__).resolve().parent.parent
    path = root / "cathode_calcination_data.csv"
    with open(path, "r", encoding="utf-8-sig") as f:
        r = csv.DictReader(f)
        for row in r:
            try:
                f1 = float(row.get("소성온도", 0))
                f2 = float(row.get("소성시간", 0))
                t = float(row.get("방전용량", 0))
                if f1 == 0 and f2 == 0 and t == 0:
                    continue
                X.append((f1, f2))
                y.append(t)
            except (ValueError, TypeError):
                continue
    return X, y


def solve_3x3(a):
    """3x3 행렬 a의 역행렬 (a는 3x3 list of lists)."""
    def det2(a, b, c, d):
        return a * d - b * c

    m = a
    d = (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
        - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
        + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    )
    if abs(d) < 1e-12:
        return None
    inv = [
        [
            det2(m[1][1], m[1][2], m[2][1], m[2][2]) / d,
            -det2(m[0][1], m[0][2], m[2][1], m[2][2]) / d,
            det2(m[0][1], m[0][2], m[1][1], m[1][2]) / d,
        ],
        [
            -det2(m[1][0], m[1][2], m[2][0], m[2][2]) / d,
            det2(m[0][0], m[0][2], m[2][0], m[2][2]) / d,
            -det2(m[0][0], m[0][2], m[1][0], m[1][2]) / d,
        ],
        [
            det2(m[1][0], m[1][1], m[2][0], m[2][1]) / d,
            -det2(m[0][0], m[0][1], m[2][0], m[2][1]) / d,
            det2(m[0][0], m[0][1], m[1][0], m[1][1]) / d,
        ],
    ]
    return inv


def fit_linear(X, y):
    """y = b + c1*x1 + c2*x2 OLS. (X: list of (x1,x2), y: list) → (intercept, coef)."""
    n = len(X)
    sx1 = sx2 = sy = s11 = s22 = s12 = s1y = s2y = 0.0
    for (x1, x2), yi in zip(X, y):
        sx1 += x1
        sx2 += x2
        sy += yi
        s11 += x1 * x1
        s22 += x2 * x2
        s12 += x1 * x2
        s1y += x1 * yi
        s2y += x2 * yi
    # [n, sx1, sx2; sx1, s11, s12; sx2, s12, s22] @ [b, c1, c2] = [sy, s1y, s2y]
    A = [[n, sx1, sx2], [sx1, s11, s12], [sx2, s12, s22]]
    b_vec = [sy, s1y, s2y]
    inv = solve_3x3(A)
    if not inv:
        return 0.0, [0.0, 0.0]
    w = [sum(inv[i][j] * b_vec[j] for j in range(3)) for i in range(3)]
    return w[0], [w[1], w[2]]


def main():
    models_dir = Path(__file__).resolve().parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    out = models_dir / "model.json"

    print("훈련 데이터 로드 중...")
    X, y = load_csv()
    n = len(X)
    f1 = [p[0] for p in X]
    f2 = [p[1] for p in X]
    print(f"  샘플 수: {n}")
    print(f"  소성온도: {min(f1):.1f} ~ {max(f1):.1f} °C")
    print(f"  소성시간: {min(f2):.1f} ~ {max(f2):.1f} h")
    print(f"  방전용량: {min(y):.2f} ~ {max(y):.2f} mAh/g")

    intercept, coef = fit_linear(X, y)
    payload = {"intercept": intercept, "coef": coef}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"모델 저장: {out}")


if __name__ == "__main__":
    main()
