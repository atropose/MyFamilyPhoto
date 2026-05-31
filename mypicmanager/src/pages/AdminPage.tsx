import { useState, useEffect, useCallback } from 'react';
import TopNav from '../components/TopNav';
import * as Icon from '../components/Icons';
import { scanApi, adminApi, mediaApi, settingsApi, type MediaItem, type ScanState } from '../lib/api';
import './AdminPage.css';

function fmtNum(n: number) { return n.toLocaleString('ko-KR'); }

function ConnCard({ connected, url, onRecheck }: {
  connected: boolean; url: string | null; onRecheck: () => void;
}) {
  return (
    <div className={`card conn-card ${connected ? 'ok' : 'bad'}`}>
      <div className={`conn-led ${connected ? 'ok' : 'bad'}`} />
      <div className="conn-body">
        <div className="conn-row1">
          <span className="conn-title">Windows AI 분석 서비스</span>
          <span className={`conn-pill ${connected ? 'ok' : 'bad'}`}>
            {connected ? <><Icon.Check /> 연결됨</> : '연결 안 됨'}
          </span>
        </div>
        <div className={`conn-desc${connected ? '' : ' bad'}`}>
          {connected
            ? `${url} · InsightFace + CUDA`
            : 'Windows PC를 켜고 AI 서비스가 실행 중인지 확인해주세요'}
        </div>
      </div>
      <div className="conn-action">
        <button className="btn btn-outline btn-sm" onClick={onRecheck}>
          <Icon.Refresh /> 재확인
        </button>
      </div>
    </div>
  );
}

function ScanProgress({ state }: { state: ScanState }) {
  const pct = state.total > 0 ? (state.processed / state.total) * 100 : 0;
  return (
    <div className="progress-card">
      <div className="p-head">
        <div className="p-label">
          <div className="p-spinner" />
          <span>{state.mode === 'ai_reanalyze' ? 'AI 재분석 진행 중' : state.mode === 'incremental' ? '증분 스캔 진행 중' : '전체 스캔 진행 중'}</span>
        </div>
        <span className="p-pct">{pct.toFixed(1)}%</span>
      </div>
      <div className="p-track">
        <div className="p-track-fill" style={{ width: pct + '%' }}>
          <div className="p-track-stripe" />
        </div>
      </div>
      <div className="p-meta">
        <span className="p-file">{state.current_file ? state.current_file.split(/[\\/]/).pop() : '대기 중…'}</span>
        <span>{fmtNum(state.processed)} / {fmtNum(state.total)}</span>
      </div>
    </div>
  );
}

