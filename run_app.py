"""
Windows용 Flask 앱 실행 스크립트
"""
import os
import sys
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

print("=== Windows Flask 앱 시작 ===")
print(f"Python 버전: {sys.version}")
print(f"작업 디렉토리: {os.getcwd()}")

# 환경변수 확인
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

print(f"Supabase URL 설정됨: {bool(supabase_url)}")
print(f"Supabase Key 설정됨: {bool(supabase_key)}")

if not supabase_url or not supabase_key:
    print("\n❌ 환경변수가 설정되지 않았습니다!")
    print("다음 파일을 확인하세요:")
    print("- .env.local")
    print("- .env")
    sys.exit(1)

# Flask 앱 시작
try:
    from app import app
    print("\n✅ Flask 앱 로드 성공")
    print("🚀 서버 시작: http://127.0.0.1:5000")
    print("🔧 디버그 모드: 활성화")
    print("\n브라우저에서 http://127.0.0.1:5000 을 열어주세요")
    print("종료하려면 Ctrl+C를 누르세요\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000)
    
except ImportError as e:
    print(f"❌ 모듈 import 오류: {e}")
    print("\n다음 명령으로 의존성을 설치하세요:")
    print("pip install -r requirements.txt")
    
except Exception as e:
    print(f"❌ Flask 앱 시작 실패: {e}")
    import traceback
    traceback.print_exc()