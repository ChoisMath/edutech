# 🚀 에듀테크 컬렉터 빠른 시작 가이드

## 로컬 개발 환경 실행

### 1. 기본 실행 (추천)
```bash
python run_app.py
```

### 2. 디버그 모드 실행
```bash
python debug_app.py
```

### 3. Windows 배치 파일 사용
```bash
.\run_app.bat
```

## 환경 설정 확인

### 필수 환경 변수
`.env` 파일에 다음 설정이 있어야 합니다:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 의존성 설치
```bash
pip install -r requirements.txt
```

## 접속 정보
- **일반 사용자**: http://127.0.0.1:5000
- **관리자 페이지**: http://127.0.0.1:5000/admin
- **헬스 체크**: http://127.0.0.1:5000/health

## 기본 비밀번호
- **편집 비밀번호**: `1`
- **관리자 비밀번호**: `admin`

## 문제 해결
자세한 문제 해결은 `TROUBLESHOOTING.md`를 참조하세요.