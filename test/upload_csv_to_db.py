#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
CSV 파일을 MariaDB의 training_data 테이블에 업로드하는 스크립트
"""

import os
import sys
import csv
from pathlib import Path

# python_backend의 db 모듈 사용
sys.path.insert(0, str(Path(__file__).parent / "python_backend"))

from db import get_db, insert_training_data
from dotenv import load_dotenv

# .env 파일 로드
env_path = Path(__file__).parent / "python_backend" / ".env"
load_dotenv(env_path)

def upload_csv_to_db(csv_file_path):
    """
    CSV 파일을 읽어서 training_data 테이블에 업로드
    
    CSV 구조:
    - 소성온도: feature1로 사용
    - 소성시간: feature2로 사용  
    - 방전용량: target으로 사용
    """
    csv_path = Path(csv_file_path)
    
    if not csv_path.exists():
        print(f"[오류] CSV 파일을 찾을 수 없습니다: {csv_path}")
        return False
    
    print("=" * 60)
    print("CSV 파일을 MariaDB에 업로드 중...")
    print("=" * 60)
    print(f"CSV 파일: {csv_path}")
    print(f"데이터베이스: {os.getenv('DB_NAME', 'test_db')}")
    print()
    
    inserted_count = 0
    error_count = 0
    skipped_count = 0
    
    try:
        # UTF-8 BOM 처리
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            # CSV 읽기
            reader = csv.DictReader(f)
            
            # 헤더 확인
            headers = reader.fieldnames
            if headers:
                print(f"CSV 컬럼: {', '.join(headers)}")
            print()
            
            # 데이터 읽기 및 삽입
            for row_num, row in enumerate(reader, start=2):  # 2부터 시작 (헤더 제외)
                try:
                    # CSV 컬럼에서 값 추출
                    # 소성온도 -> feature1
                    feature1 = float(row.get('소성온도', 0))
                    
                    # 소성시간 -> feature2
                    feature2 = float(row.get('소성시간', 0))
                    
                    # 방전용량 -> target
                    target = float(row.get('방전용량', 0))
                    
                    # 데이터 유효성 검사
                    if feature1 == 0 and feature2 == 0 and target == 0:
                        skipped_count += 1
                        continue
                    
                    # DB에 삽입
                    insert_training_data(feature1, feature2, target)
                    inserted_count += 1
                    
                    # 진행 상황 출력 (100건마다)
                    if inserted_count % 100 == 0:
                        print(f"  진행 중... {inserted_count}건 삽입 완료")
                        
                except ValueError as e:
                    error_count += 1
                    print(f"  [경고] {row_num}번째 행 처리 실패 (숫자 변환 오류): {e}")
                    continue
                except Exception as e:
                    error_count += 1
                    print(f"  [오류] {row_num}번째 행 처리 실패: {e}")
                    continue
        
        print()
        print("=" * 60)
        print("[완료] 업로드 완료!")
        print("=" * 60)
        print(f"  성공: {inserted_count}건")
        if skipped_count > 0:
            print(f"  건너뜀: {skipped_count}건")
        if error_count > 0:
            print(f"  오류: {error_count}건")
        print()
        
        # 업로드된 데이터 확인
        print("업로드된 데이터 확인:")
        with get_db() as cur:
            cur.execute("SELECT COUNT(*) as total FROM training_data")
            total = cur.fetchone()
            print(f"  전체 훈련 데이터: {total['total']}건")
            
            cur.execute("""
                SELECT 
                    MIN(feature1) as min_feature1,
                    MAX(feature1) as max_feature1,
                    AVG(feature1) as avg_feature1,
                    MIN(feature2) as min_feature2,
                    MAX(feature2) as max_feature2,
                    AVG(feature2) as avg_feature2,
                    MIN(target) as min_target,
                    MAX(target) as max_target,
                    AVG(target) as avg_target
                FROM training_data
            """)
            stats = cur.fetchone()
            print()
            print("  통계:")
            print(f"    Feature1 (소성온도): {stats['min_feature1']:.2f} ~ {stats['max_feature1']:.2f} (평균: {stats['avg_feature1']:.2f})")
            print(f"    Feature2 (소성시간): {stats['min_feature2']:.2f} ~ {stats['max_feature2']:.2f} (평균: {stats['avg_feature2']:.2f})")
            print(f"    Target (방전용량): {stats['min_target']:.2f} ~ {stats['max_target']:.2f} (평균: {stats['avg_target']:.2f})")
        
        return True
        
    except FileNotFoundError:
        print(f"[오류] CSV 파일을 찾을 수 없습니다: {csv_path}")
        return False
    except Exception as e:
        print(f"[오류] 업로드 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # CSV 파일 경로
    csv_file = Path(__file__).parent / "cathode_calcination_data.csv"
    
    print("CSV 파일 업로드 스크립트")
    print()
    
    success = upload_csv_to_db(csv_file)
    
    if success:
        print("\n대시보드에서 데이터를 확인할 수 있습니다!")
        print("http://localhost:3000 에서 확인하세요.")
    else:
        print("\n업로드 실패. 오류 메시지를 확인하세요.")
        sys.exit(1)
