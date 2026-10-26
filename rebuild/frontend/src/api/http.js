import axios from 'axios';

// Shared axios instance: attaches the login token to every request.
const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? '요청을 처리하지 못했습니다.';
    return Promise.reject(Object.assign(new Error(message), { status: err.response?.status }));
  },
);

export const api = {
  signup: (body) => http.post('/users/create', body).then((r) => r.data),
  login: (body) => http.post('/users/login', body).then((r) => r.data),
  logout: () => http.post('/users/logout'),
  me: () => http.get('/users/me').then((r) => r.data),
  updateMe: (body) => http.patch('/users/me', body).then((r) => r.data),

  genres: () => http.get('/genres').then((r) => r.data),
  follow: (genre) => http.post(`/genres/${encodeURIComponent(genre)}/follow`).then((r) => r.data),
  unfollow: (genre) => http.delete(`/genres/${encodeURIComponent(genre)}/follow`).then((r) => r.data),

  buskings: (mode = 'all') => http.get('/buskings', { params: { mode } }).then((r) => r.data),
  busking: (id) => http.get(`/buskings/${id}`).then((r) => r.data),
  createBusking: (body) => http.post('/buskings/create', body).then((r) => r.data),
  endBusking: (id) => http.delete(`/buskings/${id}`),
};
