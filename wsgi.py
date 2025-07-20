#!/usr/bin/env python3
"""
WSGI entry point for Railway deployment
"""
import os
import sys
import traceback

# Add current directory to Python path
current_dir = os.path.dirname(__file__)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

print("=== WSGI 시작 ===")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Current directory: {current_dir}")
print(f"Python path (first 3): {sys.path[:3]}")

# Railway 환경 확인
railway_env = os.environ.get('RAILWAY_ENVIRONMENT')
print(f"Railway 환경: {railway_env}")
print(f"PORT: {os.environ.get('PORT', 'Not set')}")

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ dotenv 로드 성공")
except ImportError:
    print("⚠️ python-dotenv 모듈이 없음 (Railway에서는 정상)")
except Exception as e:
    print(f"⚠️ dotenv 로드 실패: {e}")

# Check critical environment variables
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
print(f"Supabase URL 설정: {bool(supabase_url)}")
print(f"Supabase Key 설정: {bool(supabase_key)}")

if not supabase_url or not supabase_key:
    print("❌ 중요한 환경변수 누락!")
    print("환경변수를 확인하세요: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Import Flask app with detailed error handling
app = None
try:
    print("Flask 앱 import 중...")
    from app import app as flask_app
    app = flask_app
    print("✅ Flask 앱 import 성공")
    
    # Test app creation
    print(f"Flask 앱 이름: {app.name}")
    print(f"Flask 디버그 모드: {app.debug}")
    print(f"Flask 설정 키 수: {len(app.config)}")
    
    # Test route registration
    routes = [rule.rule for rule in app.url_map.iter_rules()]
    print(f"등록된 라우트 수: {len(routes)}")
    print(f"주요 라우트: {[r for r in routes if r in ['/', '/health', '/api/cards']]}")
    
except ImportError as e:
    print(f"❌ 모듈 import 실패: {e}")
    print("설치된 패키지 확인이 필요합니다.")
    traceback.print_exc()
    raise
except Exception as e:
    print(f"❌ Flask 앱 import 실패: {e}")
    print("상세 에러 정보:")
    traceback.print_exc()
    raise

if app is None:
    print("❌ Flask 앱이 None입니다!")
    raise RuntimeError("Flask app initialization failed")

print("=== WSGI 준비 완료 ===")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))