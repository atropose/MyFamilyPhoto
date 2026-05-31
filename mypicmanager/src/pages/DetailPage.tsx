import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Icon from '../components/Icons';
import { mediaApi, type MediaItem } from '../lib/api';
import './DetailPage.css';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const GALLERY_STATE_KEY = 'gallery_saved_state';

function formatFullDate(iso: string) {
  const dt = new Date(iso);
  const dow = DOW[dt.getDay()];
  const ampm = dt.getHours() < 12 ? '오전' : '오후';
  const h12 = dt.getHours() === 0 ? 12 : dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours();
  return `${dt.getFullYear()}년 ${MONTH_KO[dt.getMonth()]} ${dt.getDate()}일 (${dow}) · ${ampm} ${h12}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function pad2(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) { return `${Math.floor(secs / 60)}:${pad2(Math.floor(secs % 60))}`; }

function VideoPlayer({ src, duration }: { src: string; duration: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); } else { v.play(); }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    return () => { v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause); v.removeEventListener('timeupdate', onTime); };
  }, []);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        src={src}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        playsInline
        onClick={toggle}
      />
      <div className="video-controls">
        <button className={`video-play-center ${playing ? 'playing' : ''}`} onClick={toggle} aria-label={playing ? '일시정지' : '재생'}>
          {playing ? <Icon.Pause size={34} /> : <Icon.Play size={34} />}
        </button>
        <div className="video-bar">
          <div className="video-progress" onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
            if (videoRef.current) videoRef.current.currentTime = t;
          }}>
            <div className="video-progress-fill" style={{ width: pct + '%' }}>
              <div className="video-progress-thumb" style={{ left: '100%' }} />
            </div>
          </div>
          <div className="video-row">
            <button className="video-icon-btn" onClick={toggle}>
              {playing ? <Icon.Pause size={22} /> : <Icon.Play size={22} />}
            </button>
            <span className="video-time">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoDrawer({ item, show, onClose }: { item: MediaItem; show: boolean; onClose: () => void }) {
  return (
    <div className={`info-drawer ${show ? 'show' : ''}`}>
      <div className="info-head">
        <div className="title">사진 정보 <span className="filename">{item.filename}</span></div>
        <button className="info-close" onClick={onClose}><Icon.ChevUp /></button>
      </div>
      <div className="info-grid">
        {item.taken_at && (
          <div className="info-item">
            <div className="info-icon"><Icon.CalendarDetail /></div>
            <div className="info-body">
              <div className="info-label">촬영 일시</div>
              <div className="info-value">{formatFullDate(item.taken_at)}</div>
            </div>
          </div>
        )}
        <div className="info-item">
          <div className="info-icon"><Icon.MapPinDetail /></div>
          <div className="info-body">
            <div className="info-label">장소</div>
            {item.address
              ? <div className="info-value">{item.address}{item.gps_lat && <span className="sub">GPS {item.gps_lat.toFixed(4)}, {item.gps_lng?.toFixed(4)}</span>}</div>
              : <div className="info-value muted">위치 정보 없음</div>}
          </div>
        </div>
        {item.family_member && (
          <div className="info-item">
            <div className="info-icon"><Icon.Users /></div>
            <div className="info-body">
              <div className="info-label">가족 구성원</div>
              <div className="info-value">
                <span className="member-chip">
                  <span className="member-chip-dot">{item.family_member.slice(-1)}</span>
                  {item.family_member}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="info-item">
          <div className="info-icon"><Icon.FileIcon /></div>
          <div className="info-body">
            <div className="info-label">파일</div>
            <div className="info-value">
              {item.filename}
              {item.file_size && <span className="sub">{formatFileSize(item.file_size)}</span>}
            </div>
          </div>
        </div>
        {(item.width && item.height) && (
          <div className="info-item">
            <div className="info-icon"><Icon.Ruler /></div>
            <div className="info-body">
              <div className="info-label">해상도</div>
              <div className="info-value">
                {item.width} × {item.height}
                <span className="sub">{((item.width * item.height) / 1_000_000).toFixed(1)} 메가픽셀</span>
              </div>
            </div>
          </div>
        )}
        {item.duration && (
          <div className="info-item">
            <div className="info-icon"><Icon.Camera /></div>
            <div className="info-body">
              <div className="info-label">재생 시간</div>
              <div className="info-value">{fmtTime(item.duration)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind?: string } | null>(null);
  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setImgError(false);
    mediaApi.get(Number(id))
      .then(({ data }) => setItem(data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch prev/next IDs from gallery list
  useEffect(() => {
    if (!item) return;
    const fetchNeighbors = async () => {
      try {
        const { data } = await mediaApi.list({ page_size: 200 });
        const ids = data.items.map(i => i.id);
        const idx = ids.indexOf(item.id);
        setPrevId(idx > 0 ? ids[idx - 1] : null);
        setNextId(idx < ids.length - 1 ? ids[idx + 1] : null);
      } catch {}
    };
    fetchNeighbors();
  }, [item]);

  const showToast = (msg: string, kind?: string) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 1800);
  };

  const goPrev = useCallback(() => {
    if (prevId != null) navigate(`/detail/${prevId}`);
  }, [prevId, navigate]);

  const goNext = useCallback(() => {
    if (nextId != null) navigate(`/detail/${nextId}`);
  }, [nextId, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showHideConfirm) { if (e.key === 'Escape') setShowHideConfirm(false); return; }
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') { if (infoOpen) setInfoOpen(false); else navigate('/gallery'); }
      else if (e.key.toLowerCase() === 'i') setInfoOpen(v => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, infoOpen, showHideConfirm, navigate]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current;
    if (!start) return;
    const end = e.changedTouches[0];
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    const dt = Date.now() - start.t;
    touchRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
      if (dx > 0) goPrev(); else goNext();
    }
  };

  const handleHide = async () => {
    if (!item) return;
    try {
      await mediaApi.toggleHide(item.id, true);
      setShowHideConfirm(false);
      showToast(`${item.filename}을(를) 숨김 처리했어요`, 'success');

      // 갤러리 저장 상태에 숨긴 ID 기록 (복원 시 해당 사진 제거용)
      try {
        const raw = sessionStorage.getItem(GALLERY_STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          const hiddenIds: number[] = saved.hiddenItemIds || [];
          if (!hiddenIds.includes(item.id)) hiddenIds.push(item.id);
          saved.hiddenItemIds = hiddenIds;
          sessionStorage.setItem(GALLERY_STATE_KEY, JSON.stringify(saved));
        }
      } catch {}

      setTimeout(() => { if (nextId != null) goNext(); else if (prevId != null) goPrev(); else navigate('/gallery'); }, 500);
    } catch {
      showToast('오류가 발생했어요', 'error');
    }
  };

  if (loading) {
    return <div className="viewer"><div className="d-empty">로딩 중…</div></div>;
  }

  if (!item) {
    return (
      <div className="viewer">
        <div className="d-empty">
          <h3>사진을 찾을 수 없어요</h3>
          <button className="d-btn" onClick={() => navigate('/gallery')}>갤러리로 돌아가기</button>
        </div>
      </div>
    );
  }

  const isVideo = item.media_type === 'video';
  const mediaStyle: React.CSSProperties = item.width && item.height
    ? { aspectRatio: `${item.width} / ${item.height}`, width: `min(90vw, calc((100vh - 200px) * ${item.width / item.height}))`, maxHeight: 'calc(100vh - 200px)', maxWidth: 'calc(100vw - 160px)' }
    : { maxWidth: '90vw', maxHeight: 'calc(100vh - 200px)' };

  return (
    <div className={`viewer ${infoOpen ? 'info-open' : ''}`}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="topbar">
        <div className="top-left">
          {isVideo && item.duration && <div className="media-badge">영상 · {fmtTime(item.duration)}</div>}
        </div>
        <div className="top-right">
          <a
            className="gbtn"
            href={mediaApi.fileUrl(item.id)}
            download={item.filename}
            title="다운로드"
            onClick={() => showToast(`${item.filename} 다운로드 시작`, 'success')}
          >
            <Icon.Download />
          </a>
          <button className="gbtn danger" onClick={() => setShowHideConfirm(true)} title="숨김">
            <Icon.EyeOff />
          </button>
          <button className="gbtn" onClick={() => navigate('/gallery')} title="닫기 (Esc)">
            <Icon.X />
          </button>
        </div>
      </div>

      <div className="stage-area">
        <div className="media-wrap">
          <div className="media" style={mediaStyle}>
            {isVideo ? (
              <VideoPlayer src={mediaApi.streamUrl(item.id)} duration={item.duration || 0} />
            ) : imgError ? (
              <div style={{ width: '100%', height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-400)' }}>
                <Icon.Photo />
              </div>
            ) : (
              <img
                src={mediaApi.fileUrl(item.id)}
                alt={item.filename}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>
      </div>

      <button className="arrow prev" onClick={goPrev} disabled={prevId == null} aria-label="이전 사진"><Icon.ArrowLeft /></button>
      <button className="arrow next" onClick={goNext} disabled={nextId == null} aria-label="다음 사진"><Icon.ArrowRight /></button>

      <div className="bottombar">
        <div className="bottom-handle" onClick={() => setInfoOpen(v => !v)} role="button">
          <div className="bh-main">
            <div className="bh-icon">{isVideo ? <Icon.Play size={16} /> : <Icon.FileIcon />}</div>
            <div className="bh-text">
              <div className="bh-filename">{item.filename}</div>
              <div className="bh-meta">
                {item.taken_at && `${item.taken_at.slice(0,10).replaceAll('-','.')} · `}
                {item.address || item.family_member || ''}
              </div>
            </div>
          </div>
          <div className="bh-chevron"><Icon.ChevronDown /></div>
        </div>
      </div>

      <InfoDrawer item={item} show={infoOpen} onClose={() => setInfoOpen(false)} />

      <div className="hint-hud">
        <kbd>←</kbd><kbd>→</kbd> 이동 · <kbd>i</kbd> 정보 · <kbd>Esc</kbd> 닫기
      </div>

      {toast && <div className={`d-toast ${toast.kind || ''}`}>{toast.msg}</div>}

      {showHideConfirm && (
        <div className="modal-backdrop" onClick={() => setShowHideConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>이 사진을 숨길까요?</h3>
            <p>숨김 처리된 사진은 일반 갤러리에서 보이지 않습니다. 관리자 페이지에서 복구할 수 있어요.</p>
            <div className="modal-actions">
              <button className="d-btn" onClick={() => setShowHideConfirm(false)}>취소</button>
              <button className="d-btn danger" onClick={handleHide}>숨김 처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
