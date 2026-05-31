import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import GalleryPage from './pages/GalleryPage';
import DetailPage from './pages/DetailPage';
import DiaryPage from './pages/DiaryPage';
import ComposePage from './pages/ComposePage';
import AdminPage from './pages/AdminPage';
import { useAuthStore } from './store/auth';

function RequireAuth() {
  const { authenticated, checkAuth } = useAuthStore();
  useEffect(() => { checkAuth(); }, [checkAuth]);
  if (!authenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/gallery" replace />} />
        <Route element={<RequireAuth />}>
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
