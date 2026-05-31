const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ========== Helpers ==========
const ASPECTS = [
  { w: 4032, h: 3024, label: "4032 × 3024" },  // 4:3 landscape (DSLR)
  { w: 3024, h: 4032, label: "3024 × 4032" },  // 4:3 portrait
  { w: 3000, h: 2000, label: "3000 × 2000" },  // 3:2 landscape
  { w: 2000, h: 3000, label: "2000 × 3000" },  // 3:2 portrait
  { w: 1920, h: 1080, label: "1920 × 1080" },  // 16:9 wide (video usually)
  { w: 2400, h: 2400, label: "2400 × 2400" },  // square
];
const VIDEO_ASPECTS = [
  { w: 1920, h: 1080, label: "1920 × 1080" },
  { w: 1080, h: 1920, label: "1080 × 1920" },
];

function detailsFor(photo) {
  const seed = parseInt(photo.id.slice(1), 10) || 0;
  const pool = photo.type === "video" ? VIDEO_ASPECTS : ASPECTS;
  const dim = pool[seed % pool.length];
  const sizeMB = (photo.type === "video"
    ? 12 + (seed % 80) * 1.4
    : 1.4 + (seed % 50) * 0.18
  ).toFixed(1);
  const hasGps = (seed % 7) !== 0; // ~14% missing
  const camera = ["iPhone 15 Pro", "Galaxy S24", "Canon EOS R6", "Sony α7 IV", "iPhone 13"][seed % 5];
  return { ...dim, sizeMB, hasGps, camera };
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_KO_D = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function formatFullDate(iso, time) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m-1, d);
  const dow = DOW[date.getDay()];
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  const ampm = hh < 12 ? "오전" : "오후";
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${y}년 ${MONTH_KO_D[m-1]} ${d}일 (${dow}) · ${ampm} ${h12}:${String(mm).padStart(2,"0")}`;
}

function pad2(n) { return String(n).padStart(2, "0"); }
function fmtVideoTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${pad2(s)}`;
}

// ========== Detail icons ==========
const D = {
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  EyeOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M10.6 6.1A10.6 10.6 0 0 1 12 6c5 0 9 4 10 6-0.4 0.8-1.4 2.2-3 3.5M6.5 7.5C4.6 8.8 3.4 10.5 2 12c1 2 5 6 10 6 1.9 0 3.6-0.6 5-1.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M9.5 9.5a3.5 3.5 0 0 0 5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  ArrowL: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ArrowR: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Chevron: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar2: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  MapPin2: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0M15 6.5a3.5 3.5 0 0 1 0 6M21.5 19a5.5 5.5 0 0 0-4.5-5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  Ruler: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M9 3v6M15 3v6M3 9h6M3 15h6M15 21v-6M9 21v-6M21 9h-6M21 15h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Play: () => <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>,
  PlaySm: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Volume: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Fullscreen: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

// ========== Filtered photo set (mirrors Gallery's filtering, no filters here) ==========
// In this demo, photos navigate through the full ALL_PHOTOS list (newest first).
const PHOTOS = ALL_PHOTOS;

// ========== Video player (simulated) ==========
function VideoControls({ duration, playing, setPlaying }) {
  // parse duration "m:ss" to seconds
  const totalSecs = useMemo(() => {
    const [m, s] = (duration || "0:30").split(":").map(Number);
    return (m * 60) + s;
  }, [duration]);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setSecs(s => {
        const next = s + 0.1;
        if (next >= totalSecs) { setPlaying(false); return 0; }
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [playing, totalSecs, setPlaying]);

  const pct = (secs / totalSecs) * 100;

  return (
    <div className="video-controls">
      <button
        className={`video-play-center ${playing ? "playing" : ""}`}
        onClick={() => setPlaying(p => !p)}
        aria-label={playing ? "일시정지" : "재생"}
      >
        {playing ? <D.Pause /> : <D.Play />}
      </button>
      <div className="video-bar">
        <div
          className="video-progress"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const p = (e.clientX - r.left) / r.width;
            setSecs(Math.max(0, Math.min(1, p)) * totalSecs);
          }}
        >
          <div className="video-progress-fill" style={{ width: pct + "%" }}>
            <div className="video-progress-thumb" style={{ left: "100%" }} />
          </div>
        </div>
        <div className="video-row">
          <button className="video-icon-btn" onClick={() => setPlaying(p => !p)} aria-label={playing ? "일시정지" : "재생"}>
            {playing ? <D.Pause /> : <D.PlaySm />}
          </button>
          <span className="video-time">{fmtVideoTime(secs)} / {fmtVideoTime(totalSecs)}</span>
          <div className="video-spacer" />
          <D.Volume />
          <div className="volume-track"><div className="volume-fill" style={{ width: "62%" }} /></div>
          <button className="video-icon-btn" aria-label="전체화면"><D.Fullscreen /></button>
        </div>
      </div>
    </div>
  );
}

