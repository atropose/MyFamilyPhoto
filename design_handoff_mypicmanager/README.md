# MyPicManager — 디자인 핸드오프 패키지

> 가족 사진 관리 앱의 **하이파이 인터랙티브 프로토타입**입니다.
> 이 폴더 안의 HTML/CSS/JS 파일들은 **"의도된 UI와 동작을 보여주는 디자인 레퍼런스"** 이며,
> 실제 제품 코드로는 여러분의 코드베이스(React/Vue/Swift/Flutter 등) 위에서 다시 구현해주세요.
> 환경이 정해지지 않았다면, 이 자료가 React + Vite 기반과 가장 잘 맞습니다.

---

## 0. 빠른 시작 (Claude Code in VS Code)

### A. 프로젝트 받기
1. VS Code에서 새 폴더를 만든다: `mypicmanager-app/`
2. 다운로드 받은 `design_handoff_mypicmanager.zip`을 풀어 `design_handoff_mypicmanager/` 안에 넣는다.
3. VS Code에서 그 부모 폴더(`mypicmanager-app/`)를 연다.

### B. Claude Code에게 줄 첫 프롬프트 (그대로 복붙)

```
나는 가족 사진 관리 앱 'MyPicManager'를 만들고 있어.
./design_handoff_mypicmanager/ 안에 8개 화면의 HTML 프로토타입과 README가 있어.
먼저 README.md를 읽고, 각 .html 파일을 살펴봐.

다음 작업을 순서대로 진행해줘:
1) 프로젝트를 Vite + React + TypeScript로 초기화한다 (이 폴더의 부모 디렉토리에서).
2) design_handoff/ 의 디자인 토큰(색상, 폰트, radius, shadow)을
   src/styles/tokens.css 로 옮기고 Pretendard Variable을 link한다.
3) 8개 화면 각각을 src/pages/ 아래에 React 컴포넌트로 옮긴다 — 
   파일 구조는 README의 "Screens" 섹션을 그대로 따른다.
4) React Router로 화면 간 이동을 연결한다 (README "Navigation Map" 참고).
5) 더미 데이터(ALL_PHOTOS, MEMBERS)는 src/lib/mockData.ts 로 옮긴다.
   추후 API와 분리되도록 한 곳에 모은다.

각 단계 시작 전에 무엇을 할지 한 줄로 알려주고, 끝나면 변경된 파일 목록을 보여줘.
화면을 옮길 때는 한 번에 하나씩만 작업해 — 끝나면 내가 확인할 수 있게 멈춰줘.
```

### C. 이어지는 작업 팁
- 각 화면 컴포넌트는 한 화면씩 옮기게 시키세요. Claude Code가 한꺼번에 많이 바꾸면 오류 추적이 어렵습니다.
- API 연결은 `src/lib/api.ts`에 한 곳으로 모으도록 시키세요. 지금은 `mockData`를 쓰고 있어요.
- 모바일 갤러리는 iOS 프레임에 감싸져 있는데, **실제 앱에서는 프레임을 빼고** 컴포넌트만 사용해야 합니다 (`<MobileGallery />`).
- `app.jsx`(로그인) 안의 데모 패스코드는 `1234`로 하드코딩되어 있어요. 실제 인증으로 교체하세요.

---

## 1. 충실도 (Fidelity)

**하이파이 (Hi-Fi).** 모든 색상, 폰트 크기, spacing, 반경, 그림자, 인터랙션이 의도된 최종 값입니다.
픽셀 단위로 그대로 옮길 수 있도록 디자인 토큰까지 명시되어 있습니다.

---

## 2. 화면 구성 (Screens)

| # | 화면 | 파일 | 뷰포트 | 핵심 동작 |
|---|------|------|--------|----------|
| 1 | 로그인 (가족 패스코드) | `Login.html` (`app.jsx`) | 모바일·PC 공용 | 4자리 PIN 입력 → Gallery로 이동 |
| 2 | 갤러리 홈 (PC) | `Gallery.html` (`gallery.jsx`) | 1280px | 5열 그리드, 필터, 날짜 점프 |
| 3 | 갤러리 홈 (모바일) | `Gallery-Mobile.html` (`gallery-mobile.jsx`) | 390×844 (iPhone) | 2열 그리드, 바텀 시트 필터, 탭바 |
| 4 | 사진 상세 보기 | `Detail.html` (`detail.jsx`) | 반응형 | 다크 몰입형 뷰어, 스와이프, 메타 드로어 |
| 5 | 주간 일기 목록 | `Diary.html` (`diary.jsx`) | 반응형 | 연도 탭, ISO 주차 타임라인 카드 |
| 6 | 일기 작성 | `Diary-Compose.html` (`compose.jsx`) | 반응형 | 주차 선택, 음성 업로드/녹음, 텍스트 |
| 7 | 관리자 패널 | `Admin.html` (`admin.jsx`) | 1280px | 스캔 실행 + 비가족 사진 검토 |

