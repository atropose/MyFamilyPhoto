import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import * as Icon from '../components/Icons';
import { diaryApi, mediaApi, type Diary, type MediaItem } from '../lib/api';
import './DiaryPage.css';

const MONTH_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function fmtDateRange(weekStart: string) {
  const monday = new Date(weekStart + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const m1 = monday.getMonth() + 1, d1 = monday.getDate();
  const m2 = sunday.getMonth() + 1, d2 = sunday.getDate();
  if (m1 === m2) return `${m1}월 ${d1}일 (월) – ${d2}일 (일)`;
  return `${m1}월 ${d1}일 (월) – ${m2}월 ${d2}일 (일)`;
}

function computeWeekStart(year: number, week: number): string {
  // ISO week start (Monday)
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

interface WeekEntry {
  year: number;
  week: number;
  weekStart: string;
  diary: Diary | null;
}

function WeekCard({ entry, isLatest, onOpen, onCompose }: {
  entry: WeekEntry;
  isLatest: boolean;
  onOpen: (year: number, week: number) => void;
  onCompose: (year: number, week: number) => void;
}) {
  const { year, week, weekStart, diary } = entry;
  const hasText = diary?.text_content && diary.text_content.trim().length > 0;
  const hasAudio = !!diary?.audio_path;

  return (
    <div className="week-card" onClick={() => onOpen(year, week)}>
      <div className="wc-body">
        <div>
          <div className="wc-head">
            <span className="wc-week-no">{year}년 {week}주차</span>
            {isLatest && <span className="wc-week-this">최근</span>}
          </div>
          <div className="wc-week-range">{fmtDateRange(weekStart)}</div>
          <p className={`wc-preview ${!hasText ? 'no-text' : ''}`}>
            {hasText
              ? diary!.text_content!.slice(0, 120) + (diary!.text_content!.length > 120 ? '…' : '')
              : '이 주는 일기를 아직 쓰지 않았어요. 사진은 있어요 — 한 줄이라도 남겨보세요.'}
          </p>
        </div>
        <div className="wc-foot">
          {hasAudio && (
            <span className="wc-stat audio">
              <Icon.Mic size={13} /> 음성 일기
            </span>
          )}
          {!diary && (
            <button className="wc-compose-btn" onClick={e => { e.stopPropagation(); onCompose(year, week); }}>
              <Icon.Plus /> 일기 작성
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline week detail modal
function WeekDetailModal({ year, week, onClose }: { year: number; week: number; onClose: () => void }) {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    diaryApi.get(year, week).then(({ data }) => setDiary(data as Diary)).catch(() => {});
    diaryApi.getMedia(year, week).then(({ data }) => setPhotos(data.items)).catch(() => {});
  }, [year, week]);

  const audioUrl = diaryApi.audioUrl(year, week);
  const weekStart = computeWeekStart(year, week);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="week-modal" onClick={e => e.stopPropagation()}>
        <div className="wm-header">
          <div>
            <div className="wc-week-no">{year}년 {week}주차</div>
            <div className="wc-week-range">{fmtDateRange(weekStart)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="d-btn" onClick={() => navigate(`/compose?year=${year}&week=${week}`)}>
              <Icon.Plus /> 편집
            </button>
            <button className="d-btn" onClick={onClose}><Icon.X /></button>
          </div>
        </div>

        {diary?.audio_path && (
          <div className="wm-audio">
            <audio controls src={audioUrl} style={{ width: '100%' }} />
          </div>
        )}

        {diary?.text_content && (
          <div className="wm-text">{diary.text_content}</div>
        )}

        {photos.length > 0 && (
          <div>
            <div className="wm-section-title">{photos.length}장의 사진·영상</div>
            <div className="wm-grid">
              {photos.map(p => (
                <div key={p.id} className="wm-thumb" onClick={() => navigate(`/detail/${p.id}`)}>
                  <img
                    src={mediaApi.thumbnailUrl(p.id)}
                    alt={p.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {p.media_type === 'video' && <div className="wm-thumb-video"><Icon.Play size={12} /></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!diary?.text_content && !diary?.audio_path && photos.length === 0 && (
          <div className="year-empty" style={{ padding: '32px 0' }}>
            <p>이 주에 대한 기록이 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiaryPage() {
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openWeek, setOpenWeek] = useState<{ year: number; week: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    diaryApi.list().then(({ data }) => {
      setDiaries(data.diaries);
      if (data.diaries.length > 0) {
        setSelectedYear(data.diaries[0].week_year);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const ys = new Set(diaries.map(d => d.week_year));
    const result = Array.from(ys).sort((a, b) => b - a);
    if (result.length === 0) result.push(new Date().getFullYear());
    return result;
  }, [diaries]);

  const filteredEntries = useMemo((): WeekEntry[] => {
    const yearDiaries = diaries.filter(d => d.week_year === selectedYear);

    // Group by week
    const byWeek = new Map<string, Diary>();
    for (const d of yearDiaries) {
      byWeek.set(`${d.week_year}-${d.week_number}`, d);
    }

    // Build all weeks from min to max
    if (yearDiaries.length === 0) return [];

    const weeks = yearDiaries.map(d => d.week_number);
    const minWeek = Math.min(...weeks);
    const maxWeek = Math.max(...weeks);

    const entries: WeekEntry[] = [];
    for (let w = maxWeek; w >= minWeek; w--) {
      const diary = byWeek.get(`${selectedYear}-${w}`) || null;
      entries.push({
        year: selectedYear,
        week: w,
        weekStart: computeWeekStart(selectedYear, w),
        diary,
      });
    }
    return entries;
  }, [diaries, selectedYear]);

  // Build render rows with month markers
  const renderRows = useMemo(() => {
    const rows: ({ kind: 'marker'; month: number } | { kind: 'week'; entry: WeekEntry })[] = [];
    let lastMonth: number | null = null;
    for (const entry of filteredEntries) {
      const month = new Date(entry.weekStart + 'T00:00:00').getMonth();
      if (month !== lastMonth) {
        rows.push({ kind: 'marker', month } as { kind: 'marker'; month: number });
        lastMonth = month;
      }
      rows.push({ kind: 'week', entry } as { kind: 'week'; entry: WeekEntry });
    }
    return rows;
  }, [filteredEntries]);

  const handleCompose = (year?: number, week?: number) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (week) params.set('week', String(week));
    navigate(`/compose?${params}`);
  };

  return (
    <div className="diary-shell">
      <TopNav />

      <div className="diary-container">
        <header className="page-head">
          <div>
            <h1 className="page-title">우리 가족 일기</h1>
            <p className="page-sub">주차별로 모아 보는 가족의 한 주.</p>
          </div>
          <button className="btn-primary" onClick={() => handleCompose()}>
            <Icon.Plus /> 일기 작성
          </button>
        </header>

        <div className="year-tabs">
          {years.map(y => {
            const count = diaries.filter(d => d.week_year === y && d.id !== null).length;
            return (
              <button key={y} className={`year-tab ${y === selectedYear ? 'active' : ''}`} onClick={() => setSelectedYear(y)}>
                {y}
                {count > 0
                  ? <span className="count-pill">{count}</span>
                  : <span className="empty-mark" />}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="year-empty"><p>로딩 중…</p></div>
        ) : filteredEntries.length === 0 ? (
          <div className="year-empty">
            <div className="ico"><Icon.Book /></div>
            <h3>{selectedYear}년의 일기는 아직 없어요</h3>
            <p>가족과 함께한 한 주를 첫 번째 기록으로 남겨보세요.</p>
            <button className="btn-primary" onClick={() => handleCompose()}>
              <Icon.Plus /> 일기 작성
            </button>
          </div>
        ) : (
          <div className="timeline">
            {renderRows.map((r, i) => {
              if (r.kind === 'marker') {
                return (
                  <div key={`m${i}`} className="month-marker">
                    <span className="month-marker-text">{selectedYear}년 {MONTH_KO[r.month]}</span>
                    <span className="month-marker-rule" />
                  </div>
                );
              }
              return (
                <WeekCard
                  key={`${r.entry.year}-${r.entry.week}`}
                  entry={r.entry}
                  isLatest={i === (renderRows.findIndex(row => row.kind === 'week'))}
                  onOpen={(year, week) => setOpenWeek({ year, week })}
                  onCompose={handleCompose}
                />
              );
            })}
          </div>
        )}
      </div>

      {openWeek && (
        <WeekDetailModal
          year={openWeek.year}
          week={openWeek.week}
          onClose={() => setOpenWeek(null)}
        />
      )}
    </div>
  );
}
