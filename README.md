# MyPicManager — 가족 프라이빗 미디어 서버

가족 구성원의 핸드폰·SLR 카메라 사진·영상을 Linux PC에서 통합 관리하는 프라이빗 웹 앱.

---

## 시스템 구성

```
[외부 인터넷]
    ↓ DDNS / 포트 포워딩
[공유기]
    ↓
[Linux PC — 상시 가동]   :8000
  FastAPI 백엔드 + React SPA
  SQLite DB + 썸네일 캐시
    ↓ (LAN 내부, 스캔 시에만)
[Windows PC — 필요 시 가동]   :8100
  InsightFace AI 서비스 (RTX 4060)
```

---

## 디렉터리 구조

```
FamilyPhoto/
├── backend/          # FastAPI 서버 (Linux PC에서 실행)
├── mypicmanager/     # React 프론트엔드 (빌드 결과물 → dist/)
├── ai_service/       # Windows AI 추론 서비스
└── README.md
```

---

## 1. Linux PC — 백엔드 설치

### 사전 요구사항

- Python 3.11+
- FFmpeg (`sudo apt install ffmpeg`)
- Node.js 20+ (프론트엔드 빌드 시)

### 설치

```bash
cd /home/YOUR_USER/FamilyPhoto/backend

# 가상환경 + 패키지 설치 + systemd 등록
chmod +x install_linux.sh
./install_linux.sh

# .env 파일 수정
nano .env
```

**`.env` 주요 항목:**

| 키 | 설명 | 예시 |
|----|------|------|
| `MEDIA_ROOT` | 원본 미디어 루트 폴더 | `/mnt/photos` |
| `AI_SERVICE_URL` | Windows AI 서비스 주소 | `http://192.168.1.100:8100` |
| `DEFAULT_PASSCODE` | 초기 패스코드 (첫 실행 시만 적용) | `1234` |

### 서비스 시작

```bash
sudo systemctl start mypicmanager
sudo systemctl status mypicmanager
journalctl -u mypicmanager -f   # 실시간 로그
```

---

## 2. Linux PC — 프론트엔드 빌드

```bash
cd /home/YOUR_USER/FamilyPhoto/mypicmanager
npm install
npm run build
# → dist/ 폴더 생성됨 (백엔드가 자동으로 서빙)
```

---

## 3. Linux PC — Nginx 설정 (권장)

```bash
sudo cp backend/nginx.conf /etc/nginx/sites-available/mypicmanager
sudo ln -s /etc/nginx/sites-available/mypicmanager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`nginx.conf` 내 `YOUR_DOMAIN_OR_IP`와 `atropose`를 실제 값으로 수정하세요.

**Let's Encrypt SSL (선택):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d myfamily.duckdns.org
```

---

## 4. Windows PC — AI 서비스 설치

### 사전 요구사항

- Python 3.11+
- CUDA 12.x + cuDNN (RTX 4060용)
- NVIDIA 드라이버 최신 버전

### 설치

```
ai_service\install.bat  더블클릭
```

### 서비스 시작

```
ai_service\start_ai_service.bat  더블클릭
```

브라우저에서 `http://localhost:8100/health` 접속 시 `{"status":"ok"}` 응답이 오면 정상.

> **참고:** AI 서비스는 스캔이 필요한 경우에만 켜면 됩니다. 평소에는 꺼도 됩니다.

---

## 5. 공유기 설정 (외부 접근)

1. **DDNS 등록**: DuckDNS (`myfamily.duckdns.org`) 등 무료 서비스 이용
2. **포트 포워딩**: 외부 포트 `80`(또는 `443`) → Linux PC 내부 IP `:8000`(또는 `:80` Nginx 사용 시)
3. Windows AI 서비스(`:8100`)는 **외부에 노출하지 마세요** (LAN 전용)

---

## 6. 미디어 폴더 구조 (권장)

```
/mnt/photos/
├── 홍길동/          ← 핸드폰 (가족 이름별 폴더 — 갤러리 필터에 반영됨)
├── 홍영희/
├── 홍철수/
└── SLR/
      ├── 2024-03/
      └── 2024-04/
```

---

## 7. 첫 실행 순서

1. 서비스 시작 후 브라우저에서 `http://<Linux IP>:8000` 접속
2. 패스코드 입력 (기본: `1234`, Admin에서 변경 가능)
3. **Admin → 전체 스캔 실행** — 미디어 폴더를 처음 색인
4. (선택) Windows AI 서비스 켠 후 **미분석 파일 AI 재분석** 실행
5. **Admin → 사진 검토** 탭에서 얼굴 없는 사진 숨김/유지 결정

---

## 8. 개발 환경 실행

```bash
# 백엔드 (터미널 1)
cd backend
python -m venv .venv && .venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 프론트엔드 (터미널 2)
cd mypicmanager
npm install
npm run dev   # → http://localhost:5173 (API는 :8000으로 프록시)
```

---

## 9. 주요 API 엔드포인트

| 경로 | 설명 |
|------|------|
| `POST /api/auth/login` | 패스코드 로그인 |
| `GET /api/media` | 미디어 목록 (필터·페이징) |
| `GET /api/media/{id}/thumbnail` | 썸네일 이미지 |
| `GET /api/media/{id}/stream` | 영상 스트리밍 (Range 지원) |
| `GET /api/diaries` | 주간 일기 목록 |
| `POST /api/diaries` | 일기 저장 (multipart) |
| `POST /api/scan/full` | 전체 스캔 실행 |
| `GET /api/scan/events` | 스캔 진행 상황 SSE |
| `GET /api/admin/review` | 검토 대기 사진 목록 |