`gallery-data.jsx`는 모든 화면이 공유하는 더미 데이터(`ALL_PHOTOS`, `MEMBERS`, `PALETTES`, `PATTERNS`, `PlaceholderImg`, `Icon`)입니다.

---

## 3. 디자인 토큰

### 3.1 컬러
```css
/* Brand */
--blue:        #4F7FFF;   /* primary */
--blue-600:    #3A65DE;
--blue-50:     #EEF3FF;
--orange:      #FF8C42;   /* accent */
--orange-50:   #FFF1E6;
--orange-100:  #FFE2CB;

/* Neutral (ink scale) */
--ink-900: #1B1F26;
--ink-700: #3A414D;
--ink-500: #6B7280;
--ink-400: #9AA0AB;
--ink-300: #C8CDD4;
--ink-200: #E5E7EB;
--ink-100: #F1F2F5;
--ink-50:  #F7F8FA;

/* Surfaces */
--bg:        #F8F9FA;        /* 일반 페이지 */
--bg-admin:  #F4F5F8;        /* 어드민 */
--bg-warm:   oklch(0.97 0.012 70);  /* 일기 (따뜻함) */
--card:      #FFFFFF;
--paper:     #FFFDF8;        /* 다이어리 종이 */

/* Status */
--success: #1F8A5B;
--success-50: oklch(0.96 0.05 150);
--danger:  #E5484D;
--danger-50: oklch(0.95 0.04 25);
--warning: #C99220;
--warning-50: oklch(0.96 0.06 90);

/* Dark (Detail viewer only) */
--dark-bg:   #111111;
--dark-bg-2: #1A1A1B;
--dark-line: rgba(255,255,255,0.14);
```

