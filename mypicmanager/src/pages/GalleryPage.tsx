import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import * as Icon from '../components/Icons';
import { mediaApi, membersApi, type MediaItem, type Member } from '../lib/api';
import './GalleryPage.css';

const MONTH_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const PAGE_SIZE = 200;
const GALLERY_STATE_KEY = 'gallery_saved_state';

function formatKDate(iso: string) {
  const dt = new Date(iso);
  return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')}`;
}

function formatTime(iso: string) {
  const dt = new Date(iso);
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

interface Filters {
  startDate: string;
  endDate: string;
  location: string;
  member: string;
  media: 'all' | 'photo' | 'video';
}

function FilterBar({ filters, setFilters, members, total }: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  members: Member[];
  total: number;
}) {
  return (
    <div className="filters">
      <div className="container filters-inner">
        <div className="filter-group">
          <span className="filter-label">기간</span>
          <div className="date-range">
            <Icon.Calendar />
            <input className="date-input" type="date" value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })} aria-label="시작일" />
            <span className="date-tilde">~</span>
            <input className="date-input" type="date" value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })} aria-label="종료일" />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">장소</span>
          <div className="loc-input">
            <Icon.MapPin />
            <input type="text" placeholder="제주, 서울, 부산…" value={filters.location}
              onChange={e => setFilters({ ...filters, location: e.target.value })} />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">가족</span>
          <select
            className="folder-select"
            value={filters.member}
            onChange={e => setFilters({ ...filters, member: e.target.value })}
            aria-label="가족 폴더 선택"
          >
            <option value="all">전체</option>
            {members.flatMap(m => [
              <option key={m.id} value={m.id}>{m.name}</option>,
              ...(m.children ?? []).map(c => (
                <option key={c.id} value={c.id}>　└ {c.name}</option>
              )),
            ])}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">미디어</span>
          <div className="seg">
            {(['all','photo','video'] as const).map(v => (
              <button key={v} className={`seg-btn ${filters.media === v ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, media: v })}>
                {v === 'photo' && <Icon.Photo />}
                {v === 'video' && <Icon.Video />}
                {v === 'all' ? '전체' : v === 'photo' ? '사진' : '영상'}
              </button>
            ))}
          </div>
        </div>

        <div className="spacer" />
        <div className="result-count"><strong>{total.toLocaleString()}</strong>개</div>
      </div>
    </div>
  );
}

function Thumb({ item, onOpen }: { item: MediaItem; onOpen: (id: number) => void }) {
  const [imgError, setImgError] = useState(false);
  const takenAt = item.taken_at;

  return (
    <div className="thumb" onClick={() => onOpen(item.id)} data-id={item.id}>
      {!imgError ? (
        <img
          src={mediaApi.thumbnailUrl(item.id)}
          alt={item.filename}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'var(--ink-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-400)' }}>
          <Icon.Photo />
        </div>
      )}

      {item.media_type === 'video' && (
        <>
          <div className="video-badge"><Icon.Play /></div>
          {item.duration && <div className="video-duration">{formatDuration(item.duration)}</div>}
        </>
      )}
      {item.address && <div className="thumb-loc">{item.address}</div>}
      <div className="thumb-grad" />
      <div className="thumb-meta">
        <div className="thumb-filename">{item.filename}</div>
        {takenAt && <div className="thumb-date">{formatKDate(takenAt)} · {formatTime(takenAt)}</div>}
      </div>
    </div>
  );
}

function MonthSection({ ym, items, onOpen, refSetter }: {
  ym: string;
  items: MediaItem[];
  onOpen: (id: number) => void;
  refSetter: (el: HTMLElement | null) => void;
}) {
  const [y, m] = ym.split('-').map(Number);
  return (
    <section className="month-section" ref={refSetter} data-ym={ym}>
      <header className="month-header">
        <h2>{y}년 {MONTH_KO[m - 1]}</h2>
        <span className="count">{items.length}장</span>
        <span className="rule" />
      </header>
      <div className="grid">
        {items.map(p => <Thumb key={p.id} item={p} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function JumpRail({ groups, activeYm, onJump }: {
  groups: [string, MediaItem[]][];
  activeYm: string | null;
  onJump: (ym: string) => void;
}) {
  const byYear: Record<string, { ym: string; m: number; count: number }[]> = {};
  for (const [ym, items] of groups) {
    const y = ym.slice(0, 4);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push({ ym, m: Number(ym.slice(5)), count: items.length });
  }
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
  return (
    <aside className="jump-rail" aria-label="날짜로 이동">
      {years.map(y => (
        <div key={y}>
          <div className="jump-year">{y}</div>
          {byYear[y].map(({ ym, m, count }) => (
            <button key={ym} className={`jump-month ${ym === activeYm ? 'active' : ''}`} onClick={() => onJump(ym)}>
              <div>{MONTH_KO[m - 1]}</div>
              <div className="jump-count">{count}</div>
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(() => {
    try {
      const raw = sessionStorage.getItem(GALLERY_STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Date.now() - (saved.savedAt || 0) <= 30 * 60 * 1000) {
          return saved.filters;
        }
      }
    } catch {}
    return { startDate: '', endDate: '', location: '', member: 'all', media: 'all' };
  });
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const monthRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeYm, setActiveYm] = useState<string | null>(null);
  const restoredFromSession = useRef(false);
  const pendingScrollRef = useRef<number | null>(null);

  const fetchMedia = useCallback(async (pg: number, reset: boolean) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pg, page_size: PAGE_SIZE,
      };
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.location) params.location = filters.location;
      if (filters.member && filters.member !== 'all') params.member = filters.member;
      if (filters.media !== 'all') params.media_type = filters.media;

      const { data } = await mediaApi.list(params as Parameters<typeof mediaApi.list>[0]);
      if (reset) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      setTotal(data.total);
      setHasMore(pg * PAGE_SIZE < data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // sessionStorage 복원 (마운트 시 1회, 필터 effect보다 먼저 실행되도록 앞에 위치)
  useEffect(() => {
    const raw = sessionStorage.getItem(GALLERY_STATE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      sessionStorage.removeItem(GALLERY_STATE_KEY);
      if (Date.now() - (saved.savedAt || 0) > 30 * 60 * 1000) return;
      const hiddenIds: number[] = saved.hiddenItemIds || [];
      const restoredItems: MediaItem[] = hiddenIds.length
        ? saved.items.filter((i: MediaItem) => !hiddenIds.includes(i.id))
        : saved.items;
      restoredFromSession.current = true;
      pendingScrollRef.current = saved.clickedItemId ?? null;
      setItems(restoredItems);
      setPage(saved.page);
      setTotal(saved.total);
      setHasMore(saved.hasMore);
    } catch {
      sessionStorage.removeItem(GALLERY_STATE_KEY);
    }
  }, []);

  // Debounce search/filter changes
  useEffect(() => {
    if (restoredFromSession.current) {
      restoredFromSession.current = false;
      return;
    }
    const t = setTimeout(() => {
      setPage(1);
      fetchMedia(1, true);
    }, 300);
    return () => clearTimeout(t);
  }, [filters, fetchMedia]);

  useEffect(() => {
    membersApi.list().then(({ data }) => setMembers(data.members)).catch(() => {});
  }, []);

  const groups = useMemo(() => {
    const m = new Map<string, MediaItem[]>();
    for (const p of items) {
      const ym = p.taken_at ? p.taken_at.slice(0, 7) : 'unknown';
      if (!m.has(ym)) m.set(ym, []);
      m.get(ym)!.push(p);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  useEffect(() => {
    if (groups.length === 0) return;
    setActiveYm(groups[0][0]);
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveYm((visible[0].target as HTMLElement).dataset.ym ?? null);
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 }
    );
    Object.values(monthRefs.current).forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [groups]);

  const onJump = (ym: string) => {
    const el = monthRefs.current[ym];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 128;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // 복원 후 클릭했던 사진 위치로 스크롤
  useEffect(() => {
    if (pendingScrollRef.current == null) return;
    const id = pendingScrollRef.current;
    pendingScrollRef.current = null;
    requestAnimationFrame(() => {
      document.querySelector(`[data-id="${id}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
  }, [items]);

  const onOpenPhoto = (id: number) => {
    sessionStorage.setItem(GALLERY_STATE_KEY, JSON.stringify({
      items, page, filters, total, hasMore,
      clickedItemId: id,
      savedAt: Date.now(),
      hiddenItemIds: [],
    }));
    navigate(`/detail/${id}`);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchMedia(next, false);
  };

  return (
    <div className="shell">
      <TopNav search={search} setSearch={setSearch} showSearch />
      <FilterBar filters={filters} setFilters={setFilters} members={members} total={total} />

      <main className="container content">
        {loading && items.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 24, opacity: 0.4 }}>로딩 중…</div>
          </div>
        ) : groups.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 36, opacity: 0.4 }}>∅</div>
            <h3>조건에 맞는 사진이 없어요</h3>
            <p>필터를 조정해 다시 검색해보세요.</p>
          </div>
        ) : (
          <>
            {groups.map(([ym, photos]) => (
              <MonthSection
                key={ym}
                ym={ym}
                items={photos}
                onOpen={onOpenPhoto}
                refSetter={(el) => { monthRefs.current[ym] = el; }}
              />
            ))}
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <button
                  className="btn btn-outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? '로딩 중…' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {groups.length > 0 && <JumpRail groups={groups} activeYm={activeYm} onJump={onJump} />}
    </div>
  );
}
