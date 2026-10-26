// BuskingAgain rebuild server
// - REST API: users / genres / buskings (same URI rules as the original team convention)
// - WebSocket: WebRTC signaling (offer / answer / ice) + live chat per busking room
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createStore, GENRES } from './store.js';
import { createSignaling } from './signaling.js';

export function createApp(store = createStore()) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Token auth: every request after login carries "Authorization: Bearer <token>"
  const auth = (req, res, next) => {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const user = store.userByToken(token);
    if (!user) return res.status(401).json({ message: '로그인이 필요합니다.' });
    req.user = user;
    req.token = token;
    next();
  };
  const optionalAuth = (req, _res, next) => {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    req.user = store.userByToken(token);
    next();
  };

  // users
  app.post('/users/create', (req, res) => res.status(201).json(store.signup(req.body)));
  app.post('/users/login', (req, res) => res.json(store.login(req.body)));
  app.post('/users/logout', auth, (req, res) => { store.logout(req.token); res.status(204).end(); });
  app.get('/users/me', auth, (req, res) => res.json(store.me(req.user)));
  app.patch('/users/me', auth, (req, res) => res.json(store.updateMe(req.user, req.body)));

  // genres + follow
  app.get('/genres', (_req, res) => res.json(GENRES));
  app.post('/genres/:genre/follow', auth, (req, res) => res.json(store.followGenre(req.user, req.params.genre)));
  app.delete('/genres/:genre/follow', auth, (req, res) => res.json(store.unfollowGenre(req.user, req.params.genre)));

  // buskings
  app.get('/buskings', optionalAuth, (req, res) => res.json(store.listBuskings({ mode: req.query.mode, user: req.user })));
  app.post('/buskings/create', auth, (req, res) => res.status(201).json(store.createBusking(req.user, req.body)));
  app.get('/buskings/:id', (req, res) => res.json(store.getBusking(req.params.id)));
  app.delete('/buskings/:id', auth, (req, res) => { store.endBusking(req.user, req.params.id); res.status(204).end(); });

  // errors
  app.use((err, _req, res, _next) => {
    res.status(err.status ?? 500).json({ message: err.status ? err.message : '서버 오류가 발생했습니다.' });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const store = createStore();
  const server = http.createServer(createApp(store));
  const wss = new WebSocketServer({ server, path: '/ws' });
  createSignaling(wss, store);

  const port = process.env.PORT ?? 8080;
  server.listen(port, () => console.log(`BuskingAgain server listening on http://localhost:${port}`));
}
