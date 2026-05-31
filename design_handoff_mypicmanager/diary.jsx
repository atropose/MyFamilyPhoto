const { useState, useMemo, useEffect } = React;

// ========== ISO week helpers ==========
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}

function getISOWeekStart(year, week) {
  // ISO 8601: week 1 is the week with the first Thursday
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const w1Mon = new Date(jan4);
  w1Mon.setUTCDate(jan4.getUTCDate() - day + 1);
  const mon = new Date(w1Mon);
  mon.setUTCDate(w1Mon.getUTCDate() + (week - 1) * 7);
  return mon;
}

function fmtDateRange(monday) {
  const d1 = new Date(monday);
  const d2 = new Date(monday);
  d2.setUTCDate(d1.getUTCDate() + 6);
  const m1 = d1.getUTCMonth() + 1;
  const d1n = d1.getUTCDate();
  const m2 = d2.getUTCMonth() + 1;
  const d2n = d2.getUTCDate();
  if (m1 === m2) {
    return `${m1}월 ${d1n}일 (월) – ${d2n}일 (일)`;
  }
  return `${m1}월 ${d1n}일 (월) – ${m2}월 ${d2n}일 (일)`;
}

// ========== Mock diary entries ==========
const DIARY_POOL = [
  "주말에 다 같이 제주로 떠났다. 성산일출봉 일출이 정말 아름다웠고, 아이들이 처음으로 한라봉 따기 체험을 했다. 돌아오는 길에 다들 차에서 잠들었지만 마음이 따뜻했다.",
  "엄마 생신을 맞아 오랜만에 가족 모두 한자리에 모였다. 케이크 앞에서 찍은 사진은 액자에 꼭 걸어두기로 했다. 손자가 카드를 그려드려서 엄마가 눈물을 글썽이셨다.",
  "한강 자전거 길을 따라 처음으로 끝까지 완주했다. 노을이 너무 예뻐서 한참을 멈춰 있었다. 다음엔 도시락도 챙겨와야지.",
  "비가 종일 와서 집에서 영화를 봤다. 거실 카펫에 누워 팝콘을 나눠 먹는 시간이 가장 행복했다. 별 일 없이 지나가는 평일이 새삼 소중하게 느껴진다.",
  "강원도 양양에서 첫 서핑. 파도가 생각보다 셌지만 한 번 일어서니 세상이 달라 보였다. 아이들 웃음소리가 파도 소리를 다 덮었다.",
  "오랜만에 외할머니 댁에 갔다. 텃밭에서 갓 딴 상추로 점심을 차려주셨다. 손주들이 마당에서 뛰노는 모습을 보고 할머니가 “이게 사진 한 장 안 남아서 그렇지, 마음에는 다 남아있다”고 하셨다.",
  "벚꽃이 만개한 윤중로. 매년 같은 자리에서 사진을 찍는 게 우리 가족 전통이 됐다. 작년 사진과 비교해보니 아이들이 부쩍 컸다.",
  "처음으로 가족 캠핑을 떠났다. 텐트 치는 데 한 시간이 걸렸지만, 모닥불 앞에서 들은 밤하늘 이야기는 평생 잊지 못할 것 같다.",
  "남편이 직접 만들어준 김치찌개. 평소엔 무뚝뚝하지만 가끔 이런 모습을 보면 결혼하길 잘했다 싶다. 사진으로 남겨놨다.",
  "친정 어머니가 김장을 도와주러 오셨다. 일은 고되지만 다 같이 둘러앉아 보쌈을 먹는 시간이 1년 중 가장 가족답다.",
  "딸 아이 첫 운동회. 100m 달리기에서 3등을 했다고 자랑스럽게 메달을 보여줬다. 우리 부부도 학부모 계주에 출전했는데 다리가 며칠째 아프다.",
  "오랜만에 도서관 데이트. 책 읽다 잠든 남편 모습을 몰래 찍었다. 이런 평범한 오후가 제일 좋다.",
  "전주에서 한옥 스테이. 마루에 앉아 막걸리 한 잔. 시간이 천천히 흐르는 곳에서 보낸 주말. 다음에도 또 오자고 약속했다.",
  "강아지 두부가 가족이 된 지 100일. 처음 데려왔을 땐 한 손에 쏙 들어왔는데 이제 무릎 위에 올라오면 묵직하다.",
  "엄마와 단둘이 떠난 짧은 여행. 차 안에서 옛날 이야기를 많이 했다. 엄마도 누군가의 딸이었다는 걸 또 한 번 느낀 시간.",
  "남이섬 단풍. 사람이 너무 많아서 사진은 인파 사이로 겨우 건졌지만, 그래도 가을 한가운데를 다 함께 걸은 게 좋았다.",
  "아이들과 처음으로 영화관에서 본 라이언 킹. 큰 화면 무서워할 줄 알았는데 끝까지 집중해서 봤다. 팝콘 봉지가 절반은 카펫에 흩어졌지만.",
  "오랜만에 친구 가족과 더블 데이트. 아이들끼리도 금세 친해져서 어른들은 오랜만에 카페에서 수다를 떨었다.",
];

