const { useState, useMemo, useEffect, useRef, useCallback } = React;

// ========== ISO week helpers (shared with diary.jsx logic) ==========
function getISOWeekC(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}
function getISOWeekStartC(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const w1Mon = new Date(jan4);
  w1Mon.setUTCDate(jan4.getUTCDate() - day + 1);
  const mon = new Date(w1Mon);
  mon.setUTCDate(w1Mon.getUTCDate() + (week - 1) * 7);
  return mon;
}
function fmtRangeC(monday) {
  const d1 = new Date(monday);
  const d2 = new Date(monday);
  d2.setUTCDate(d1.getUTCDate() + 6);
  const m1 = d1.getUTCMonth() + 1, d1n = d1.getUTCDate();
  const m2 = d2.getUTCMonth() + 1, d2n = d2.getUTCDate();
  if (m1 === m2) return `${m1}월 ${d1n}일 (월) ~ ${d2n}일 (일)`;
  return `${m1}월 ${d1n}일 (월) ~ ${m2}월 ${d2n}일 (일)`;
}

// Generate ISO weeks per month for a given year
function weeksByMonth(year) {
  const out = {}; // monthIdx -> [{week, monday, fmtMd}]
  // Iterate through ISO weeks 1..53
  for (let w = 1; w <= 53; w++) {
    const mon = getISOWeekStartC(year, w);
    // Skip if this week's Thursday is not in this year
    const thu = new Date(mon); thu.setUTCDate(mon.getUTCDate() + 3);
    if (thu.getUTCFullYear() !== year) continue;
    const monthIdx = thu.getUTCMonth();
    if (!out[monthIdx]) out[monthIdx] = [];
    out[monthIdx].push({
      week: w,
      monday: mon,
      label: `${mon.getUTCMonth()+1}/${mon.getUTCDate()}`,
    });
  }
  return out;
}

// Build set of "weeks with existing entries" (anything where photos exist)
function weeksWithEntries(year) {
  const s = new Set();
  for (const p of ALL_PHOTOS) {
    const [y, m, d] = p.date.split("-").map(Number);
    const iso = getISOWeekC(new Date(y, m - 1, d));
    if (iso.year === year) s.add(iso.week);
  }
  return s;
}

// Gather photos in a given week (for live preview)
function photosForWeek(year, week) {
  return ALL_PHOTOS.filter(p => {
    const [y, m, d] = p.date.split("-").map(Number);
    const iso = getISOWeekC(new Date(y, m - 1, d));
    return iso.year === year && iso.week === week;
  });
}

// ========== Icons ==========
const C = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Chev: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevL: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevR: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Mic: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Record: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>,
  Play: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Pause: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h11l3 3v13H5V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 4v6h7V4M8 20v-7h8v7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  Check: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ========== Week Picker ==========
