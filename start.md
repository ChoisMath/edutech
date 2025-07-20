# 🚀 에듀테크 컬렉터 실행 가이드

## Windows에서 실행하기

### 방법 1: 배치 파일 사용 (추천)
```bash
# 1. 더블클릭으로 실행
run_app.bat

# 또는 명령 프롬프트에서
.\run_app.bat
```

### 방법 2: Python 직접 실행
```bash
# 가상환경 활성화 (있는 경우)
venv\Scripts\activate

# Flask 앱 실행
python run_app.py
```

### 방법 3: 디버그 모드
```bash
python debug_app.py
```

## 문제 해결

### 1. "did not find executable" 오류
- **원인**: WSL 경로와 Windows 경로 충돌
- **해결**: `run_app.py` 또는 `run_app.bat` 사용

### 2. 모듈 없음 오류
```bash
pip install -r requirements.txt
```

### 3. 환경변수 오류
- `.env.local` 파일 확인
- Supabase URL과 키 설정 확인

### 4. 포트 충돌
- 다른 포트 사용: `python run_app.py --port 8000`
- 또는 기존 프로세스 종료

## 접속 방법
서버 시작 후 브라우저에서:
- http://127.0.0.1:5000
- http://localhost:5000

## 로그 확인
- **브라우저**: F12 → Console 탭
- **서버**: 터미널 출력 확인