// ========== Media display ==========
function MediaView({ photo, slideDir, playing, setPlaying }) {
  const det = detailsFor(photo);
  // Compute display size: fit within stage minus padding
  // Use aspect ratio to size; CSS handles max constraints
  const style = {
    aspectRatio: `${det.w} / ${det.h}`,
    width: "min(90vw, calc((100vh - 200px) * " + (det.w / det.h) + "))",
    maxHeight: "calc(100vh - 200px)",
    maxWidth: "calc(100vw - 160px)",
  };
  if (window.innerWidth <= 720) {
    style.maxWidth = "calc(100vw - 24px)";
    style.maxHeight = "calc(100vh - 180px)";
  }

  return (
    <div className={`media-wrap ${slideDir ? "slide-" + slideDir : ""}`}>
      <div className="media" style={style}>
        <PlaceholderImg
          variant={photo.variant}
          pattern={photo.pattern}
          label={photo.label}
          isVideo={photo.type === "video"}
        />
        {photo.type === "video" && (
          <VideoControls duration={photo.duration || "0:30"} playing={playing} setPlaying={setPlaying} />
        )}
      </div>
    </div>
  );
}

// ========== Info drawer ==========
function InfoDrawer({ photo, show, onClose }) {
  const det = detailsFor(photo);
  const memberNames = photo.members.map(id => MEMBERS.find(m => m.id === id)).filter(Boolean);

  return (
    <div className={`info-drawer ${show ? "show" : ""}`} role="dialog" aria-label="사진 정보">
      <div className="info-head">
        <div className="title">
          사진 정보
          <span className="filename">{photo.filename}</span>
        </div>
        <button className="info-close" onClick={onClose} aria-label="정보 닫기">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 18l6-6 6 6M6 6l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <div className="info-icon"><D.Calendar2 /></div>
          <div className="info-body">
            <div className="info-label">촬영 일시</div>
            <div className="info-value">{formatFullDate(photo.date, photo.time)}</div>
          </div>
        </div>

        <div className="info-item">
          <div className="info-icon"><D.MapPin2 /></div>
          <div className="info-body">
            <div className="info-label">장소</div>
            {det.hasGps ? (
              <div className="info-value">
                {photo.location}
                <span className="sub">GPS · 추정 위치</span>
              </div>
            ) : (
              <div className="info-value muted">위치 정보 없음</div>
            )}
          </div>
        </div>

        <div className="info-item">
          <div className="info-icon"><D.Users /></div>
          <div className="info-body">
            <div className="info-label">가족 구성원</div>
            <div className="info-value">
              {memberNames.map(m => (
                <span className="member-chip" key={m.id}>
                  <span className="member-chip-dot" style={{ background: m.color }}>
                    {m.name.slice(-1)}
                  </span>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="info-item">
          <div className="info-icon"><D.File /></div>
          <div className="info-body">
            <div className="info-label">파일</div>
            <div className="info-value">
              {photo.filename}
              <span className="sub">{det.sizeMB} MB · {photo.type === "video" ? "QuickTime" : "JPEG"}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <div className="info-icon"><D.Ruler /></div>
          <div className="info-body">
            <div className="info-label">해상도</div>
            <div className="info-value">
              {det.label}
              <span className="sub">{(det.w * det.h / 1_000_000).toFixed(1)} 메가픽셀</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <div className="info-icon"><D.Camera /></div>
          <div className="info-body">
            <div className="info-label">카메라</div>
            <div className="info-value">
              {det.camera}
              {photo.type === "video" && <span className="sub">길이 {photo.duration}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Main viewer ==========
function App() {
  // Read photo id from hash. Default to first.
  const initialIdx = useMemo(() => {
    const hash = window.location.hash;
    const m = hash.match(/id=([a-z0-9]+)/i);
    if (m) {
      const i = PHOTOS.findIndex(p => p.id === m[1]);
      if (i >= 0) return i;
    }
    return 0;
  }, []);

  const [idx, setIdx] = useState(initialIdx);
  const [slideDir, setSlideDir] = useState(null); // 'left' | 'right' | null
  const [infoOpen, setInfoOpen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [playing, setPlaying] = useState(false);
  const touchRef = useRef(null);

  const photo = PHOTOS[idx];

  useEffect(() => {
    // Reset video play state on photo change
    setPlaying(false);
  }, [idx]);

  useEffect(() => {
    // Update hash so it's bookmarkable
    if (photo) history.replaceState(null, "", "#id=" + photo.id);
  }, [photo]);

  const showToast = (msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 1800);
  };

  const goPrev = useCallback(() => {
    if (idx <= 0) return;
    setSlideDir("right");
    setTimeout(() => {
      setIdx(i => Math.max(0, i - 1));
      setSlideDir(null);
    }, 180);
  }, [idx]);

  const goNext = useCallback(() => {
    if (idx >= PHOTOS.length - 1) return;
    setSlideDir("left");
    setTimeout(() => {
      setIdx(i => Math.min(PHOTOS.length - 1, i + 1));
      setSlideDir(null);
    }, 180);
  }, [idx]);

  const goClose = () => {
    if (window.history.length > 1 && document.referrer) {
      window.history.back();
    } else {
      window.location.href = "Gallery.html";
    }
  };

  const goDownload = () => {
    showToast(`${photo.filename} 다운로드를 시작했어요`, "success");
  };

  const goHide = () => {
    setShowHideConfirm(false);
    showToast(`${photo.filename}을(를) 숨김 처리했어요`, "success");
    setTimeout(() => {
      if (idx < PHOTOS.length - 1) goNext(); else goPrev();
    }, 200);
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (showHideConfirm) {
        if (e.key === "Escape") setShowHideConfirm(false);
        return;
      }
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") {
        if (infoOpen) setInfoOpen(false);
        else goClose();
      }
      else if (e.key === " " && photo.type === "video") {
        e.preventDefault();
        setPlaying(p => !p);
      }
      else if (e.key.toLowerCase() === "i") setInfoOpen(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, infoOpen, photo, showHideConfirm]);

  // Touch swipe
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    const start = touchRef.current;
    if (!start) return;
    const end = e.changedTouches[0];
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    const dt = Date.now() - start.t;
    touchRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  if (!photo) {
    return <div className="empty"><h3>사진을 찾을 수 없어요</h3><p>주소가 만료되었을 수 있습니다.</p></div>;
  }

  return (
    <div
      className={`viewer ${chromeHidden ? "chrome-hidden" : ""} ${infoOpen ? "info-open" : ""}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="topbar">
        <div className="top-left">
          <div className="counter-pill">
            <strong>{idx + 1}</strong> / {PHOTOS.length}
          </div>
          {photo.type === "video" && <div className="media-badge">영상 · {photo.duration}</div>}
        </div>
        <div className="top-right">
          <button className="gbtn" onClick={goDownload} title="다운로드 (D)">
            <D.Download />
          </button>
          <button className="gbtn danger" onClick={() => setShowHideConfirm(true)} title="숨김">
            <D.EyeOff />
          </button>
          <button className="gbtn" onClick={goClose} title="닫기 (Esc)">
            <D.X />
          </button>
        </div>
      </div>

      <div className="stage-area">
        <MediaView photo={photo} slideDir={slideDir} playing={playing} setPlaying={setPlaying} />
      </div>

      <button
        className="arrow prev"
        onClick={goPrev}
        disabled={idx === 0}
        aria-label="이전 사진"
      ><D.ArrowL /></button>
      <button
        className="arrow next"
        onClick={goNext}
        disabled={idx === PHOTOS.length - 1}
        aria-label="다음 사진"
      ><D.ArrowR /></button>

      <div className="bottombar">
        <div
          className="bottom-handle"
          onClick={() => setInfoOpen(v => !v)}
          role="button"
          aria-expanded={infoOpen}
        >
          <div className="bh-main">
            <div className="bh-icon">
              {photo.type === "video" ? <D.PlaySm /> : <D.File />}
            </div>
            <div className="bh-text">
              <div className="bh-filename">{photo.filename}</div>
              <div className="bh-meta">
                {photo.date.replaceAll("-", ".")} · {photo.time} · {photo.location}
              </div>
            </div>
          </div>
          <div className="bh-chevron"><D.Chevron /></div>
        </div>
      </div>

      <InfoDrawer photo={photo} show={infoOpen} onClose={() => setInfoOpen(false)} />

      <div className="hint-hud">
        <kbd>←</kbd><kbd>→</kbd> 이동 · <kbd>i</kbd> 정보 · <kbd>Esc</kbd> 닫기
        {photo.type === "video" && <> · <kbd>Space</kbd> 재생</>}
      </div>

      {toast && (
        <div className={`toast ${toast.kind || ""}`}>{toast.msg}</div>
      )}

      {showHideConfirm && (
        <div className="modal-backdrop" onClick={() => setShowHideConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>이 사진을 숨길까요?</h3>
            <p>숨김 처리된 사진은 일반 갤러리에서 보이지 않습니다. 관리자 페이지에서 다시 복구할 수 있어요.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowHideConfirm(false)}>취소</button>
              <button className="btn danger" onClick={goHide}>숨김 처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
