const { useState, useMemo, useEffect, useRef } = React;

const MONTH_KO = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function formatKDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}.${String(m).padStart(2,"0")}.${String(d).padStart(2,"0")}`;
}

function TopNav({ search, setSearch, route, setRoute }) {
  const inputRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="topnav">
      <div className="container topnav-inner">
        <a className="brand" href="Login.html" title="로그아웃">
          <div className="brand-mark"><Icon.LogoFrame /></div>
          <div className="brand-name">MyPicManager</div>
        </a>

        <div className="search">
          <Icon.Search />
          <input
            ref={inputRef}
            type="text"
            placeholder="사진, 영상, 사람, 장소 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <kbd>⌘K</kbd>
        </div>

        <div className="nav-right">
          <button
            className={`nav-btn ${route === "gallery" ? "active" : ""}`}
            onClick={() => setRoute("gallery")}
          >
            <Icon.Grid /> 갤러리
          </button>
          <button
            className={`nav-btn ${route === "diary" ? "active" : ""}`}
            onClick={() => setRoute("diary")}
          >
            <Icon.Book /> 일기
          </button>
          <button
            className={`nav-btn ${route === "admin" ? "active" : ""}`}
            onClick={() => setRoute("admin")}
          >
            <Icon.Shield /> 관리자
          </button>
          <div className="avatar" title="홍길동">길</div>
        </div>
      </div>
    </nav>
  );
}

function FilterBar({ filters, setFilters, totalCount, filteredCount }) {
  const setMember = (id) => setFilters({ ...filters, member: id });
  const setMedia = (m) => setFilters({ ...filters, media: m });

  return (
    <div className="filters">
      <div className="container filters-inner">
        <div className="filter-group">
          <span className="filter-label">기간</span>
          <div className="date-range">
            <Icon.Calendar />
            <input
              className="date-input"
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              aria-label="시작일"
            />
            <span className="date-tilde">~</span>
            <input
              className="date-input"
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              aria-label="종료일"
            />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">장소</span>
          <div className="loc-input">
            <Icon.MapPin />
            <input
              type="text"
              placeholder="제주, 서울, 부산…"
              value={filters.location}
              onChange={e => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">가족</span>
          <div className="chips" role="group" aria-label="가족 구성원 필터">
            {MEMBERS.map(m => (
              <button
                key={m.id}
                className={`chip ${filters.member === m.id ? "active" : ""}`}
                onClick={() => setMember(m.id)}
              >
                {m.id !== "all" && (
                  <span className="chip-avatar" style={{ background: m.color }}>
                    {m.name.slice(-1)}
                  </span>
                )}
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">미디어</span>
          <div className="seg">
            <button className={`seg-btn ${filters.media === "all" ? "active" : ""}`} onClick={() => setMedia("all")}>
              전체
            </button>
            <button className={`seg-btn ${filters.media === "photo" ? "active" : ""}`} onClick={() => setMedia("photo")}>
              <Icon.Photo /> 사진
            </button>
            <button className={`seg-btn ${filters.media === "video" ? "active" : ""}`} onClick={() => setMedia("video")}>
              <Icon.Video /> 영상
            </button>
          </div>
        </div>

        <div className="spacer" />

        <div className="result-count">
          <strong>{filteredCount.toLocaleString()}</strong>
          {filteredCount !== totalCount && <> / {totalCount.toLocaleString()}</>}개
        </div>
      </div>
    </div>
  );
}

function Thumb({ photo, onOpen }) {
  return (
    <div
      className="thumb"
      onClick={() => onOpen(photo)}
      data-id={photo.id}
    >
      <PlaceholderImg
        variant={photo.variant}
        pattern={photo.pattern}
        label={photo.label}
        isVideo={photo.type === "video"}
      />
      {photo.type === "video" && (
        <>
          <div className="video-badge"><Icon.Play /></div>
          <div className="video-duration">{photo.duration}</div>
        </>
      )}
      <div className="thumb-loc">{photo.location}</div>
      <div className="thumb-grad" />
      <div className="thumb-meta">
        <div className="thumb-filename">{photo.filename}</div>
        <div className="thumb-date">{formatKDate(photo.date)} · {photo.time}</div>
      </div>
    </div>
  );
}

function MonthSection({ ym, photos, onOpen, refSetter }) {
  const [y, m] = ym.split("-").map(Number);
  return (
    <section className="month-section" ref={refSetter} data-ym={ym}>
      <header className="month-header">
        <h2>{y}년 {MONTH_KO[m - 1]}</h2>
        <span className="count">{photos.length}장</span>
        <span className="rule" />
      </header>
      <div className="grid">
        {photos.map(p => <Thumb key={p.id} photo={p} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function JumpRail({ groups, activeYm, onJump }) {
  // groups: [["2024-05", [...]], ...]
  const byYear = {};
  for (const [ym, items] of groups) {
    const y = ym.slice(0, 4);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push({ ym, m: Number(ym.slice(5)), count: items.length });
  }
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
  return (
    <aside className="jump-rail" aria-label="날짜로 이동">
      {years.map(y => (
        <React.Fragment key={y}>
          <div className="jump-year">{y}</div>
          {byYear[y].map(({ ym, m, count }) => (
            <button
              key={ym}
              className={`jump-month ${ym === activeYm ? "active" : ""}`}
              onClick={() => onJump(ym)}
            >
              <div>{MONTH_KO[m - 1]}</div>
              <div className="jump-count">{count}</div>
            </button>
          ))}
        </React.Fragment>
      ))}
    </aside>
  );
}

function App() {
  const [search, setSearch] = useState("");
  const [route, setRoute] = useState("gallery");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    location: "",
    member: "all",
    media: "all",
  });
  const [toast, setToast] = useState("");
  const monthRefs = useRef({});
  const [activeYm, setActiveYm] = useState(null);

  // Apply filters
  const filtered = useMemo(() => {
    return ALL_PHOTOS.filter(p => {
      if (filters.media !== "all" && p.type !== filters.media) return false;
      if (filters.member !== "all" && !p.members.includes(filters.member)) return false;
      if (filters.location && !p.location.includes(filters.location.trim())) return false;
      if (filters.startDate && p.date < filters.startDate) return false;
      if (filters.endDate && p.date > filters.endDate) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${p.location} ${p.filename} ${p.label} ${p.members.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, search]);

  // Group by ym
  const groups = useMemo(() => {
    const m = new Map();
    for (const p of filtered) {
      const ym = p.date.slice(0, 7);
      if (!m.has(ym)) m.set(ym, []);
      m.get(ym).push(p);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Track active month via IntersectionObserver
  useEffect(() => {
    if (groups.length === 0) return;
    setActiveYm(groups[0][0]);
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveYm(visible[0].target.dataset.ym);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 }
    );
    Object.values(monthRefs.current).forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [groups]);

  const onJump = (ym) => {
    const el = monthRefs.current[ym];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 128;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const onOpenPhoto = (p) => {
    window.location.href = `Detail.html#id=${p.id}`;
  };

  // Route switch
  useEffect(() => {
    if (route === "diary") { window.location.href = "Diary.html"; return; }
    if (route === "admin") { window.location.href = "Admin.html"; return; }
  }, [route]);

  return (
    <div className="shell">
      <TopNav search={search} setSearch={setSearch} route={route} setRoute={setRoute} />
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        totalCount={ALL_PHOTOS.length}
        filteredCount={filtered.length}
      />

      <main className="container content">
        {groups.length === 0 ? (
          <div className="empty">
            <div style={{fontSize: 36, opacity: 0.4}}>∅</div>
            <h3>조건에 맞는 사진이 없어요</h3>
            <p>필터를 조정해 다시 검색해보세요.</p>
          </div>
        ) : (
          groups.map(([ym, photos]) => (
            <MonthSection
              key={ym}
              ym={ym}
              photos={photos}
              onOpen={onOpenPhoto}
              refSetter={(el) => { monthRefs.current[ym] = el; }}
            />
          ))
        )}
      </main>

      {groups.length > 0 && (
        <JumpRail groups={groups} activeYm={activeYm} onJump={onJump} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
