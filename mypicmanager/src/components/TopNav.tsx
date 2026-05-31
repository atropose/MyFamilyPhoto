import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icon from './Icons';
import { useAuthStore } from '../store/auth';
import './TopNav.css';

interface Props {
  search?: string;
  setSearch?: (v: string) => void;
  showSearch?: boolean;
}

export default function TopNav({ search = '', setSearch, showSearch = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const route =
    location.pathname.startsWith('/gallery') ? 'gallery' :
    location.pathname.startsWith('/detail') ? 'gallery' :
    location.pathname.startsWith('/diary') || location.pathname.startsWith('/compose') ? 'diary' :
    location.pathname.startsWith('/admin') ? 'admin' : 'gallery';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="topnav">
      <div className="container topnav-inner">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('/gallery'); }}>
          <div className="brand-mark"><Icon.LogoFrame /></div>
          <div className="brand-name">MyPicManager</div>
        </a>

        {showSearch && (
          <div className="search">
            <Icon.Search />
            <input
              ref={inputRef}
              type="text"
              placeholder="장소, 파일명 검색"
              value={search}
              onChange={e => setSearch?.(e.target.value)}
            />
            <kbd>⌘K</kbd>
          </div>
        )}

        <div className="nav-right">
          <button
            className={`nav-btn ${route === 'gallery' ? 'active' : ''}`}
            onClick={() => navigate('/gallery')}
          >
            <Icon.Grid /> 갤러리
          </button>
          <button
            className={`nav-btn ${route === 'diary' ? 'active' : ''}`}
            onClick={() => navigate('/diary')}
          >
            <Icon.Book /> 일기
          </button>
          <button
            className={`nav-btn ${route === 'admin' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <Icon.Shield /> 관리자
          </button>
          <button className="avatar" title="로그아웃" onClick={handleLogout}>로</button>
        </div>
      </div>
    </nav>
  );
}
