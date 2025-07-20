# -*- coding: utf-8 -*-
"""
디버그용 Flask 앱 실행 스크립트
환경변수와 데이터베이스 연결을 확인합니다.
"""

import os
from dotenv import load_dotenv

print("=== 환경 설정 확인 ===")
load_dotenv()

# 환경변수 확인
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

print(f"Supabase URL: {supabase_url[:50] if supabase_url else 'None'}...")
print(f"Supabase Key: {supabase_key[:50] if supabase_key else 'None'}...")
print(f"URL 존재: {bool(supabase_url)}")
print(f"Key 존재: {bool(supabase_key)}")

if not supabase_url or not supabase_key:
    print("\n❌ 환경변수가 설정되지 않았습니다!")
    print("다음을 확인하세요:")
    print("1. .env.local 파일이 존재하는지")
    print("2. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되어 있는지")
    exit(1)

print("\n=== Supabase 연결 테스트 ===")
try:
    from supabase import create_client
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Supabase 클라이언트 생성 성공")
    
    # 테이블 조회 테스트
    result = supabase.table('edutech_cards').select('id, webpage_name').limit(3).execute()
    print(f"✅ 데이터베이스 연결 성공 - 카드 수: {len(result.data) if result.data else 0}")
    
    if result.data:
        for card in result.data:
            print(f"  - {card.get('webpage_name', 'Unknown')}")
    
except Exception as e:
    print(f"❌ Supabase 연결 실패: {e}")
    exit(1)

print("\n=== Flask 앱 시작 ===")
try:
    from app import app
    print("✅ Flask 앱 로드 성공")
    print("🚀 서버 시작 중... (http://127.0.0.1:5000)")
    app.run(debug=True, host='0.0.0.0', port=5000)
except Exception as e:
    print(f"❌ Flask 앱 시작 실패: {e}")
    import traceback
    traceback.print_exc()