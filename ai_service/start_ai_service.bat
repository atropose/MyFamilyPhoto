@echo off
chcp 65001 > nul
title MyPicManager AI Service (포트 8100)

:: 가상 환경 활성화 (있을 경우)
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

:: 서비스 시작
echo [AI Service] 시작 중... (http://0.0.0.0:8100)
python main.py

pause