function ReviewGrid({ tab }: { tab: 'pending' | 'hidden' }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const { data } = await adminApi.getReviewQueue(tab, pg);
      setTotal(data.total);
      if (pg === 1) setItems(data.items);
      else setItems(prev => [...prev, ...data.items]);
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    load(1);
  }, [load, tab]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkAction = async (action: 'hide' | 'keep') => {
    if (selected.size === 0) return;
    try {
      await adminApi.bulkAction(Array.from(selected), action);
      showToast(action === 'hide' ? `${selected.size}장 숨김 처리됨` : `${selected.size}장 유지 처리됨`);
      setSelected(new Set());
      load(1);
    } catch {
      showToast('오류가 발생했어요');
    }
  };

  const singleAction = async (id: number, action: 'hide' | 'keep') => {
    try {
      if (action === 'hide') {
        await mediaApi.toggleHide(id, true);
      } else {
        await mediaApi.markReviewed(id);
      }
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
    } catch {
      showToast('오류가 발생했어요');
    }
  };

  if (loading && items.length === 0) {
    return <div className="review-empty"><p>로딩 중…</p></div>;
  }

  if (!loading && items.length === 0) {
    return (
      <div className="review-empty">
        <Icon.Check />
        <p>{tab === 'pending' ? '검토할 항목이 없어요' : '숨긴 사진이 없어요'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="review-count-row">
        총 <strong>{fmtNum(total)}</strong>장
        {selected.size > 0 && <span style={{ marginLeft: 8, color: 'var(--blue)' }}>{selected.size}장 선택됨</span>}
      </div>
      <div className="review-grid">
        {items.map(item => (
          <div
            key={item.id}
            className={`review-thumb ${selected.has(item.id) ? 'selected' : ''}`}
            onClick={() => toggleSelect(item.id)}
          >
            <img
              src={mediaApi.thumbnailUrl(item.id)}
              alt={item.filename}
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="rth-overlay">
              <div className="rth-check">{selected.has(item.id) && <Icon.Check size={14} />}</div>
              <div className="rth-actions" onClick={e => e.stopPropagation()}>
                {tab === 'pending' && (
                  <>
                    <button className="rth-btn hide" onClick={() => singleAction(item.id, 'hide')} title="숨김">
                      <Icon.EyeOff size={14} />
                    </button>
                    <button className="rth-btn keep" onClick={() => singleAction(item.id, 'keep')} title="유지">
                      <Icon.Check size={14} />
                    </button>
                  </>
                )}
                {tab === 'hidden' && (
                  <button className="rth-btn keep" onClick={() => singleAction(item.id, 'keep')} title="복구">
                    <Icon.Eye size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="rth-bottom">
              <div className="rth-filename">{item.filename}</div>
              {item.face_count !== null && item.face_count !== undefined && (
                <div className="rth-face">얼굴 {item.face_count}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {page * 50 < total && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setPage(p => p + 1); load(page + 1); }} disabled={loading}>
            더 보기
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size}장 선택됨</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {tab === 'pending' && (
              <>
                <button className="btn btn-danger btn-sm" onClick={() => bulkAction('hide')}>
                  <Icon.EyeOff size={14} /> 일괄 숨김
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => bulkAction('keep')}>
                  <Icon.Check size={14} /> 일괄 유지
                </button>
              </>
            )}
            {tab === 'hidden' && (
              <button className="btn btn-outline btn-sm" onClick={() => bulkAction('keep')}>
                <Icon.Eye size={14} /> 일괄 복구
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>취소</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function SettingsSection() {
  const [mediaPath, setMediaPath] = useState('');
  const [aiUrl, setAiUrlInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    settingsApi.get().then(({ data }) => {
      setMediaPath(data.root_media_path ?? '');
      setAiUrlInput(data.ai_service_url ?? '');
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.update({ root_media_path: mediaPath, ai_service_url: aiUrl });
      showToast('설정이 저장되었어요');
    } catch { showToast('저장 실패'); }
    finally { setSaving(false); }
  };

  const savePasscode = async () => {
    if (!passcode || passcode.length < 4) { showToast('패스코드는 4자 이상이어야 해요'); return; }
    setSaving(true);
    try {
      await settingsApi.updatePasscode(passcode);
      setPasscode('');
      showToast('패스코드가 변경되었어요');
    } catch { showToast('변경 실패'); }
    finally { setSaving(false); }
  };

  return (
    <section className="admin-section">
      <h2 className="section-title">설정</h2>
      <div className="card settings-card">
        <div className="settings-row">
          <label className="settings-label">미디어 루트 경로</label>
          <div className="settings-input-wrap">
            <input
              className="settings-input"
              value={mediaPath}
              onChange={e => setMediaPath(e.target.value)}
              placeholder="/mnt/photos"
              spellCheck={false}
            />
            <div className="settings-hint">스캔 시 탐색할 최상위 폴더 경로 (Linux 절대경로)</div>
          </div>
        </div>
        <div className="settings-row">
          <label className="settings-label">AI 서비스 URL</label>
          <div className="settings-input-wrap">
            <input
              className="settings-input"
              value={aiUrl}
              onChange={e => setAiUrlInput(e.target.value)}
              placeholder="http://192.168.0.x:8100"
              spellCheck={false}
            />
            <div className="settings-hint">Windows PC의 AI 추론 서비스 주소</div>
          </div>
        </div>
        <div className="settings-footer">
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>저장</button>
        </div>
      </div>

      <div className="card settings-card" style={{ marginTop: 12 }}>
        <div className="settings-row">
          <label className="settings-label">패스코드 변경</label>
          <div className="settings-input-wrap">
            <input
              className="settings-input"
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="새 패스코드 입력"
            />
          </div>
        </div>
        <div className="settings-footer">
          <button className="btn btn-outline btn-sm" onClick={savePasscode} disabled={saving}>변경</button>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}

export default function AdminPage() {
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [aiConnected, setAiConnected] = useState(false);
  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'hidden'>('pending');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const fetchScanState = useCallback(async () => {
    try {
      const { data } = await scanApi.status();
      setScanState(data);
    } catch {}
  }, []);

  const checkAi = useCallback(async () => {
    try {
      const { data } = await scanApi.aiStatus();
      setAiConnected(data.connected);
      setAiUrl(data.url);
    } catch {}
  }, []);

  useEffect(() => {
    fetchScanState();
    checkAi();
    const interval = setInterval(fetchScanState, 2000);
    return () => clearInterval(interval);
  }, [fetchScanState, checkAi]);

  // SSE for scan progress
  useEffect(() => {
    if (!scanState?.running) return;
    const es = new EventSource('/api/scan/events');
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'progress' || event.type === 'total') {
        fetchScanState();
      }
      if (event.type === 'done' || event.type === 'error') {
        fetchScanState();
        es.close();
      }
    };
    return () => es.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanState?.running]);

  const startScan = async (mode: 'full' | 'incremental') => {
    try {
      if (mode === 'full') await scanApi.startFull();
      else await scanApi.startIncremental();
      showToast(`${mode === 'full' ? '전체' : '증분'} 스캔을 시작했어요`);
      setTimeout(fetchScanState, 500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      showToast(err?.response?.data?.detail || '스캔 시작 실패');
    }
  };

  const startAiReanalyze = async () => {
    try {
      await scanApi.aiReanalyze();
      showToast('AI 재분석을 시작했어요');
      setTimeout(fetchScanState, 500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      showToast(err?.response?.data?.detail || 'AI 재분석 시작 실패');
    }
  };

  const running = scanState?.running ?? false;

  return (
    <div className="admin-shell">
      <TopNav />
      <div className="admin-container">
        <header className="page-head">
          <h1 className="page-title">관리자 패널</h1>
        </header>

        <SettingsSection />

        <section className="admin-section">
          <h2 className="section-title">AI 서비스 연결</h2>
          <ConnCard connected={aiConnected} url={aiUrl} onRecheck={checkAi} />
        </section>

        <section className="admin-section">
          <h2 className="section-title">스캔</h2>

          {running && scanState ? (
            <ScanProgress state={scanState} />
          ) : (
            <div className="scan-actions">
              <div className="card scan-card">
                <div className="sc-body">
                  <div className="sc-title">전체 스캔</div>
                  <div className="sc-desc">미디어 루트 폴더를 처음부터 전체 탐색합니다. 시간이 오래 걸릴 수 있어요.</div>
                  {scanState?.finished_at && (
                    <div className="sc-last">마지막 실행: {new Date(scanState.finished_at).toLocaleString('ko-KR')}</div>
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => startScan('full')} disabled={running}>
                  <Icon.Scan /> 전체 스캔 실행
                </button>
              </div>

              <div className="card scan-card">
                <div className="sc-body">
                  <div className="sc-title">증분 스캔</div>
                  <div className="sc-desc">DB에 없는 신규 파일만 처리합니다. 빠르게 업데이트할 때 사용하세요.</div>
                </div>
                <button className="btn btn-outline" onClick={() => startScan('incremental')} disabled={running}>
                  <Icon.Refresh /> 증분 스캔 실행
                </button>
              </div>

              <div className="card scan-card">
                <div className="sc-body">
                  <div className="sc-title">AI 재분석</div>
                  <div className="sc-desc">face_count가 NULL인 사진만 AI 서비스에 전송해 분석합니다.</div>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={startAiReanalyze}
                  disabled={running || !aiConnected}
                  title={!aiConnected ? 'AI 서비스가 연결되어야 합니다' : ''}
                >
                  <Icon.Scan /> 미분석 파일만 AI 재분석
                </button>
              </div>
            </div>
          )}

          {scanState && !running && scanState.processed > 0 && (
            <div className="scan-result">
              처리 완료: <strong>{fmtNum(scanState.processed)}</strong>장
              {scanState.errors > 0 && <>, 오류: <strong>{fmtNum(scanState.errors)}</strong>장</>}
            </div>
          )}
        </section>

        <section className="admin-section">
          <h2 className="section-title">사진 검토</h2>
          <div className="review-tabs">
            <button
              className={`review-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              미검토 AI 후보
            </button>
            <button
              className={`review-tab ${activeTab === 'hidden' ? 'active' : ''}`}
              onClick={() => setActiveTab('hidden')}
            >
              숨김 처리된 사진
            </button>
          </div>
          <ReviewGrid key={activeTab} tab={activeTab} />
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
