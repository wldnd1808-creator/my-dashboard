"""
소성온도-방전용량 상관관계 시각화
CSV 로드 → 산점도 + 2차 추세선 (표준 라이브러리만 사용, HTML+SVG 출력)

실행: python visualize_temp_capacity.py
"""
import csv
import webbrowser
from pathlib import Path

CSV_PATH = Path(__file__).parent / 'cathode_calcination_data.csv'
OUT_HTML = Path(__file__).parent / 'temp_capacity_correlation.html'


def load_csv(path):
    """CSV 로드 → (소성온도 리스트, 방전용량 리스트)"""
    temp, capacity = [], []
    with open(path, 'r', encoding='utf-8-sig') as f:
        r = csv.DictReader(f)
        for row in r:
            temp.append(float(row['소성온도']))
            capacity.append(float(row['방전용량']))
    return temp, capacity


def mean(x):
    return sum(x) / len(x)


def corrcoef(x, y):
    """피어슨 상관계수"""
    n = len(x)
    mx, my = mean(x), mean(y)
    sx = sum((a - mx) ** 2 for a in x) ** 0.5
    sy = sum((b - my) ** 2 for b in y) ** 0.5
    if sx == 0 or sy == 0:
        return 0.0
    return sum((a - mx) * (b - my) for a, b in zip(x, y)) / (sx * sy)


def polyfit2(x, y):
    """2차 다항식 최소제곱 피팅 → (c0, c1, c2) for c0 + c1*x + c2*x^2"""
    n = len(x)
    s1 = sum(x)
    s2 = sum(a * a for a in x)
    s3 = sum(a * a * a for a in x)
    s4 = sum(a * a * a * a for a in x)
    sy = sum(y)
    sxy = sum(a * b for a, b in zip(x, y))
    sxxy = sum(a * a * b for a, b in zip(x, y))
    # [n   s1   s2 ] [c0]   [sy ]
    # [s1  s2   s3 ] [c1] = [sxy]
    # [s2  s3   s4 ] [c2]   [sxxy]
    m = [
        [n, s1, s2],
        [s1, s2, s3],
        [s2, s3, s4],
    ]
    r = [sy, sxy, sxxy]
    # 가우스 소거
    for col in range(3):
        pivot = m[col][col]
        for j in range(3):
            m[col][j] /= pivot
        r[col] /= pivot
        for i in range(3):
            if i == col:
                continue
            f = m[i][col]
            for j in range(3):
                m[i][j] -= f * m[col][j]
            r[i] -= f * r[col]
    return (r[0], r[1], r[2])


def main():
    temp, capacity = load_csv(CSV_PATH)
    n = len(temp)
    r = corrcoef(temp, capacity)
    c0, c1, c2 = polyfit2(temp, capacity)

    # 스케일 (SVG용)
    w, h = 720, 400
    margin = dict(left=56, right=24, top=24, bottom=40)
    plot_w = w - margin['left'] - margin['right']
    plot_h = h - margin['top'] - margin['bottom']

    t_min, t_max = min(temp), max(temp)
    cap_min, cap_max = min(capacity), max(capacity)
    cap_pad = (cap_max - cap_min) * 0.05 or 1
    cap_lo, cap_hi = cap_min - cap_pad, cap_max + cap_pad

    def tx(t):
        return margin['left'] + (t - t_min) / (t_max - t_min) * plot_w

    def ty(c):
        return margin['top'] + (1 - (c - cap_lo) / (cap_hi - cap_lo)) * plot_h

    # 추세선 포인트
    n_pts = 150
    t_line = [t_min + (t_max - t_min) * i / (n_pts - 1) for i in range(n_pts)]
    cap_line = [c0 + c1 * t + c2 * t * t for t in t_line]
    pts_line = ' '.join(f'{tx(t)},{ty(c)}' for t, c in zip(t_line, cap_line))

    # 산점
    circles = []
    for t, c in zip(temp, capacity):
        cx, cy = tx(t), ty(c)
        if 0 <= cx <= w and 0 <= cy <= h:
            circles.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="3" fill="#2563eb" fill-opacity="0.5" stroke="#fff" stroke-width="0.5"/>')

    grid = []
    for i in range(5):
        x = margin['left'] + plot_w * i / 4
        grid.append(f'<line x1="{x:.0f}" y1="{margin["top"]}" x2="{x:.0f}" y2="{margin["top"] + plot_h}" stroke="#e5e7eb" stroke-width="1"/>')
    for i in range(5):
        y = margin['top'] + plot_h * i / 4
        grid.append(f'<line x1="{margin["left"]}" y1="{y:.0f}" x2="{margin["left"] + plot_w}" y2="{y:.0f}" stroke="#e5e7eb" stroke-width="1"/>')

    # 축 눈금 레이블
    tick_labels = []
    for i in range(5):
        t_val = t_min + (t_max - t_min) * i / 4
        x = margin['left'] + plot_w * i / 4
        tick_labels.append(f'<text x="{x:.0f}" y="{h - 4}" text-anchor="middle" font-size="10" fill="#6b7280">{t_val:.0f}</text>')
    for i in range(5):
        c_val = cap_lo + (cap_hi - cap_lo) * (1 - i / 4)
        y = margin['top'] + plot_h * i / 4
        tick_labels.append(f'<text x="{margin["left"] - 6}" y="{y + 4}" text-anchor="end" font-size="10" fill="#6b7280">{c_val:.0f}</text>')

    html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>소성온도 vs 방전용량</title>
  <style>
    body {{ font-family: "Malgun Gothic", sans-serif; margin: 24px; background: #fafafa; }}
    h1 {{ font-size: 1.1rem; margin: 0 0 12px 0; color: #111; }}
    .info {{ font-size: 13px; color: #555; margin-bottom: 12px; }}
    svg {{ background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }}
  </style>
</head>
<body>
  <h1>소성온도 vs 방전용량 상관관계</h1>
  <div class="info">상관계수 r = {r:.3f} &nbsp;|&nbsp; n = {n}</div>
  <svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">
    <rect width="100%" height="100%" fill="#fff"/>
    {''.join(grid)}
    <polyline points="{pts_line}" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linejoin="round"/>
    {''.join(circles)}
    {''.join(tick_labels)}
    <text x="{margin['left'] + plot_w / 2}" y="{h - 8}" text-anchor="middle" font-size="12" fill="#374151">소성온도 (℃)</text>
    <text x="16" y="{margin['top'] + plot_h / 2}" text-anchor="middle" font-size="12" fill="#374151" transform="rotate(-90, 16, {margin['top'] + plot_h / 2})">방전용량 (mAh/g)</text>
    <text x="{margin['left'] + plot_w - 8}" y="{margin['top'] + 16}" text-anchor="end" font-size="10" fill="#991b1b">추세선 (2차)</text>
  </svg>
</body>
</html>'''

    OUT_HTML.write_text(html, encoding='utf-8')
    print(f'저장: {OUT_HTML}')
    print(f'상관계수 r = {r:.3f}, n = {n}')
    try:
        webbrowser.open(str(OUT_HTML))
    except Exception:
        pass


if __name__ == '__main__':
    main()
