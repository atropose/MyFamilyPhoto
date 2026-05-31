#!/usr/bin/env bash
# MyPicManager 백엔드 Linux 설치 스크립트
set -e

# 스크립트 위치(backend/)로 이동 — 어디서 실행해도 경로가 올바르게 동작
cd "$(dirname "$0")"

echo "=== MyPicManager Backend 설치 ==="

# python3-venv 없으면 설치 안내 후 종료
if ! python3 -m venv --help > /dev/null 2>&1; then
  echo "[ERROR] python3-venv 가 없습니다. 먼저 설치해주세요:"
  echo "  sudo apt install python3-venv python3-full"
  exit 1
fi

# 가상환경 생성 (activate 스크립트가 없으면 재생성)
if [ ! -f ".venv/bin/activate" ]; then
  rm -rf .venv
  python3 -m venv .venv
  echo "[OK] 가상환경 생성됨"
fi

source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo "[OK] 패키지 설치 완료"

# .env 파일 생성 (없으면)
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "[OK] .env 파일 생성됨 — 값을 확인/수정하세요"
fi

# systemd 서비스 등록
UNIT_DST="/etc/systemd/system/mypicmanager.service"
if [ ! -f "$UNIT_DST" ]; then
  echo "서비스 파일을 복사하려면 sudo 권한이 필요합니다."
  sudo cp mypicmanager.service "$UNIT_DST"
  sudo systemctl daemon-reload
  sudo systemctl enable mypicmanager
  echo "[OK] systemd 서비스 등록 완료"
  echo "    sudo systemctl start mypicmanager  으로 시작하세요"
else
  echo "[SKIP] 서비스 파일이 이미 있습니다: $UNIT_DST"
fi

echo ""
echo "=== 설치 완료 ==="
echo "  sudo systemctl start mypicmanager   # 서비스 시작"
echo "  sudo systemctl status mypicmanager  # 상태 확인"
echo "  journalctl -u mypicmanager -f       # 로그 확인"
