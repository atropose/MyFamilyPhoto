const { useState, useMemo, useEffect, useRef } = React;

const MONTH_KO_M = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function MobileTopBar({ onSearch, onMenu, hasActiveFilters }) {
  return (
    <div className="m-topbar">
      <div className="m-topbar-row">
        <div className="m-brand">
          <div className="m-brand-mark"><Icon.LogoFrame /></div>
          <div className="m-brand-name">MyPicManager</div>
        </div>
        <div className="m-actions">
          <button className="icon-btn" onClick={onSearch} aria-label="검색 및 필터">
            <Icon.Search />
            {hasActiveFilters && <span className="dot" />}
          </button>
          <button className="icon-btn" onClick={onMenu} aria-label="메뉴">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveFilterPills({ filters, setFilters, onOpenSearch }) {
  const pills = [];
  if (filters.startDate || filters.endDate) {
    const label = `${filters.startDate || "이전"} ~ ${filters.endDate || "오늘"}`;
    pills.push(
      <button key="d" className="m-fchip active" onClick={() => setFilters({ ...filters, startDate: "", endDate: "" })}>
        {label} <span className="x">×</span>
      </button>
    );
  }
  if (filters.location) {
    pills.push(
      <button key="l" className="m-fchip active" onClick={() => setFilters({ ...filters, location: "" })}>
        📍 {filters.location} <span className="x">×</span>
      </button>
    );
  }
  if (filters.member !== "all") {
    const m = MEMBERS.find(x => x.id === filters.member);
    pills.push(
      <button key="m" className="m-fchip active" onClick={() => setFilters({ ...filters, member: "all" })}>
        {m.name} <span className="x">×</span>
      </button>
    );
  }
  if (filters.media !== "all") {
    pills.push(
      <button key="t" className="m-fchip active" onClick={() => setFilters({ ...filters, media: "all" })}>
        {filters.media === "photo" ? "사진" : "영상"} <span className="x">×</span>
      </button>
    );
  }
  if (pills.length === 0) {
    pills.push(
      <button key="add" className="m-fchip" onClick={onOpenSearch}>
        <Icon.Search /> 검색·필터
      </button>
    );
  }
  return <div className="m-filter-bar">{pills}</div>;
}

function MobileThumb({ photo, onOpen }) {
  return (
    <div className="m-thumb" onClick={() => onOpen(photo)}>
      <PlaceholderImg
        variant={photo.variant}
        pattern={photo.pattern}
        label={photo.label}
        isVideo={photo.type === "video"}
      />
      {photo.type === "video" && (
        <>
          <div className="m-video-badge"><Icon.Play /></div>
          <div className="m-video-duration">{photo.duration}</div>
        </>
      )}
    </div>
  );
}

function MobileGrid({ groups, onOpen }) {
  if (groups.length === 0) {
    return (
      <div className="m-empty">
        <div style={{ fontSize: 34, opacity: 0.4 }}>∅</div>
        <h3>조건에 맞는 사진이 없어요</h3>
        <p>필터를 조정해 다시 검색해보세요.</p>
      </div>
    );
  }
  return (
    <>
      {groups.map(([ym, photos]) => {
        const [y, m] = ym.split("-").map(Number);
        return (
          <section className="m-month" key={ym}>
            <header className="m-month-header">
              <h2 className="m-month-title">{y}년 {MONTH_KO_M[m - 1]}</h2>
              <span className="m-month-count">{photos.length}장</span>
            </header>
            <div className="m-grid">
              {photos.map(p => <MobileThumb key={p.id} photo={p} onOpen={onOpen} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}

function FilterDrawer({ open, draft, setDraft, onClose, onApply, onReset, resultCount }) {
  return (
    <>
      <div className={`m-backdrop ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <div className={`m-drawer ${open ? "show" : ""}`} role="dialog" aria-modal="true">
        <div className="m-drawer-handle" />
        <div className="m-drawer-header">
          <div className="m-drawer-title">검색·필터</div>
          <button className="m-drawer-reset" onClick={onReset}>초기화</button>
        </div>
        <div className="m-drawer-body">

          <div className="m-section">
            <div className="m-section-label">기간</div>
            <div className="m-date-row">
              <input
                className="m-date-input"
                type="date"
                value={draft.startDate}
                onChange={e => setDraft({ ...draft, startDate: e.target.value })}
                aria-label="시작일"
              />
              <span className="m-date-tilde">~</span>
              <input
                className="m-date-input"
                type="date"
                value={draft.endDate}
                onChange={e => setDraft({ ...draft, endDate: e.target.value })}
                aria-label="종료일"
              />
            </div>
          </div>

          <div className="m-section">
            <div className="m-section-label">장소</div>
            <div className="m-loc-wrap">
              <Icon.MapPin />
              <input
                className="m-loc-input"
                type="text"
                placeholder="제주, 서울, 부산…"
                value={draft.location}
                onChange={e => setDraft({ ...draft, location: e.target.value })}
              />
            </div>
          </div>

          <div className="m-section">
            <div className="m-section-label">가족 구성원</div>
            <div className="m-pillrow">
              {MEMBERS.map(m => (
                <button
                  key={m.id}
                  className={`m-pill ${draft.member === m.id ? "active" : ""}`}
                  onClick={() => setDraft({ ...draft, member: m.id })}
                >
                  {m.id !== "all" && (
                    <span className="m-pill-dot" style={{ background: m.color }}>
                      {m.name.slice(-1)}
                    </span>
                  )}
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="m-section">
            <div className="m-section-label">미디어 타입</div>
            <div className="m-seg">
              <button
                className={`m-seg-btn ${draft.media === "all" ? "active" : ""}`}
                onClick={() => setDraft({ ...draft, media: "all" })}
              >전체</button>
              <button
                className={`m-seg-btn ${draft.media === "photo" ? "active" : ""}`}
                onClick={() => setDraft({ ...draft, media: "photo" })}
              ><Icon.Photo /> 사진</button>
              <button
                className={`m-seg-btn ${draft.media === "video" ? "active" : ""}`}
                onClick={() => setDraft({ ...draft, media: "video" })}
              ><Icon.Video /> 영상</button>
            </div>
          </div>

        </div>
        <div className="m-drawer-foot">
          <div className="m-result-mini"><strong>{resultCount.toLocaleString()}</strong>개의 사진</div>
          <button className="m-apply" onClick={onApply}>적용</button>
        </div>
      </div>
    </>
  );
}

function TabBar({ tab, setTab, onTabAction }) {
  const tabs = [
    { id: "gallery", label: "갤러리",
      icon: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="M5 17l4-4 3 3 3-2 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
    { id: "diary", label: "일기",
      icon: <svg viewBox="0 0 24 24" fill="none"><path d="M5 4h9a5 5 0 0 1 5 5v11H9a4 4 0 0 1-4-4V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M5 16h14" stroke="currentColor" strokeWidth="1.7"/></svg> },
    { id: "admin", label: "관리자",
      icon: <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg> },
  ];
  return (
    <div className="m-tabbar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`m-tab ${tab === t.id ? "active" : ""}`}
          onClick={() => onTabAction(t.id)}
        >
          {t.icon}
          <span className="m-tab-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function SideMenu({ open, onClose }) {
  return (
    <div className={`m-menu ${open ? "show" : ""}`} onClick={e => e.stopPropagation()}>
      <button className="m-menu-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7"/></svg>
        가족 프로필
      </button>
      <button className="m-menu-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2 2M15.7 15.7l2 2M6.3 17.7l2-2M15.7 8.3l2-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7"/></svg>
        업로드
      </button>
      <button className="m-menu-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
        타임라인
      </button>
      <div className="m-menu-divider" />
      <button className="m-menu-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .4-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.4-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.4H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.4 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" stroke="currentColor" strokeWidth="1.5"/></svg>
        설정
      </button>
      <button className="m-menu-item danger" onClick={() => { window.location.href = "Login.html"; }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 17l5-5-5-5M20 12H9M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        로그아웃
      </button>
    </div>
  );
}

const EMPTY_FILTERS = { startDate: "", endDate: "", location: "", member: "all", media: "all" };

function MobileGallery() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState("gallery");
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    return ALL_PHOTOS.filter(p => {
      if (filters.media !== "all" && p.type !== filters.media) return false;
      if (filters.member !== "all" && !p.members.includes(filters.member)) return false;
      if (filters.location && !p.location.includes(filters.location.trim())) return false;
      if (filters.startDate && p.date < filters.startDate) return false;
      if (filters.endDate && p.date > filters.endDate) return false;
      return true;
    });
  }, [filters]);

  const draftFiltered = useMemo(() => {
    return ALL_PHOTOS.filter(p => {
      if (draft.media !== "all" && p.type !== draft.media) return false;
      if (draft.member !== "all" && !p.members.includes(draft.member)) return false;
      if (draft.location && !p.location.includes(draft.location.trim())) return false;
      if (draft.startDate && p.date < draft.startDate) return false;
      if (draft.endDate && p.date > draft.endDate) return false;
      return true;
    });
  }, [draft]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const p of filtered) {
      const ym = p.date.slice(0, 7);
      if (!m.has(ym)) m.set(ym, []);
      m.get(ym).push(p);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1700);
  };

  const openDrawer = () => {
    setDraft(filters);
    setDrawerOpen(true);
  };
  const applyDraft = () => {
    setFilters(draft);
    setDrawerOpen(false);
  };
  const resetDraft = () => setDraft(EMPTY_FILTERS);

  const hasActiveFilters =
    filters.startDate || filters.endDate || filters.location ||
    filters.member !== "all" || filters.media !== "all";

  const onTab = (id) => {
    setTab(id);
    if (id === "diary") { window.location.href = "Diary.html"; return; }
    if (id === "admin") { window.location.href = "Admin.html"; return; }
  };

  const onOpenPhoto = (p) => {
    window.location.href = `Detail.html#id=${p.id}`;
  };

  return (
    <div className="m-shell" onClick={() => menuOpen && setMenuOpen(false)}>
      <MobileTopBar
        onSearch={openDrawer}
        onMenu={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
        hasActiveFilters={hasActiveFilters}
      />

      <ActiveFilterPills
        filters={filters}
        setFilters={setFilters}
        onOpenSearch={openDrawer}
      />

      <div className="m-content">
        <MobileGrid groups={groups} onOpen={onOpenPhoto} />
      </div>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <TabBar tab={tab} setTab={setTab} onTabAction={onTab} />

      <FilterDrawer
        open={drawerOpen}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setDrawerOpen(false)}
        onApply={applyDraft}
        onReset={resetDraft}
        resultCount={draftFiltered.length}
      />

      {toast && <div className="m-toast">{toast}</div>}
    </div>
  );
}

function App() {
  return (
    <div className="stage">
      <div className="stage-label">MyPicManager · Gallery · Mobile 390 × 844</div>
      <IOSDevice width={390} height={844}>
        <MobileGallery />
      </IOSDevice>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
