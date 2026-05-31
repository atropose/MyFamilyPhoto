import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: number
  file_path: string
  filename: string
  media_type: 'photo' | 'video'
  taken_at: string | null
  week_year: number | null
  week_number: number | null
  gps_lat: number | null
  gps_lng: number | null
  address: string | null
  thumbnail_path: string | null
  width: number | null
  height: number | null
  duration: number | null
  family_member: string | null
  is_hidden: boolean
  face_count: number | null
  ai_reviewed: boolean
  file_size: number
  created_at: string
}

export interface MediaListResponse {
  total: number
  page: number
  page_size: number
  items: MediaItem[]
}

export interface Diary {
  id: number | null
  week_year: number
  week_number: number
  week_start: string | null
  audio_path: string | null
  text_content: string | null
  created_at: string | null
  has_photos?: boolean
}

export interface ScanState {
  running: boolean
  total: number
  processed: number
  current_file: string
  errors: number
  started_at: string | null
  finished_at: string | null
  mode: string | null
}

export interface Member {
  id: string
  name: string
  children?: Member[]
}

export interface MediaFilters {
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
  location?: string
  member?: string
  media_type?: string
  show_hidden?: boolean
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (passcode: string) =>
    api.post<{ ok: boolean }>('/auth/login', { passcode }),
  logout: () =>
    api.post<{ ok: boolean }>('/auth/logout'),
  status: () =>
    api.get<{ authenticated: boolean }>('/auth/status'),
}

// ── Media ─────────────────────────────────────────────────────────────────────

export const mediaApi = {
  list: (filters: MediaFilters = {}) =>
    api.get<MediaListResponse>('/media', { params: filters }),
  get: (id: number) =>
    api.get<MediaItem>(`/media/${id}`),
  thumbnailUrl: (id: number) => `/api/media/${id}/thumbnail`,
  fileUrl: (id: number) => `/api/media/${id}/file`,
  streamUrl: (id: number) => `/api/media/${id}/stream`,
  toggleHide: (id: number, is_hidden: boolean) =>
    api.patch<{ ok: boolean; is_hidden: boolean }>(`/media/${id}/hide`, { is_hidden }),
  markReviewed: (id: number) =>
    api.patch<{ ok: boolean }>(`/media/${id}/review`),
}

// ── Members ───────────────────────────────────────────────────────────────────

export const membersApi = {
  list: () =>
    api.get<{ members: Member[] }>('/members'),
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export const scanApi = {
  status: () =>
    api.get<ScanState>('/scan/status'),
  startFull: () =>
    api.post<{ ok: boolean; mode: string }>('/scan/full'),
  startIncremental: () =>
    api.post<{ ok: boolean; mode: string }>('/scan/incremental'),
  aiReanalyze: () =>
    api.post<{ ok: boolean }>('/scan/ai-reanalyze'),
  aiStatus: () =>
    api.get<{ connected: boolean; url: string | null }>('/ai/status'),
}

// ── Diaries ───────────────────────────────────────────────────────────────────

export const diaryApi = {
  list: (year?: number) =>
    api.get<{ diaries: Diary[] }>('/diaries', { params: year ? { year } : {} }),
  get: (year: number, week: number) =>
    api.get<Diary>(`/diaries/${year}/${week}`),
  getMedia: (year: number, week: number) =>
    api.get<{ items: MediaItem[] }>(`/diaries/${year}/${week}/media`),
  audioUrl: (year: number, week: number) => `/api/diaries/${year}/${week}/audio`,
  upsert: (formData: FormData) =>
    api.post<Diary>('/diaries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

// ── Settings ──────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    api.get<Record<string, string>>('/settings'),
  update: (data: Record<string, string>) =>
    api.put<{ ok: boolean }>('/settings', data),
  updatePasscode: (passcode: string) =>
    api.put<{ ok: boolean }>('/settings/passcode', { passcode }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  getReviewQueue: (tab: 'pending' | 'hidden', page = 1) =>
    api.get<{ total: number; items: MediaItem[] }>('/admin/review', { params: { tab, page } }),
  bulkAction: (ids: number[], action: 'hide' | 'keep') =>
    api.post<{ ok: boolean }>('/admin/review/bulk', { ids, action }),
}

export default api
