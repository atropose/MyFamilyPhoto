const { useState, useMemo, useEffect, useRef, useCallback } = React;

// ========== Icons ==========
const A = {
  LogoFrame: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.9"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="M5.5 17.5L10 13l3 2.5 2.5-2 3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Grid: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="4" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Book: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h9a5 5 0 0 1 5 5v11H9a4 4 0 0 1-4-4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M5 16h14" stroke="currentColor" strokeWidth="1.6"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 4v5h5M8 20v-5H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Scan: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  PlusFile: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 3v6h6M10 13h4M12 11v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Sparkle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5L8 8M16 16l2.5 2.5M5.5 18.5L8 16M16 8l2.5-2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>,
  Stop: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>,
  EyeOff: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M10.6 6.1A10.6 10.6 0 0 1 12 6c5 0 9 4 10 6-0.4 0.8-1.4 2.2-3 3.5M6.5 7.5C4.6 8.8 3.4 10.5 2 12c1 2 5 6 10 6 1.9 0 3.6-0.6 5-1.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M9.5 9.5a3.5 3.5 0 0 0 5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Restore: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 1 2.6 6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M3 21v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Face: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10.5" r="1" fill="currentColor"/><circle cx="15" cy="10.5" r="1" fill="currentColor"/><path d="M8.5 15.5c1 1 2.2 1.5 3.5 1.5s2.5-0.5 3.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  FaceX: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Settings: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M19 12a7 7 0 0 0-0.1-1.3l2-1.6-2-3.5-2.4 1a7 7 0 0 0-2.3-1.3l-0.4-2.5h-4l-0.4 2.5a7 7 0 0 0-2.3 1.3l-2.4-1-2 3.5 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 0.1 1.3l-2 1.6 2 3.5 2.4-1a7 7 0 0 0 2.3 1.3l0.4 2.5h4l0.4-2.5a7 7 0 0 0 2.3-1.3l2.4 1 2-3.5-2-1.6A7 7 0 0 0 19 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  Pc: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  ChevD: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ArrowR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M14 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ========== Top Nav ==========
function TopNavA({ showToast }) {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <a className="brand" href="Login.html" title="로그아웃">
          <span className="brand-mark"><A.LogoFrame /></span>
          <span className="brand-name">MyPicManager</span>
        </a>
        <div className="nav-right">
          <a className="nav-btn" href="Gallery.html"><A.Grid /> 갤러리</a>
          <a className="nav-btn" href="Diary.html"><A.Book /> 일기</a>
          <a className="nav-btn active" href="Admin.html"><A.Shield /> 관리자</a>
          <div className="avatar" title="홍길동">길</div>
        </div>
      </div>
    </nav>
  );
}

// ========== Mock review items ==========
// Build a separate set of items: photos lacking family match. Use a deterministic subset of ALL_PHOTOS
// plus some additional generated items so the counts feel realistic.
function buildReviewSet(kind) {
  // kind: 'unreviewed' | 'hidden'
  const items = [];
  const r = (n) => ((n * 9301 + 49297) % 233280) / 233280;
  const total = kind === "unreviewed" ? 127 : 43;
  for (let i = 0; i < total; i++) {
    const variant = Math.floor(r(i + (kind === "hidden" ? 99 : 7)) * PALETTES.length);
    const pattern = PATTERNS[Math.floor(r(i * 3 + 11) * PATTERNS.length)];
    const labelPool = [["SCAN", "STOCK", "DOC", "RECEIPT", "AD", "WEB"], ["WALLPAPER", "ICON", "MEME", "SCREENSHOT"]];
    const pool = labelPool[Math.floor(r(i * 5) * labelPool.length)];
    const label = pool[Math.floor(r(i * 7) * pool.length)];
    const faceCount = r(i * 11) < 0.55 ? 0 : Math.floor(r(i * 13) * 4) + 1; // many w/ 0 faces
    const faceMatched = faceCount > 0 && r(i * 17) < 0.3; // sometimes unknown person matches a family member after all
    const fileSize = (0.2 + r(i * 19) * 5).toFixed(1);
    const dateY = 2023 + Math.floor(r(i * 23) * 2);
    const dateM = 1 + Math.floor(r(i * 29) * 12);
    const dateD = 1 + Math.floor(r(i * 31) * 27);
    items.push({
      id: `${kind[0]}${String(i).padStart(3, "0")}`,
      variant, pattern, label,
      faceCount, faceMatched,
      filename: `IMG_${5000 + i * 7}.jpg`,
      reason: faceCount === 0
        ? "얼굴 감지 안 됨"
        : faceMatched
          ? "가족 부분 일치"
          : "가족 외 인물",
      size: fileSize,
      date: `${dateY}-${String(dateM).padStart(2,"0")}-${String(dateD).padStart(2,"0")}`,
    });
  }
  return items;
}