// 70% of weeks-with-photos get a diary entry, deterministic by hash
function diaryForWeek(weekKey, photos) {
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) hash = ((hash << 5) - hash) + weekKey.charCodeAt(i);
  hash = Math.abs(hash);
  const hasDiary = (hash % 10) < 8;  // 80% have diary
  if (!hasDiary) return null;
  const hasAudio = (hash % 7) < 3;   // ~43% have audio
  const text = DIARY_POOL[hash % DIARY_POOL.length];
  // author: pick first family member of the photo set, fallback to gildong
  const memberIds = Array.from(new Set(photos.flatMap(p => p.members))).filter(id => id !== "slr");
  const author = memberIds[hash % Math.max(1, memberIds.length)] || "gildong";
  const audioSecs = hasAudio ? 30 + (hash % 240) : 0;
  return { text, hasAudio, author, audioSecs };
}

// ========== Build weeks for a year ==========
function buildWeeksForYear(year) {
  // gather photos in that ISO year
  const byKey = new Map();
  for (const p of ALL_PHOTOS) {
    const [y, m, d] = p.date.split("-").map(Number);
    const iso = getISOWeek(new Date(y, m - 1, d));
    if (iso.year !== year) continue;
    const key = `${iso.year}-W${String(iso.week).padStart(2, "0")}`;
    if (!byKey.has(key)) byKey.set(key, { year: iso.year, week: iso.week, key, photos: [] });
    byKey.get(key).photos.push(p);
  }
  if (byKey.size === 0) return [];

  // Determine range of weeks to render — from earliest week to either (a) max week with photos, or (b) current week if this year
  const minWeek = Math.min(...Array.from(byKey.values()).map(g => g.week));
  const maxWeek = Math.max(...Array.from(byKey.values()).map(g => g.week));

  const list = [];
  for (let w = maxWeek; w >= minWeek; w--) {
    const key = `${year}-W${String(w).padStart(2, "0")}`;
    const g = byKey.get(key);
    const monday = getISOWeekStart(year, w);
    if (g) {
      list.push({
        kind: "filled",
        key,
        year, week: w,
        monday,
        photos: g.photos.slice().sort((a, b) => a.date.localeCompare(b.date)),
        diary: diaryForWeek(key, g.photos),
      });
    } else {
      list.push({
        kind: "empty",
        key,
        year, week: w,
        monday,
      });
    }
  }
  return list;
}

// ========== Icons ==========
const DI = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Photo: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="M5 17l4-4 3 3 3-2 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  Video: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 10l5-3v10l-5-3v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  Mic: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Comment: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 12a8 8 0 0 1-12.5 6.6L4 20l1.4-4.5A8 8 0 1 1 21 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  ArrowR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M14 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  PlayMini: () => <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  LogoFrame: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.9"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="M5.5 17.5L10 13l3 2.5 2.5-2 3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Book: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h9a5 5 0 0 1 5 5v11H9a4 4 0 0 1-4-4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M5 16h14" stroke="currentColor" strokeWidth="1.6"/></svg>,
  Grid: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="4" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
};