function WeekPicker({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(selected.year);
  const monthsMap = useMemo(() => weeksByMonth(year), [year]);
  const withEntries = useMemo(() => weeksWithEntries(year), [year]);
  const MONTH_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  return (
    <div>
      <button className={`week-pick-trigger ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
        <div className="wpt-main">
          <span className="wpt-icon"><C.Calendar /></span>
          <span className="wpt-text">
            <span className="wpt-line1">{selected.year}년 {selected.week}주차</span>
            <span className="wpt-line2">{fmtRangeC(selected.monday)}</span>
          </span>
        </div>
        <span className="wpt-chev"><C.Chev /></span>
      </button>

      {open && (
        <div className="week-pick-panel">
          <div className="wpp-head">
            <span className="wpp-year">{year}년</span>
            <div className="wpp-nav">
              <button className="wpp-nav-btn" onClick={() => setYear(y => y - 1)} disabled={year <= 2022}><C.ChevL /></button>
              <button className="wpp-nav-btn" onClick={() => setYear(y => y + 1)} disabled={year >= 2026}><C.ChevR /></button>
            </div>
          </div>
          <div className="wpp-months">
            {Object.keys(monthsMap).map(midx => {
              const m = Number(midx);
              return (
                <div key={m} className="wpp-month">
                  <div className="wpp-month-name">{MONTH_KO[m]}</div>
                  <div className="wpp-weeks">
                    {monthsMap[m].map(w => {
                      const isActive = (selected.year === year && selected.week === w.week);
                      const has = withEntries.has(w.week);
                      return (
                        <button
                          key={w.week}
                          className={`wpp-week ${has ? "has-entry" : ""} ${isActive ? "active" : ""}`}
                          onClick={() => {
                            onSelect({ year, week: w.week, monday: w.monday });
                            setOpen(false);
                          }}
                          title={`${year}년 ${w.week}주차 · ${fmtRangeC(w.monday)}`}
                        >
                          W{w.week}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="wpp-legend">
            <span><span className="swatch entry" /> 사진이 있는 주</span>
            <span><span className="swatch new" /> 새 일기 작성 가능</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Audio mock ==========
// Stable pseudo-random waveform
function genWaveform(seed, bars = 56) {
  let s = seed || 1;
  const out = [];
  for (let i = 0; i < bars; i++) {
    s = (s * 9301 + 49297) % 233280;
    const env = Math.sin((i / bars) * Math.PI) * 0.6 + 0.5; // shape envelope
    out.push(Math.max(0.18, Math.min(1, (s / 233280) * 0.8 + env * 0.6)));
  }
  return out;
}

function VoiceDropzone({ file, setFile }) {
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0); // 0..1

  const inputRef = useRef(null);

  // Simulated playback
  useEffect(() => {
    if (!playing) return;
    const start = Date.now();
    const dur = file ? file.duration : 1;
    const startedFrom = cursor;
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const next = startedFrom + (elapsed / dur);
      if (next >= 1) { setCursor(0); setPlaying(false); }
      else setCursor(next);
    }, 80);
    return () => clearInterval(id);
  }, [playing, file]);

  const pickFile = () => inputRef.current?.click();
  const onPick = () => {
    // simulate processing
    setFile({
      name: `voice_memo_${new Date().toISOString().slice(0,10)}.m4a`,
      sizeMB: (1 + Math.random() * 4).toFixed(1),
      duration: 60 + Math.floor(Math.random() * 240),
      waveform: genWaveform(Date.now()),
    });
    setCursor(0);
    setPlaying(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onPick();
  };
  const startRecord = () => {
    setFile({
      name: `recording_${new Date().toISOString().slice(0,16).replace(/[-:T]/g,"")}.m4a`,
      sizeMB: "1.2",
      duration: 78,
      waveform: genWaveform(Date.now() + 7),
      recorded: true,
    });
  };

  if (file) {
    const totalSec = file.duration;
    const elapsedSec = totalSec * cursor;
    const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
    return (
      <div className="audio-card">
        <button className="audio-play" onClick={() => setPlaying(p => !p)} aria-label={playing ? "일시정지" : "재생"}>
          {playing ? <C.Pause /> : <C.Play />}
        </button>
        <div className="audio-body">
          <div className="audio-name">{file.name}{file.recorded && " · 방금 녹음됨"}</div>
          <div className="audio-wave" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setCursor(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
          }}>
            {file.waveform.map((v, i) => {
              const pct = i / (file.waveform.length - 1);
              const isPlayed = pct < cursor;
              const isHead = playing && Math.abs(pct - cursor) < (1 / file.waveform.length);
              return <div
                key={i}
                className={`bar ${isPlayed ? "played" : ""} ${isHead ? "playing" : ""}`}
                style={{ height: `${v * 22}px` }}
              />;
            })}
          </div>
          <div className="audio-meta">
            <span>{fmt(elapsedSec)} / {fmt(totalSec)}</span>
            <span>{file.sizeMB} MB · m4a</span>
          </div>
        </div>
        <button className="audio-remove" onClick={() => setFile(null)} aria-label="음성 제거"><C.X /></button>
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""}`}
      onClick={pickFile}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="dz-icon"><C.Mic /></div>
      <div className="dz-title">음성 파일을 여기에 드래그하거나 클릭해서 선택</div>
      <div className="dz-sub">m4a · mp3 · wav · 최대 30분</div>
      <div className="dz-or">또는</div>
      <button className="dz-record-btn" onClick={(e) => { e.stopPropagation(); startRecord(); }}>
        <C.Record /> 지금 녹음하기
      </button>
      <input ref={inputRef} type="file" accept="audio/*" style={{display: "none"}} onChange={onPick} />
    </div>
  );
}

// ========== Photo strip preview ==========
function PhotoStrip({ year, week }) {
  const photos = useMemo(() => photosForWeek(year, week), [year, week]);
  if (photos.length === 0) {
    return <div className="photo-strip-empty">이 주에는 등록된 사진이 없어요</div>;
  }
  const show = photos.slice(0, 5);
  const more = photos.length - show.length;
  return (
    <div className="photo-strip">
      {show.map(p => (
        <div key={p.id} className="photo-strip-cell">
          <PlaceholderImg variant={p.variant} pattern={p.pattern} label={p.label} isVideo={p.type === "video"} />
        </div>
      ))}
      {more > 0 && (
        <div className="photo-strip-cell photo-strip-more">+{more}</div>
      )}
    </div>
  );
}

// ========== Prompt chips ==========
const PROMPTS = [
  "이번 주 가장 좋았던 순간은?",
  "함께 웃은 일은?",
  "기억하고 싶은 한 마디",
  "다음 주에 또 하고 싶은 것",
];

// ========== App ==========
function App() {
  // Default selection: latest week with photos
  const initialSel = useMemo(() => {
    const newest = ALL_PHOTOS[0];
    const [y, m, d] = newest.date.split("-").map(Number);
    const iso = getISOWeekC(new Date(y, m - 1, d));
    return { year: iso.year, week: iso.week, monday: getISOWeekStartC(iso.year, iso.week) };
  }, []);

  const [selected, setSelected] = useState(initialSel);
  const [text, setText] = useState("");
  const [audio, setAudio] = useState(null);
  const [saved, setSaved] = useState(true); // start clean
  const [savingStatus, setSavingStatus] = useState("idle"); // idle | saving | savedDraft
  const [toast, setToast] = useState(null);
  const [splash, setSplash] = useState(false);
  const textareaRef = useRef(null);

  const dirty = text.length > 0 || audio !== null;

  // Autosize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(230, ta.scrollHeight) + "px";
  }, [text]);

  // Draft autosave (fake)
  useEffect(() => {
    if (!dirty) return;
    setSaved(false);
    setSavingStatus("saving");
    const id = setTimeout(() => {
      setSavingStatus("savedDraft");
    }, 700);
    return () => clearTimeout(id);
  }, [text, audio, dirty]);

  const showToast = (msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 1800);
  };

  const onCancel = () => {
    if (dirty && !window.confirm("작성 중인 내용이 사라져요. 정말 취소하시겠어요?")) return;
    window.location.href = "Diary.html";
  };
  const onSave = () => {
    if (!dirty) { showToast("내용을 한 줄이라도 적어주세요"); return; }
    setSavingStatus("saving");
    setTimeout(() => {
      setSplash(true);
      setTimeout(() => { window.location.href = "Diary.html"; }, 1400);
    }, 500);
  };

  const charCount = text.length;
  const countClass = charCount > 1800 ? "over" : charCount > 1400 ? "warn" : "";

  const statusText =
    savingStatus === "saving" ? "임시저장 중…" :
    savingStatus === "savedDraft" ? "임시저장됨" :
    "자동 저장";

  return (
    <div className="shell">
      {/* Top bar */}
      <div className="compose-bar">
        <div className="compose-bar-inner">
          <div className="cb-left">
            <button className="icon-btn" onClick={onCancel} aria-label="뒤로"><C.Back /></button>
            <div className="cb-title-wrap">
              <div className="cb-title">일기 작성</div>
              <div className={`cb-sub ${savingStatus === "saving" ? "saving" : ""}`}>
                <span className="dot" /> {statusText}
              </div>
            </div>
          </div>
          <div className="cb-right">
            <button className="btn btn-ghost" onClick={onCancel}>취소</button>
            <button className="btn btn-primary" onClick={onSave} disabled={!dirty}>
              <C.Save /> 저장
            </button>
          </div>
        </div>
      </div>

      <main className="compose">
        <div className="compose-paper">

          <section className="section">
            <div className="section-label"><span className="num">1</span> 어느 주의 이야기인가요?</div>
            <WeekPicker selected={selected} onSelect={setSelected} />
            <div style={{marginTop: 14}}>
              <PhotoStrip year={selected.year} week={selected.week} />
            </div>
          </section>

          <section className="section">
            <div className="section-label"><span className="num">2</span> 음성 메모 (선택)</div>
            <VoiceDropzone file={audio} setFile={setAudio} />
          </section>

          <section className="section">
            <div className="entry-label">
              <span className="entry-label-main">이번 주 이야기를 적어주세요</span>
              <span className="entry-label-hint">한 줄도 좋아요</span>
            </div>
            <div className="textarea-wrap">
              <textarea
                ref={textareaRef}
                className="entry-textarea"
                placeholder="이번 주 가장 기억에 남는 순간, 함께한 사람들, 들렸던 곳, 마음에 남은 한 마디…"
                value={text}
                onChange={e => setText(e.target.value.slice(0, 2000))}
              />
              <div className="textarea-foot">
                <div className="tf-prompts">
                  {PROMPTS.map(p => (
                    <button
                      key={p}
                      className="tf-prompt"
                      onClick={() => {
                        const ta = textareaRef.current;
                        const cur = text;
                        const insert = (cur.length > 0 && !cur.endsWith("\n\n")) ? "\n\n" : "";
                        setText(cur + insert + p + "\n");
                        setTimeout(() => ta?.focus(), 0);
                      }}
                    >{p}</button>
                  ))}
                </div>
                <div className={`tf-count ${countClass}`}>{charCount.toLocaleString()} / 2,000자</div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Bottom sticky save bar */}
      <div className="save-dock">
        <div className="save-dock-inner">
          <div className="save-dock-status">
            <span className={`sd-pill ${dirty ? "ready" : ""}`}>
              {dirty
                ? <>● {audio ? "음성 + " : ""}{charCount > 0 ? `${charCount}자` : "텍스트 없음"}</>
                : <>○ 작성 시작 전</>}
            </span>
            <span style={{display: window.innerWidth < 520 ? "none" : "inline"}}>
              {selected.year}년 {selected.week}주차에 저장됩니다
            </span>
          </div>
          <button className="btn btn-primary btn-save" onClick={onSave} disabled={!dirty}>
            저장하기
          </button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.kind || ""}`}>{toast.msg}</div>}

      {splash && (
        <div className="splash">
          <div className="splash-mark">
            <div className="splash-circle"><C.Check /></div>
            <div className="splash-text">일기가 저장되었어요</div>
            <div className="splash-sub">{selected.year}년 {selected.week}주차에 추가됨</div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
