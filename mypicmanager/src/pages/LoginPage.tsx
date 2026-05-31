import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icon from '../components/Icons';
import { useAuthStore } from '../store/auth';
import './LoginPage.css';

const PIN_LENGTH = 4;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, authenticated } = useAuthStore();
  const [pin, setPin] = useState('');
  const [phase, setPhase] = useState<'idle' | 'verifying' | 'error' | 'success'>('idle');
  const [pressed, setPressed] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (authenticated) navigate('/gallery', { replace: true });
  }, [authenticated, navigate]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const queueTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const submit = useCallback(async (value: string) => {
    setPhase('verifying');
    try {
      await login(value);
      setPhase('success');
      queueTimer(() => navigate('/gallery'), 1000);
    } catch {
      setPhase('error');
      queueTimer(() => { setPin(''); setPhase('idle'); }, 900);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login, navigate]);

  const pressDigit = useCallback((d: string) => {
    if (phase !== 'idle') return;
    setPin(prev => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + d;
      if (next.length === PIN_LENGTH) submit(next);
      return next;
    });
  }, [phase, submit]);

  const pressDelete = useCallback(() => {
    if (phase !== 'idle') return;
    setPin(prev => prev.slice(0, -1));
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPressed(e.key);
        queueTimer(() => setPressed(null), 120);
        pressDigit(e.key);
      } else if (e.key === 'Backspace') {
        setPressed('del');
        queueTimer(() => setPressed(null), 120);
        pressDelete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressDigit, pressDelete]);

  const dotState = (i: number) => {
    if (phase === 'error' && i < PIN_LENGTH) return 'error';
    if (phase === 'success' && i < PIN_LENGTH) return 'success';
    return i < pin.length ? 'filled' : '';
  };

  const status =
    phase === 'verifying' ? '확인 중…' :
    phase === 'error' ? '패스코드가 일치하지 않습니다' :
    phase === 'success' ? '환영합니다' :
    pin.length === 0 ? '' : `${pin.length} / ${PIN_LENGTH}`;

  const keys = [
    { v: '1' }, { v: '2' }, { v: '3' },
    { v: '4' }, { v: '5' }, { v: '6' },
    { v: '7' }, { v: '8' }, { v: '9' },
    { spacer: true }, { v: '0' }, { del: true },
  ] as const;

  return (
    <div className="login-app">
      <div className="login-bg-blur" aria-hidden="true" />
      <div className="login-bg-grain" aria-hidden="true" />

      <div className="login-card" role="dialog" aria-label="패스코드 입력">
        <div className="login-brand">
          <div className="login-brand-mark"><Icon.LogoFrame /></div>
          <div className="login-brand-name">MyPicManager</div>
        </div>

        <h1 className="login-heading">패스코드를 입력하세요</h1>
        <p className="login-subheading">우리 가족의 추억을 열어볼게요</p>

        <div className="login-hint">힌트 · 데모 패스코드 1 2 3 4</div>

        <div className={`login-dots ${phase === 'error' ? 'shake' : ''}`} aria-live="polite">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`login-dot ${dotState(i)}`} />
          ))}
        </div>

        <div className={`login-status ${phase === 'error' ? 'error' : phase === 'success' ? 'success' : ''}`}>
          {status}
        </div>

        <div className="login-keypad" role="group" aria-label="숫자 키패드">
          {keys.map((k, i) => {
            if ('spacer' in k && k.spacer) {
              return <div key={i} className="login-key spacer" aria-hidden="true" />;
            }
            if ('del' in k && k.del) {
              return (
                <button
                  key={i}
                  className={`login-key delete ${pressed === 'del' ? 'pressed' : ''}`}
                  onClick={pressDelete}
                  disabled={phase !== 'idle' || pin.length === 0}
                  aria-label="삭제"
                >
                  <Icon.Backspace />
                </button>
              );
            }
            const digit = (k as { v: string }).v;
            return (
              <button
                key={i}
                className={`login-key ${pressed === digit ? 'pressed' : ''}`}
                onClick={() => pressDigit(digit)}
                disabled={phase !== 'idle'}
                aria-label={`숫자 ${digit}`}
              >
                <span>{digit}</span>
              </button>
            );
          })}
        </div>

        <div className="login-foot">
          가족 전용 서비스입니다 · v 0.1
        </div>

        {phase === 'success' && (
          <div className="login-success-mark">
            <div className="login-success-circle"><Icon.BigCheck /></div>
            <div className="login-success-text">환영합니다 👋</div>
          </div>
        )}
      </div>
    </div>
  );
}
