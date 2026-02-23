#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MariaDB 데이터 삽입 예제 스크립트
이 스크립트는 테이블 생성 및 데이터 삽입의 기본적인 방법을 보여줍니다.
"""

import sys
from pathlib import Path

# 프로젝트 경로 추가
sys.path.insert(0, str(Path(__file__).parent / "python_backend"))

from db import get_db, insert_training_data
from dotenv import load_dotenv

load_dotenv()

def example_1_create_table():
    """예제 1: 테이블 생성"""
    print("=" * 60)
    print("예제 1: 테이블 생성")
    print("=" * 60)
    
    with get_db() as cur:
        # 테이블 생성 (이미 존재하면 무시)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS example_table (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                value FLOAT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ example_table 테이블 생성 완료")
        print()

def example_2_insert_single():
    """예제 2: 단일 데이터 삽입"""
    print("=" * 60)
    print("예제 2: 단일 데이터 삽입")
    print("=" * 60)
    
    # 방법 1: 함수 사용 (권장)
    new_id = insert_training_data(
        feature1=909.9,
        feature2=8.4,
        target=205.87
    )
    print(f"✓ 함수 사용: ID {new_id} 삽입 완료")
    
    # 방법 2: 직접 SQL 실행
    with get_db() as cur:
        cur.execute(
            "INSERT INTO training_data (feature1, feature2, target) VALUES (%s, %s, %s)",
            (973.0, 9.4, 189.45)
        )
        print(f"✓ 직접 SQL: ID {cur.lastrowid} 삽입 완료")
    print()

def example_3_insert_multiple():
    """예제 3: 여러 데이터 일괄 삽입"""
    print("=" * 60)
    print("예제 3: 여러 데이터 일괄 삽입")
    print("=" * 60)
    
    # 데이터 리스트
    data_list = [
        (804.7, 16.1, 186.51),
        (805.1, 17.4, 188.67),
        (951.5, 19.2, 194.94),
    ]
    
    # 방법 1: 반복문 사용
    print("방법 1: 반복문 사용")
    for feature1, feature2, target in data_list:
        insert_training_data(feature1, feature2, target)
    print(f"✓ {len(data_list)}건 삽입 완료")
    
    # 방법 2: executemany 사용 (더 빠름)
    print("\n방법 2: executemany 사용")
    with get_db() as cur:
        cur.executemany(
            "INSERT INTO training_data (feature1, feature2, target) VALUES (%s, %s, %s)",
            data_list
        )
        print(f"✓ {len(data_list)}건 일괄 삽입 완료")
    print()

def example_4_query_data():
    """예제 4: 데이터 조회"""
    print("=" * 60)
    print("예제 4: 데이터 조회")
    print("=" * 60)
    
    with get_db() as cur:
        # 전체 개수 조회
        cur.execute("SELECT COUNT(*) as total FROM training_data")
        total = cur.fetchone()
        print(f"전체 데이터 수: {total['total']}건")
        
        # 최근 5건 조회
        cur.execute("""
            SELECT id, feature1, feature2, target, created_at 
            FROM training_data 
            ORDER BY id DESC 
            LIMIT 5
        """)
        rows = cur.fetchall()
        
        print("\n최근 5건:")
        print(f"{'ID':<5} {'Feature1':<10} {'Feature2':<10} {'Target':<10} {'Created At'}")
        print("-" * 60)
        for row in rows:
            print(f"{row['id']:<5} {row['feature1']:<10.2f} {row['feature2']:<10.2f} "
                  f"{row['target']:<10.2f} {row['created_at']}")
    print()

def example_5_statistics():
    """예제 5: 통계 조회"""
    print("=" * 60)
    print("예제 5: 통계 조회")
    print("=" * 60)
    
    with get_db() as cur:
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                MIN(feature1) as min_f1,
                MAX(feature1) as max_f1,
                AVG(feature1) as avg_f1,
                MIN(feature2) as min_f2,
                MAX(feature2) as max_f2,
                AVG(feature2) as avg_f2,
                MIN(target) as min_target,
                MAX(target) as max_target,
                AVG(target) as avg_target
            FROM training_data
        """)
        stats = cur.fetchone()
        
        print(f"총 데이터 수: {stats['total']}건")
        print(f"\nFeature1 통계:")
        print(f"  최소값: {stats['min_f1']:.2f}")
        print(f"  최대값: {stats['max_f1']:.2f}")
        print(f"  평균값: {stats['avg_f1']:.2f}")
        print(f"\nFeature2 통계:")
        print(f"  최소값: {stats['min_f2']:.2f}")
        print(f"  최대값: {stats['max_f2']:.2f}")
        print(f"  평균값: {stats['avg_f2']:.2f}")
        print(f"\nTarget 통계:")
        print(f"  최소값: {stats['min_target']:.2f}")
        print(f"  최대값: {stats['max_target']:.2f}")
        print(f"  평균값: {stats['avg_target']:.2f}")
    print()

def main():
    """메인 함수"""
    print("\n" + "=" * 60)
    print("MariaDB 데이터 삽입 예제")
    print("=" * 60 + "\n")
    
    try:
        # 예제 실행
        example_1_create_table()
        example_2_insert_single()
        example_3_insert_multiple()
        example_4_query_data()
        example_5_statistics()
        
        print("=" * 60)
        print("모든 예제 실행 완료!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[오류] 실행 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
