@echo off
echo ========================================
echo   에듀테크 컬렉터 Flask 앱 실행
echo ========================================
echo.

REM 현재 디렉토리 확인
echo 현재 위치: %CD%

REM 가상환경 활성화 (있는 경우)
if exist "venv\Scripts\activate.bat" (
    echo 가상환경 활성화 중...
    call venv\Scripts\activate.bat
) else (
    echo 가상환경이 없습니다. 시스템 Python을 사용합니다.
)

REM Python 버전 확인
echo.
echo Python 정보:
python --version
echo.

REM 필요한 패키지 설치 확인
echo 의존성 확인 중...
pip list | findstr Flask
if %errorlevel% neq 0 (
    echo Flask가 설치되지 않았습니다. 설치 중...
    pip install -r requirements.txt
)

REM Flask 앱 실행
echo.
echo Flask 앱 시작 중...
python run_app.py

pause