### 3.2 타이포그래피
- **폰트**: Pretendard Variable
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" />
  ```
- **font-feature-settings**: `"ss06", "ss07"` (한글 타이포 미세 조정)
- **letter-spacing**: 본문 -0.005em / 제목 -0.01em ~ -0.025em
- **숫자**: `font-variant-numeric: tabular-nums` (카운터·시간·날짜 표시 시)
- **스케일**:

| 용도 | size | weight | line-height |
|------|------|--------|-------------|
| Hero/page title | 28-32px | 800 | 1.15 |
| Section title | 16-20px | 700 | 1.2 |
| Card title | 15-19px | 700 | 1.2 |
| Body | 14px | 400-500 | 1.5-1.55 |
| Caption / meta | 11-13px | 500 | 1.4 |
| Label (uppercase) | 11px | 700 / letter-spacing 0.06-0.08em | 1.4 |
| Diary entry text | 16px | 400 | 32px (룰드 라인) |

### 3.3 Radius
| 토큰 | 값 | 용도 |
|------|----|------|
| sm | 8px | 작은 칩, 키패드 |
| md | 12px | 버튼, 입력 |
| lg | 16px | 카드 |
| xl | 20-24px | 큰 모달, 다이어리 종이 |
| full | 999px | 알약, 칩 |

### 3.4 Shadow
```css
--shadow-card:       0 1px 2px rgba(20,24,36,0.04), 0 6px 18px -10px rgba(20,24,36,0.08);
--shadow-card-hover: 0 6px 24px -10px rgba(20,24,36,0.18);
--shadow-btn:        0 1px 2px rgba(20,24,36,0.06);
--shadow-btn-primary:0 6px 14px -6px rgba(79,127,255,0.5);
--shadow-modal:      0 20px 50px -15px rgba(20,24,36,0.18);
```

### 3.5 Spacing & Grid
- 컨테이너 최대 폭: **1280px** (PC), **920px** (다이어리 목록), **760px** (다이어리 작성)
- 좌우 패딩: 32px (PC) / 16-24px (모바일)
- 그리드 gap: PC 갤러리 6px / 모바일 3px / 어드민 12px / 상세 핸드오프 18-32px
- 모바일 hit target 최소: **44px**

---

## 4. 네비게이션 맵

```
Login (PIN 1234)
   └─→ Gallery (PC) ⇄ Gallery (Mobile, 390px 기준 자동 전환은 미구현)
         ├─→ Detail (#id=<photoId>)  ← 썸네일 클릭
         ├─→ Diary
         │     ├─→ Diary-Compose      ← "+ 일기 작성" 버튼 또는 빈 주 카드
         │     │      └─→ (저장 후) Diary
         └─→ Admin                     ← "관리자" 메뉴
```

- 모바일 갤러리에서는 하단 탭 바 + 햄버거 메뉴로 동일하게 이동
- 로고 클릭 = 로그아웃(=Login으로)
- 상세 보기에서 키보드: `←/→` 이동, `Esc` 닫기, `Space` 영상 토글, `i` 정보, 모바일 좌우 스와이프

---

## 5. 핵심 컴포넌트 명세

> **재사용 컴포넌트 5개**가 거의 모든 화면에 등장합니다. 이걸 먼저 만들고 페이지에 끼우면 빠릅니다.

### 5.1 `<TopNav />`
- 좌측: 로고 마크(32px gradient blue) + "MyPicManager" 16px/700
- 우측: 갤러리/일기/관리자 nav-btn + 가족 아바타(32px circle)
- sticky, top: 0, height 64px, `rgba(255,255,255,0.88) + backdrop-blur(14px)`
- 활성 메뉴는 `--blue-50` 배경 + `--blue` 텍스트
- **`white-space: nowrap`** 잊지 말 것 (한글 두 줄 줄바꿈 방지)

### 5.2 `<PlaceholderImg variant pattern label isVideo />`
- 줄무늬/체크/원/도트 등 6종 패턴 × 8종 팔레트 SVG
- 가족 사진 더미 — 실제 사진으로 교체할 때까지 사용
- `gallery-data.jsx` 안에 정의됨, 그대로 옮기면 됨

### 5.3 `<Thumbnail photo onOpen />`
- 정사각형, border-radius 8px (모바일 6px)
- 호버: translateY(-2px) + 그림자 + 어두운 그라디언트 + 파일명·날짜 오버레이 + 장소 칩
- 영상: 우상단 재생 뱃지, 우하단 길이 (호버시 길이 숨김)

### 5.4 `<Chip>` / `<Pill>`
- 알약 형태, height 28-36px, border-radius 999px 또는 8px
- 활성: 흰색 배경 + 살짝 그림자 + 보더 (또는 brand 컬러 풀필)
- 가족 멤버 칩은 작은 원형 아바타 + 이름

### 5.5 `<Button>`
| variant | 배경 | 텍스트 | 보더 | 그림자 |
|---------|------|--------|------|--------|
| primary | `--blue` | 흰색 | — | `--shadow-btn-primary` |
| outline | 흰색 | `--ink-700` | `--ink-200` | — |
| ghost | 투명 | `--ink-500` | — | — |
| danger | 흰색 | `--danger` | `--danger-200` | — |
| primary disabled | `--ink-200` | `--ink-400` | — | none |

- 높이: 38-46px / sm 32px
- :active → `transform: scale(0.97)`

---

## 6. 상태 관리 (필요한 것들)

| 상태 | 위치 | 비고 |
|------|------|------|
| `currentUser` | 전역 | 인증 후 가족 멤버 정보 |
| `allPhotos[]` | API/캐시 | 갤러리·일기·상세·관리자 모두 사용 |
| `filters` | 갤러리 페이지 로컬 | `{startDate, endDate, location, member, media}` |
| `selectedPhotoId` | URL hash | 상세 보기 진입점 (`#id=p0001`) |
| `diaryEntries[]` | API/캐시 | 주차별 일기 (텍스트 + 음성 URL) |
| `composeDraft` | 로컬 (autosave) | 일기 작성 중인 텍스트 + 음성 |
| `scanState` | 어드민 전역 | `{connected, scanning, progress, currentFile}` |
| `reviewQueue` | 어드민 API | 미검토 / 숨김 처리됨 분리 |

자동 저장(draft)·로그인 토큰은 localStorage에 두는 것을 추천.

---

## 7. 인터랙션 디테일

### 로그인 (Login)
- 데모 패스코드 `1234` → 실제 API 호출로 교체
- 오답시: 흔들림(shake 420ms cubic-bezier), 자동 리셋
- 정답시: 그린 체크 → 갤러리로 1초 후 이동
- 키보드 0-9 / Backspace 지원

### 갤러리 (PC)
- 필터: 즉시 적용 (디바운스 권장)
- 검색: `⌘K`로 포커스
- 우측 점프 레일: IntersectionObserver로 현재 월 자동 하이라이트, 클릭 시 smooth scroll (top 보정 128px = sticky nav + filter bar 높이)
- 썸네일 호버: translate + 그림자 + 메타 페이드인 (180ms)

### 갤러리 (모바일)
- 검색 아이콘 → 바텀 시트 슬라이드 업 (320ms cubic-bezier(0.2, 0.8, 0.2, 1))
- 활성 필터 칩 행: 가로 스크롤
- 햄버거 메뉴: 우상단 절대 위치 드롭다운, 바깥 클릭으로 닫힘

### 사진 상세
- 좌우 화살표: 슬라이드 트랜지션 180ms
- 화면 점/숨김(`chrome-hidden`): 미구현이지만 클래스 토글로 가능
- 영상 진행: 100ms 인터벌로 시뮬레이션 (실제 구현에서는 native video element 사용)
- 정보 드로어: 하단에서 슬라이드, max-height 70vh

### 일기 목록
- ISO 8601 주 기준 (월요일 시작)
- 사진이 있는 주 = 카드, 없는 주 = 점선 (sparse)
- 월 변경 지점에 마커
- 호버: 좌측 도트(파란 링) → 파란 풀필로 전환

### 일기 작성
- 자동저장: 입력 후 700ms debounce
- 텍스트 영역: `line-height: 32px` 줄노트 백그라운드 + auto-resize
- 4가지 프롬프트 칩: 클릭 시 본문에 추가
- 글자수: 2000자 상한, 1400자/1800자에서 색 변화

### 어드민
- 연결 LED: 펄스 링 애니메이션 1.8s
- 스캔 진행: 100ms 인터벌, 줄무늬 stripes 애니메이션
- 썸네일 그리드: 단일 탭 = 선택, 호버 시 액션 오버레이
- 1장 이상 선택 시 하단에 sticky 다크 액션 바 등장

---

## 8. 반응형 브레이크포인트

| 화면 | mobile (< 720px) | tablet (720-980px) | desktop (≥ 980px) |
|------|------------------|--------------------|--------------------|
| Gallery | 2열 그리드, 바텀시트 필터, 탭바 | 3열 | 5열 + 점프 레일 |
| Diary | 카드 세로 스택 | 동일 | 좌측 타임라인 라인 |
| Compose | 좁은 패딩 | 동일 | 760px 중앙 정렬 |
| Detail | 화살표 숨김, 스와이프 | 화살표 숨김 | 화살표 + 메타 그리드 2열 |
| Admin | 단일 컬럼 + 2열 그리드 | 동일 | 2열 그리드 + 5열 리뷰 |

> 모바일 갤러리(`Gallery-Mobile.html`)는 별도 페이지로 만들었지만, 실제 구현에서는 **하나의 컴포넌트로 합치고 viewport에 따라 분기**시키는 것을 추천합니다.

---

## 9. 에셋

- **아이콘**: 모두 인라인 SVG (외부 라이브러리 의존 X). 원본은 24×24 viewBox, stroke 1.6-1.9px, `currentColor` 사용.
- **이미지**: 더미 `PlaceholderImg` SVG. 실제로는 GIF/PNG/JPG/WebP 모두 지원해야 함.
- **폰트**: Pretendard Variable (jsdelivr CDN). 자체 호스팅하려면 [github.com/orioncactus/pretendard](https://github.com/orioncactus/pretendard) 참고.
- **로고 마크**: 인라인 SVG (`LogoFrame`). 추후 브랜드 로고 SVG로 교체.

---

## 10. 미구현 / 다음 단계

이 디자인 핸드오프에 포함되지 *않은* 화면들:
- 온보딩 (3-step)
- 가족 만들기 / 합류
- 회원가입 (이메일 / 소셜)
- 사진 업로드 UI
- 가족 멤버 프로필 / 설정
- 일기 상세 보기 (카드 클릭 시)
- 알림 / 댓글 / 좋아요

실제 제품으로 가려면 위 화면들을 추가로 디자인하거나, Claude Code에게 "기존 디자인 시스템에 맞춰 만들어줘"로 위임할 수 있습니다.

---

## 11. 파일 목록

### HTML 페이지 (7개)
- `Login.html`
- `Gallery.html`
- `Gallery-Mobile.html`
- `Detail.html`
- `Diary.html`
- `Diary-Compose.html`
- `Admin.html`

### React 컴포넌트 (.jsx) — Babel 표준 빌드 사용
- `app.jsx` — 로그인
- `gallery.jsx` — 갤러리 PC
- `gallery-mobile.jsx` — 갤러리 모바일
- `detail.jsx` — 상세 뷰어
- `diary.jsx` — 일기 목록
- `compose.jsx` — 일기 작성
- `admin.jsx` — 관리자 패널
- `gallery-data.jsx` — **공유** 더미 데이터 + `PlaceholderImg` + `Icon`
- `ios-frame.jsx` — iOS 디바이스 프레임 (모바일 갤러리에만 사용, 실제 앱 구현 시 제거)

### CSS (8개)
- `styles.css` (로그인), `gallery.css`, `gallery-mobile.css`, `detail.css`, `diary.css`, `compose.css`, `admin.css`

### 도움말
- `README.md` (이 파일)

---

## 12. 라이선스 / 디자인 출처

이 디자인은 본 프로젝트를 위해 새로 만든 오리지널 작업입니다. Pretendard 폰트만 SIL OFL 1.1 라이선스로 외부 의존성이 있습니다.
