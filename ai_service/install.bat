@echo off
chcp 65001 > nul
title AI Service 설치

echo [설치] Python 가상 환경 생성 중...
python -m venv .venv
call .venv\Scripts\activate.bat

echo [설치] 패키지 설치 중...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [완료] 설치가 완료되었습니다.
echo start_ai_service.bat 을 실행하여 서비스를 시작하세요.
pause
