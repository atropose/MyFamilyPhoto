import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Icon from '../components/Icons';
import { diaryApi, mediaApi, type MediaItem } from '../lib/api';
import './ComposePage.css';

const PROMPTS = [
  '이번 주 가장 좋았던 순간은?',
  '함께 웃은 일은?',
  '기억하고 싶은 한 마디',
  '다음 주에 또 하고 싶은 것',
];

function computeWeekStart(year: number, week: number): string {
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

function fmtRange(year: number, week: number) {
  const weekStart = computeWeekStart(year, week);
  const monday = new Date(weekStart + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const m1 = monday.getMonth() + 1, d1 = monday.getDate();
  const m2 = sunday.getMonth() + 1, d2 = sunday.getDate();
  if (m1 === m2) return `${m1}월 ${d1}일 (월) ~ ${d2}일 (일)`;
  return `${m1}월 ${d1}일 (월) ~ ${m2}월 ${d2}일 (일)`;
}

function getISOWeekInfo() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function PhotoStrip({ year, week }: { year: number; week: number }) {
  const [photos, setPhotos] = useState<MediaItem[]>([]);

  useEffect(() => {
    diaryApi.getMedia(year, week)
      .then(({ data }) => setPhotos(data.items))
      .catch(() => setPhotos([]));
  }, [year, week]);

  if (photos.length === 0) return <div className="photo-strip-empty">이 주에는 등록된 사진이 없어요</div>;
  const show = photos.slice(0, 5);
  const more = photos.length - show.length;
  return (
    <div className="photo-strip">
      {show.map(p => (
        <div key={p.id} className="photo-strip-cell">
          <img
            src={mediaApi.thumbnailUrl(p.id)}
            alt={p.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {p.media_type === 'video' && <div className="wc-thumb-video-tag"><Icon.PlayMini /></div>}
        </div>
      ))}
      {more > 0 && <div className="photo-strip-cell photo-strip-more">+{more}</div>}
    </div>
  );
}

export default function ComposePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialYear = searchParams.get('year') ? Number(searchParams.get('year')) : getISOWeekInfo().year;
  const initialWeek = searchParams.get('week') ? Number(searchParams.get('week')) : getISOWeekInfo().week;

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedWeek, setSelectedWeek] = useState(initialWeek);
  const [text, setText] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toast, setToast] = useState<{ msg: string; kind?: string } | null>(null);
  const [splash, setSplash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Load existing diary if editing
  useEffect(() => {
    if (searchParams.get('year') && searchParams.get('week')) {
      diaryApi.get(selectedYear, selectedWeek)
        .then(({ data }) => {
          if (data.text_content) setText(data.text_content);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.max(230, ta.scrollHeight) + 'px';
  }, [text]);

  // Auto-save debounce
  useEffect(() => {
    const dirty = text.length > 0 || audioFile !== null;
    if (!dirty) return;
    setSavingStatus('saving');
    const id = setTimeout(() => setSavingStatus('saved'), 700);
    return () => clearTimeout(id);
  }, [text, audioFile]);

  const showToast = (msg: string, kind?: string) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 1800);
  };

  const onAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile(f);
    const url = URL.createObjectURL(f);
    setAudioPreview(url);
  };

  const onCancel = () => {
    const dirty = text.length > 0 || audioFile !== null;
    if (dirty && !window.confirm('작성 중인 내용이 사라져요. 정말 취소하시겠어요?')) return;
    navigate('/diary');
  };

  const onSave = async () => {
    const dirty = text.length > 0 || audioFile !== null;
    if (!dirty) { showToast('내용을 한 줄이라도 적어주세요'); return; }
    setSavingStatus('saving');
    try {
      const fd = new FormData();
      fd.append('week_year', String(selectedYear));
      fd.append('week_number', String(selectedWeek));
      fd.append('text_content', text);
      if (audioFile) fd.append('audio', audioFile);
      await diaryApi.upsert(fd);
      setSplash(true);
      setTimeout(() => navigate('/diary'), 1400);
    } catch {
      showToast('저장 중 오류가 발생했어요', 'error');
      setSavingStatus('idle');
    }
  };

  const charCount = text.length;
  const countClass = charCount > 1800 ? 'over' : charCount > 1400 ? 'warn' : '';
  const statusText = savingStatus === 'saving' ? '임시저장 중…' : savingStatus === 'saved' ? '임시저장됨' : '자동 저장';
  const dirty = text.length > 0 || audioFile !== null;

  // Week picker
  const currentYear = new Date().getFullYear();
  const weekSelectYears = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - 4 + i), [currentYear]);

  return (
    <div className="compose-shell">
      <div className="compose-bar">
        <div className="compose-bar-inner">
          <div className="cb-left">
            <button className="icon-btn" onClick={onCancel} aria-label="뒤로"><Icon.Back /></button>
            <div className="cb-title-wrap">
              <div className="cb-title">일기 작성</div>
              <div className={`cb-sub ${savingStatus === 'saving' ? 'saving' : ''}`}>
                <span className="dot" /> {statusText}
              </div>
            </div>
          </div>
          <div className="cb-right">
            <button className="btn btn-ghost" onClick={onCancel}>취소</button>
            <button className="btn btn-primary" onClick={onSave} disabled={!dirty}>
              <Icon.Save /> 저장
            </button>
          </div>
        </div>
      </div>

      <main className="compose">
        <div className="compose-paper">
          <section className="section">
            <div className="section-label"><span className="num">1</span> 어느 주의 이야기인가요?</div>
            <div className="week-pick-row">
              <select
                className="week-pick-trigger"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {weekSelectYears.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select
                className="week-pick-trigger"
                value={selectedWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
              >
                {Array.from({ length: 53 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>{w}주차 ({fmtRange(selectedYear, w)})</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 14 }}>
              <PhotoStrip year={selectedYear} week={selectedWeek} />
            </div>
          </section>

          <section className="section">
            <div className="section-label"><span className="num">2</span> 음성 메모 (선택)</div>
            {audioPreview ? (
              <div className="audio-card">
                <audio controls src={audioPreview} style={{ flex: 1 }} />
                <button className="audio-remove" onClick={() => { setAudioFile(null); setAudioPreview(null); }}>
                  <Icon.X />
                </button>
              </div>
            ) : (
              <div className="dropzone" onClick={() => audioInputRef.current?.click()}>
                <div className="dz-icon"><Icon.Mic /></div>
                <div className="dz-title">음성 파일을 클릭해서 선택</div>
                <div className="dz-sub">m4a · mp3 · wav · 최대 30분</div>
                <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={onAudioChange} />
              </div>
            )}
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
                    <button key={p} className="tf-prompt" onClick={() => {
                      const insert = (text.length > 0 && !text.endsWith('\n\n')) ? '\n\n' : '';
                      setText(text + insert + p + '\n');
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}>{p}</button>
                  ))}
                </div>
                <div className={`tf-count ${countClass}`}>{charCount.toLocaleString()} / 2,000자</div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="save-dock">
        <div className="save-dock-inner">
          <div className="save-dock-status">
            <span className={`sd-pill ${dirty ? 'ready' : ''}`}>
              {dirty ? <>● {audioFile ? '음성 + ' : ''}{charCount > 0 ? `${charCount}자` : '텍스트 없음'}</> : <>○ 작성 시작 전</>}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
              {selectedYear}년 {selectedWeek}주차에 저장됩니다
            </span>
          </div>
          <button className="btn btn-primary btn-save" onClick={onSave} disabled={!dirty}>저장하기</button>
        </div>
      </div>

      {toast && <div className={`c-toast ${toast.kind || ''}`}>{toast.msg}</div>}

      {splash && (
        <div className="splash">
          <div className="splash-mark">
            <div className="splash-circle"><Icon.Check size={44} /></div>
            <div className="splash-text">일기가 저장되었어요</div>
            <div className="splash-sub">{selectedYear}년 {selectedWeek}주차에 추가됨</div>
          </div>
        </div>
      )}
    </div>
  );
}