// ========== Helpers ==========
function fmtNum(n) { return n.toLocaleString("ko-KR"); }
function fmtSince(date) {
  const diff = (Date.now() - date) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

// ========== Components ==========
function ConnCard({ connected, onToggle, lastSeen }) {
  return (
    <div className={`card conn-card ${connected ? "ok" : "bad"}`}>
      <div className={`conn-led ${connected ? "ok" : "bad"}`} />
      <div className="conn-body">
        <div className="conn-row1">
          <span className="conn-title">Windows AI 분석 서비스</span>
          <span className={`conn-pill ${connected ? "ok" : "bad"}`}>
            {connected ? <><A.Check /> 연결됨</> : "연결 안 됨"}
          </span>
        </div>
        <div className={`conn-desc ${connected ? "" : "bad"}`}>
          {connected
            ? "192.168.1.142 · v2.4.1 · Windows 11 Pro"
            : "Windows PC를 켜고 MyPicManager Service가 실행 중인지 확인해주세요"}
        </div>
        <div className="conn-meta">
          <span>마지막 응답 {fmtSince(lastSeen)}</span>
          <span className="dot" />
          <span>{connected ? "Ping 12 ms" : "Ping —"}</span>
          <span className="dot" />
          <span>{connected ? "GPU 가속 활성" : "GPU 가속 —"}</span>
        </div>
      </div>
      <div className="conn-action">
        <button className="btn btn-outline btn-sm" onClick={onToggle} title="연결 상태 토글 (데모)">
          <A.Refresh /> {connected ? "연결 끊기" : "재연결"}
        </button>
      </div>
    </div>
  );
}

function StatsCard({ total, pending, lastScan }) {
  const analyzed = total - pending;
  const pct = total > 0 ? (analyzed / total) * 100 : 0;
  return (
    <div className="card stats-card">
      <div className="stats-title">스캔 통계</div>
      <div className="stats-row">
        <div className="stat-big">{fmtNum(total)}<span className="unit">개</span></div>
        <div className="stat-delta">미분석 {fmtNum(pending)}</div>
      </div>
      <div className="stats-sub">
        <span>분석 완료 <strong>{fmtNum(analyzed)}</strong></span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="stats-bar">
        <div className="stats-bar-fill" style={{ width: pct + "%" }} />
        <div className="stats-bar-pending" style={{ left: pct + "%", right: 0 }} />
      </div>
      <div className="stats-bar-legend">
        <span><span className="legend-sw" style={{background: "var(--blue)"}} /> AI 분석 완료</span>
        <span><span className="legend-sw" style={{background: "var(--amber)", opacity: 0.6}} /> 대기 중</span>
      </div>
      <div style={{marginTop: 12, fontSize: 11.5, color: "var(--ink-400)", display: "flex", justifyContent: "space-between"}}>
        <span>마지막 전체 스캔</span>
        <span style={{fontVariantNumeric: "tabular-nums", color: "var(--ink-700)"}}>{lastScan}</span>
      </div>
    </div>
  );
}

function ScanProgress({ progress, currentFile, onStop }) {
  return (
    <div className="progress-card">
      <div className="p-head">
        <div className="p-label">
          <div className="p-spinner" />
          <span>전체 스캔 진행 중</span>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <span className="p-pct">{progress.pct.toFixed(1)}%</span>
          <button className="btn btn-outline btn-sm" onClick={onStop}><A.Stop /> 중지</button>
        </div>
      </div>
      <div className="p-track">
        <div className="p-track-fill" style={{ width: progress.pct + "%" }}>
          <div className="p-track-stripe" />
        </div>
      </div>
      <div className="p-foot">
        <span>처리 중: <span className="file">{currentFile}</span></span>
        <span>{fmtNum(progress.done)} / {fmtNum(progress.total)} · 남은 시간 약 {progress.eta}</span>
      </div>
    </div>
  );
}

function ReviewCard({ item, selected, onToggle, onHide, onKeep, viewKind }) {
  const faceClass = item.faceCount === 0 ? "zero" : item.faceMatched ? "match" : "unknown";
  return (
    <div
      className={`r-card ${selected ? "selected" : ""}`}
      onClick={(e) => { if (e.target.closest('.cbox') || e.target.closest('.r-act')) return; onToggle(item.id); }}
    >
      <PlaceholderImg
        variant={item.variant}
        pattern={item.pattern}
        label={item.label}
        isVideo={false}
      />

      <div className="r-top">
        <button
          className={`cbox ${selected ? "checked" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
          aria-label="선택 토글"
        >
          {selected && <A.Check />}
        </button>
        <span className={`face-badge ${faceClass}`}>
          {item.faceCount === 0 ? <A.FaceX /> : <A.Face />}
          얼굴 {item.faceCount}개
        </span>
      </div>

      <div className="r-actions">
        {viewKind === "unreviewed" ? (
          <>
            <button className="r-act danger" onClick={(e) => { e.stopPropagation(); onHide(item.id); }}>
              <A.EyeOff /> 숨김
            </button>
            <button className="r-act" onClick={(e) => { e.stopPropagation(); onKeep(item.id); }}>
              <A.Check /> 유지
            </button>
          </>
        ) : (
          <button className="r-act" onClick={(e) => { e.stopPropagation(); onKeep(item.id); }}>
            <A.Restore /> 복구
          </button>
        )}
      </div>

      <div className="r-bottom">
        <span className="fname">{item.filename}</span>
        <span className="reason">{item.reason}</span>
      </div>
    </div>
  );
}

// ========== App ==========
function App() {
  const [connected, setConnected] = useState(true);
  const [lastSeenAt] = useState(Date.now() - 1000 * 60 * 2); // 2 min ago
  const [stats, setStats] = useState({
    total: 45_872,
    pending: 1_234,
    lastScan: "2026.05.22 23:11",
  });

  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, pct: 0, eta: "—" });
  const [currentFile, setCurrentFile] = useState("");

  // Review
  const [view, setView] = useState("unreviewed"); // 'unreviewed' | 'hidden'
  const unreviewed = useMemo(() => buildReviewSet("unreviewed"), []);
  const hidden = useMemo(() => buildReviewSet("hidden"), []);
  const items = view === "unreviewed" ? unreviewed : hidden;

  const [hiddenIds, setHiddenIds] = useState(new Set());     // ids removed from unreviewed (treated as hidden)
  const [restoredIds, setRestoredIds] = useState(new Set()); // ids removed from hidden
  const [keptIds, setKeptIds] = useState(new Set());         // ids kept (also removed from unreviewed)
  const [selected, setSelected] = useState(new Set());

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 1800);
  };

  // Filter visible items (after local actions)
  const visibleItems = useMemo(() => {
    if (view === "unreviewed") {
      return items.filter(i => !hiddenIds.has(i.id) && !keptIds.has(i.id));
    }
    return items.filter(i => !restoredIds.has(i.id));
  }, [items, view, hiddenIds, keptIds, restoredIds]);

  const unreviewedRemaining = unreviewed.length - hiddenIds.size - keptIds.size;
  const hiddenRemaining = hidden.length - restoredIds.size + hiddenIds.size;

  // Reset selection when switching tab
  useEffect(() => { setSelected(new Set()); }, [view]);

  // ============= Scan simulation =============
  const startScan = (mode) => {
    const total = mode === "full" ? stats.total : mode === "new" ? 420 : stats.pending;
    if (mode === "ai" && !connected) {
      showToast("AI 서비스가 연결되어 있지 않습니다");
      return;
    }
    setScanning(true);
    setScanMode(mode);
    setProgress({ done: 0, total, pct: 0, eta: "—" });
  };

  useEffect(() => {
    if (!scanning) return;
    let id;
    const tick = () => {
      setProgress(p => {
        if (p.done >= p.total) {
          setScanning(false);
          setStats(s => ({
            ...s,
            pending: scanMode === "ai" ? 0 : Math.max(0, s.pending - Math.floor(p.total * 0.6)),
            lastScan: new Date().toISOString().slice(0,16).replace("T", " ").replace(/-/g,".")
          }));
          showToast("스캔이 완료되었습니다", "success");
          return p;
        }
        // simulate file names
        const fileNum = Math.floor(p.done + Math.random() * 12 + 1);
        setCurrentFile(`IMG_${4000 + fileNum}.jpg`);
        const step = Math.max(1, Math.floor(p.total / 80));
        const done = Math.min(p.total, p.done + step);
        const pct = (done / p.total) * 100;
        const remaining = p.total - done;
        const etaSec = Math.max(1, Math.floor(remaining * 0.001));
        const eta = etaSec > 60 ? `${Math.floor(etaSec/60)}분 ${etaSec % 60}초` : `${etaSec}초`;
        return { done, total: p.total, pct, eta };
      });
    };
    id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [scanning, scanMode]);

  const stopScan = () => {
    setScanning(false);
    showToast("스캔을 중지했습니다");
  };

  // ============= Review actions =============
  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(visibleItems.map(i => i.id)));
  const clearSelection = () => setSelected(new Set());

  const hideOne = (id) => {
    setHiddenIds(prev => { const n = new Set(prev); n.add(id); return n; });
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast("숨김 처리했습니다", "success");
  };
  const keepOne = (id) => {
    setKeptIds(prev => { const n = new Set(prev); n.add(id); return n; });
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast("가족 사진으로 유지합니다");
  };
  const restoreOne = (id) => {
    setRestoredIds(prev => { const n = new Set(prev); n.add(id); return n; });
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    showToast("갤러리에 복구했습니다", "success");
  };

  const bulkHide = () => {
    setHiddenIds(prev => { const n = new Set(prev); selected.forEach(id => n.add(id)); return n; });
    showToast(`${selected.size}장을 숨김 처리했습니다`, "success");
    setSelected(new Set());
  };
  const bulkKeep = () => {
    setKeptIds(prev => { const n = new Set(prev); selected.forEach(id => n.add(id)); return n; });
    showToast(`${selected.size}장을 가족 사진으로 유지합니다`);
    setSelected(new Set());
  };
  const bulkRestore = () => {
    setRestoredIds(prev => { const n = new Set(prev); selected.forEach(id => n.add(id)); return n; });
    showToast(`${selected.size}장을 갤러리에 복구했습니다`, "success");
    setSelected(new Set());
  };

  const allSelected = selected.size > 0 && selected.size === visibleItems.length;

  return (
    <div className="shell">
      <TopNavA showToast={showToast} />

      <div className="container">
        <header className="page-head">
          <div>
            <h1 className="page-title">
              <span className="crumb">관리자 · </span>대시보드
            </h1>
            <p className="page-sub">파일 스캔 실행과 비가족 사진 필터링을 관리해요</p>
          </div>
          <div className="signed-in">
            <span className="ko-dot" />
            홍길동(관리자)로 로그인 됨
          </div>
        </header>

        {/* ===== Scan section ===== */}
        <section className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title"><span className="num">1</span> 미디어 스캔</h2>
            </div>
            <span className="section-sub">파일 변화 감지와 AI 분석을 직접 실행하세요</span>
          </div>

          <div className="scan-grid">
            <div style={{display: "flex", flexDirection: "column", gap: 12}}>
              <ConnCard
                connected={connected}
                onToggle={() => setConnected(c => !c)}
                lastSeen={lastSeenAt}
              />
              <div className="card action-card">
                <div className="row">
                  <button className="btn btn-primary" disabled={scanning} onClick={() => startScan("full")}>
                    <A.Scan /> 전체 스캔 실행
                  </button>
                  <button className="btn btn-outline" disabled={scanning} onClick={() => startScan("new")}>
                    <A.PlusFile /> 새 파일만 스캔
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={!connected || scanning}
                    onClick={() => startScan("ai")}
                    title={!connected ? "AI 서비스가 연결되어 있지 않습니다" : ""}
                  >
                    <A.Sparkle /> 미분석 파일 AI 분석
                  </button>
                </div>
                {scanning && (
                  <ScanProgress
                    progress={progress}
                    currentFile={currentFile}
                    onStop={stopScan}
                  />
                )}
              </div>
            </div>

            <StatsCard total={stats.total} pending={stats.pending} lastScan={stats.lastScan} />
          </div>
        </section>

        {/* ===== Review section ===== */}
        <section className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title"><span className="num">2</span> 비가족 사진 검토</h2>
            </div>
            <span className="section-sub">AI가 가족이 아니라고 판단한 사진을 확인하고 숨길 수 있습니다</span>
          </div>

          <div className="review-toolbar">
            <div className="tabs">
              <button
                className={`tab ${view === "unreviewed" ? "active" : ""}`}
                onClick={() => setView("unreviewed")}
              >
                미검토 <span className="count">{fmtNum(unreviewedRemaining)}</span>
              </button>
              <button
                className={`tab ${view === "hidden" ? "active" : ""}`}
                onClick={() => setView("hidden")}
              >
                숨김 처리됨 <span className="count">{fmtNum(hiddenRemaining)}</span>
              </button>
            </div>
            <div className="tb-spacer" />
            {selected.size > 0 ? (
              <span className="selected-info">
                <span className="num">{selected.size}</span>장 선택됨
              </span>
            ) : (
              <span className="selected-info" style={{color: "var(--ink-400)"}}>
                썸네일을 탭하거나 체크박스로 선택
              </span>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={allSelected ? clearSelection : selectAll}
              disabled={visibleItems.length === 0}
            >
              {allSelected ? "선택 해제" : "전체 선택"}
            </button>
            {view === "unreviewed" ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={bulkHide}
                disabled={selected.size === 0}
              >
                <A.EyeOff /> 선택 항목 숨김 처리
              </button>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={bulkRestore}
                disabled={selected.size === 0}
              >
                <A.Restore /> 선택 항목 복구
              </button>
            )}
          </div>

          {visibleItems.length === 0 ? (
            <div className="r-empty">
              <div className="ico"><A.Check /></div>
              <h3>
                {view === "unreviewed"
                  ? "모두 검토했어요"
                  : "숨김 처리된 사진이 없어요"}
              </h3>
              <p>
                {view === "unreviewed"
                  ? "새로운 미검토 사진이 생기면 여기에 나타나요"
                  : "숨김 처리된 사진은 이곳에서 다시 복구할 수 있어요"}
              </p>
            </div>
          ) : (
            <div className="review-grid">
              {visibleItems.slice(0, 30).map(it => (
                <ReviewCard
                  key={it.id}
                  item={it}
                  selected={selected.has(it.id)}
                  onToggle={toggleSelect}
                  onHide={hideOne}
                  onKeep={view === "unreviewed" ? keepOne : restoreOne}
                  viewKind={view}
                />
              ))}
            </div>
          )}

          {visibleItems.length > 30 && (
            <div style={{textAlign: "center", marginTop: 20, color: "var(--ink-500)", fontSize: 13}}>
              {fmtNum(visibleItems.length - 30)}장 더 있어요 · 데모에서는 30장까지만 표시
            </div>
          )}
        </section>

        <div style={{height: 40}} />
      </div>

      {/* Sticky bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="desc"><span className="num">{selected.size}</span>장 선택됨</span>
          <div className="bb-divider" />
          {view === "unreviewed" ? (
            <>
              <button onClick={bulkKeep}><A.Check /> 가족 사진으로 유지</button>
              <button className="danger" onClick={bulkHide}><A.EyeOff /> 숨김 처리</button>
            </>
          ) : (
            <button onClick={bulkRestore}><A.Restore /> 갤러리에 복구</button>
          )}
          <button className="clear" onClick={clearSelection}>선택 해제</button>
        </div>
      )}

      {toast && <div className={`toast ${toast.kind || ""}`}>{toast.msg}</div>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
