"""
2차전지 양극재 소성 공정 가상 데이터 생성
- 방전용량: 소성온도, Li_Me_비율과 상관관계 있음
"""

import csv
import random

# 재현성을 위한 시드
random.seed(42)

def generate_cathode_data(n_rows=500):
    """양극재 소성 공정 데이터 생성"""
    data = []
    
    for _ in range(n_rows):
        # 소성온도 (℃): 750~1000, 양극재 소성 전형 구간
        temp = round(random.uniform(750, 1000), 1)
        
        # 소성시간 (h): 8~24
        time = round(random.uniform(8, 24), 1)
        
        # Li_Me_비율: 0.98~1.08, NCM 전형 구간
        ratio = round(random.uniform(0.98, 1.08), 4)
        
        # 니켈함량 (%): 60~90, 고니켈 NCM
        ni = round(random.uniform(60, 90), 2)
        
        # 방전용량: 온도·비율과 상관관계
        # - 온도: 880~920°C 근처에서 최대 (포물선)
        temp_opt = 900
        temp_factor = -0.002 * (temp - temp_opt) ** 2 + 1.0  # 0.5~1.0 구간
        # - 비율: 1.02~1.04 근처에서 최대
        ratio_opt = 1.03
        ratio_factor = -80 * (ratio - ratio_opt) ** 2 + 1.0  # 0.2~1.0 구간
        
        base_capacity = 185  # mAh/g 근처 기준
        capacity = (
            base_capacity * 0.85
            + base_capacity * 0.15 * max(0.3, temp_factor)
            + base_capacity * 0.15 * max(0.2, ratio_factor)
            + random.gauss(0, 2.5)
        )
        capacity = round(max(160, min(210, capacity)), 2)
        
        data.append({
            '소성온도': temp,
            '소성시간': time,
            'Li_Me_비율': ratio,
            '니켈함량': ni,
            '방전용량': capacity
        })
    
    return data


def main():
    data = generate_cathode_data(500)
    path = 'cathode_calcination_data.csv'
    
    columns = ['소성온도', '소성시간', 'Li_Me_비율', '니켈함량', '방전용량']
    
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=columns)
        w.writeheader()
        w.writerows(data)
    
    print(f'저장 완료: {path} ({len(data)}행)')
    print('컬럼:', columns)
    print('\n처음 5행:')
    for row in data[:5]:
        print(row)


if __name__ == '__main__':
    main()