// ========== Components ==========
function TopNavBar({ showToast }) {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <a className="brand" href="Login.html" title="로그아웃">
          <span className="brand-mark"><DI.LogoFrame /></span>
          <span className="brand-name">MyPicManager</span>
        </a>
        <div className="nav-right">
          <a className="nav-btn" href="Gallery.html"><DI.Grid /> 갤러리</a>
          <a className="nav-btn active" href="Diary.html"><DI.Book /> 일기</a>
          <button className="nav-btn" onClick={() => { window.location.href = "Admin.html"; }}><DI.Shield /> 관리자</button>
          <div className="avatar" title="홍길동">길</div>
        </div>
      </div>
    </nav>
  );
}

function MiniThumb({ photo }) {
  return (
    <div className="wc-thumb">
      <PlaceholderImg
        variant={photo.variant}
        pattern={photo.pattern}
        label={photo.label}
        isVideo={photo.type === "video"}
      />
      {photo.type === "video" && (
        <div className="wc-thumb-video-tag"><DI.PlayMini /></div>
      )}
    </div>
  );
}

function WeekCard({ entry, isCurrent, onOpen }) {
  const { photos, diary, week, monday } = entry;
  const thumbs = photos.slice(0, 4);
  const remaining = photos.length - 4;
  const videoCount = photos.filter(p => p.type === "video").length;
  const photoCount = photos.length - videoCount;
  const author = MEMBERS.find(m => m.id === diary?.author);
  const audioMin = diary?.audioSecs ? Math.floor(diary.audioSecs / 60) : 0;
  const audioSec = diary?.audioSecs ? diary.audioSecs % 60 : 0;

  return (
    <div className="week-card" onClick={() => onOpen(entry)}>
      <div className="wc-thumbs">
        {thumbs.map((p, i) => (
          <div key={p.id} className="wc-thumb" style={{position: 'relative'}}>
            <PlaceholderImg
              variant={p.variant}
              pattern={p.pattern}
              label={p.label}
              isVideo={p.type === "video"}
            />
            {p.type === "video" && (
              <div className="wc-thumb-video-tag"><DI.PlayMini /></div>
            )}
            {i === 3 && remaining > 0 && (
              <div className="wc-thumb-more">+{remaining}</div>
            )}
          </div>
        ))}
        {/* Fill missing slots with empty cells if <4 photos */}
        {Array.from({length: Math.max(0, 4 - thumbs.length)}).map((_, i) => (
          <div key={`f${i}`} className="wc-thumb" style={{background: "var(--ink-100)"}}>
            <svg viewBox="0 0 100 100"><rect width="100" height="100" fill="var(--ink-100)"/></svg>
          </div>
        ))}
      </div>

      <div className="wc-body">
        <div>
          <div className="wc-head">
            <span className="wc-week-no">{entry.year}년 {week}주차</span>
            {isCurrent && <span className="wc-week-this">이번 주</span>}
          </div>
          <div className="wc-week-range">{fmtDateRange(monday)}</div>
          <p className={`wc-preview ${!diary ? "no-text" : ""}`}>
            {diary ? diary.text : "이 주는 일기를 아직 쓰지 않았어요. 사진은 있어요 — 한 줄이라도 남겨보세요."}
          </p>
        </div>

        <div className="wc-foot">
          <span className="wc-stat">
            <DI.Photo /> {photoCount}장
          </span>
          {videoCount > 0 && (
            <span className="wc-stat">
              <DI.Video /> {videoCount}개
            </span>
          )}
          {diary?.hasAudio && (
            <span className="wc-stat audio audio-bars">
              <span className="wf"><span style={{height:6}}/><span style={{height:11}}/><span style={{height:8}}/><span style={{height:14}}/><span style={{height:9}}/></span>
              <DI.Mic /> {audioMin}:{String(audioSec).padStart(2,"0")}
            </span>
          )}
          {author && (
            <span className="wc-author">
              <span className="wc-author-avatar" style={{ background: author.color }}>
                {author.name.slice(-1)}
              </span>
              <span className="wc-author-name">{author.name}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyWeekRow({ entry, onAdd }) {
  return (
    <div className="week-empty" onClick={() => onAdd(entry)}>
      <div className="we-text">
        <span className="we-week-no">{entry.year}년 {entry.week}주차</span>
        <span className="we-range">{fmtDateRange(entry.monday)}</span>
      </div>
      <span className="we-action">기록 추가 <DI.ArrowR /></span>
    </div>
  );
}

function MonthMarker({ year, monthIdx }) {
  const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return (
    <div className="month-marker">
      <span className="month-marker-text">{year}년 {MONTH_KO[monthIdx]}</span>
      <span className="month-marker-rule" />
    </div>
  );
}

// ========== App ==========
function App() {
  const YEARS = [2022, 2023, 2024, 2025];
  // count weeks per year
  const yearCounts = useMemo(() => {
    const c = {};
    for (const y of YEARS) c[y] = buildWeeksForYear(y).filter(w => w.kind === "filled").length;
    return c;
  }, []);

  const defaultYear = useMemo(() => {
    // pick the most recent year with data
    for (let i = YEARS.length - 1; i >= 0; i--) {
      if (yearCounts[YEARS[i]] > 0) return YEARS[i];
    }
    return 2024;
  }, []);

  const [year, setYear] = useState(defaultYear);
  const [toast, setToast] = useState(null);

  const weeks = useMemo(() => buildWeeksForYear(year), [year]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  // Determine which is "current week" (newest week with content in this year)
  const currentKey = weeks.find(w => w.kind === "filled")?.key;

  // Insert month markers when month boundary crosses (going top->down, latest month first)
  const renderRows = [];
  let lastMonth = null;
  for (const w of weeks) {
    const month = w.monday.getUTCMonth();
    if (month !== lastMonth) {
      renderRows.push({ kind: "marker", year: w.year, month });
      lastMonth = month;
    }
    renderRows.push({ kind: "week", entry: w });
  }

  return (
    <div className="shell">
      <TopNavBar showToast={showToast} />

      <div className="container">
        <header className="page-head">
          <div>
            <h1 className="page-title">우리 가족 일기</h1>
            <p className="page-sub">주차별로 모아 보는 가족의 한 주.</p>
          </div>
          <button className="btn-primary" onClick={() => { window.location.href = "Diary-Compose.html"; }}>
            <DI.Plus /> 일기 작성
          </button>
        </header>

        <div className="year-tabs" role="tablist">
          {YEARS.map(y => (
            <button
              key={y}
              className={`year-tab ${y === year ? "active" : ""}`}
              onClick={() => setYear(y)}
            >
              {y}
              {yearCounts[y] > 0
                ? <span className="count-pill">{yearCounts[y]}</span>
                : <span className="empty-mark" title="기록 없음" />}
            </button>
          ))}
        </div>

        {weeks.length === 0 ? (
          <div className="year-empty">
            <div className="ico">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 4h9a5 5 0 0 1 5 5v11H9a4 4 0 0 1-4-4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M5 16h14" stroke="currentColor" strokeWidth="1.6"/></svg>
            </div>
            <h3>{year}년의 일기는 아직 없어요</h3>
            <p>가족과 함께한 한 주를 첫 번째 기록으로 남겨보세요.</p>
            <button className="btn-primary" onClick={() => { window.location.href = "Diary-Compose.html"; }}>
              <DI.Plus /> 일기 작성
            </button>
          </div>
        ) : (
          <div className="timeline">
            {renderRows.map((r, i) => {
              if (r.kind === "marker") {
                return <MonthMarker key={`m${i}`} year={r.year} monthIdx={r.month} />;
              }
              const e = r.entry;
              if (e.kind === "filled") {
                return (
                  <WeekCard
                    key={e.key}
                    entry={e}
                    isCurrent={e.key === currentKey}
                    onOpen={() => showToast("주간 일기 상세 화면은 다음 단계에서 만들어요")}
                  />
                );
              }
              return <EmptyWeekRow key={e.key} entry={e} onAdd={() => { window.location.href = "Diary-Compose.html"; }} />;
            })}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
