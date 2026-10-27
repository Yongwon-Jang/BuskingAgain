// End-to-end tests: real HTTP server + WebSocket signaling on a random port.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { startServer } from './index.js';

let server;
let base;

before(async () => {
  server = await startServer(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const call = async (path, { method = 'GET', token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
};

let seq = 0;
async function newUser() {
  const n = ++seq;
  const cred = { email: `u${n}@test.com`, password: 'password1', nickname: `user${n}` };
  await call('/users/create', { method: 'POST', body: cred });
  return (await call('/users/login', { method: 'POST', body: cred })).body.token;
}

// Opens a socket, joins a room, and collects every message it receives.
function join(roomId, role, token) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${base.replace('http', 'ws')}/ws`);
    const inbox = [];
    ws.on('message', (m) => inbox.push(JSON.parse(m)));
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', roomId, role, token }));
      resolve({ ws, inbox, send: (msg) => ws.send(JSON.stringify(msg)) });
    });
  });
}
const wait = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 1000) => {
  for (let t = 0; t < ms; t += 20) { if (fn()) return; await wait(20); }
  throw new Error('condition not met');
};

test('protected API rejects requests without a token', async () => {
  const res = await call('/buskings/create', { method: 'POST', body: { title: 't', genre: '재즈' } });
  assert.equal(res.status, 401);
});

test('signup → login → create busking → appears in list', async () => {
  const token = await newUser();
  const created = await call('/buskings/create', { method: 'POST', token, body: { title: '첫 공연', genre: '인디' } });
  assert.equal(created.status, 201);
  const list = await call('/buskings');
  assert.ok(list.body.some((b) => b.id === created.body.id));
});

test('artist offer reaches viewer and viewer answer reaches artist', async () => {
  const artistToken = await newUser();
  const { body: b } = await call('/buskings/create', { method: 'POST', token: artistToken, body: { title: 'live', genre: '록' } });

  const artist = await join(b.id, 'artist', artistToken);
  const viewer = await join(b.id, 'viewer', await newUser());

  await until(() => artist.inbox.some((m) => m.type === 'viewer-joined'));
  const viewerId = artist.inbox.find((m) => m.type === 'viewer-joined').peerId;
  artist.send({ type: 'signal', to: viewerId, data: { sdp: { type: 'offer', sdp: 'fake' } } });
  await until(() => viewer.inbox.some((m) => m.type === 'signal'));

  const offer = viewer.inbox.find((m) => m.type === 'signal');
  viewer.send({ type: 'signal', to: offer.from, data: { sdp: { type: 'answer', sdp: 'fake' } } });
  await until(() => artist.inbox.some((m) => m.type === 'signal' && m.data.sdp.type === 'answer'));

  assert.equal((await call(`/buskings/${b.id}`)).body.viewerCount, 1);
  artist.ws.close();
  viewer.ws.close();
});

test('guests cannot chat, members can, and reactions are broadcast', async () => {
  const artistToken = await newUser();
  const { body: b } = await call('/buskings/create', { method: 'POST', token: artistToken, body: { title: 'chat', genre: '재즈' } });
  const artist = await join(b.id, 'artist', artistToken);
  const guest = await join(b.id, 'viewer', null);
  const member = await join(b.id, 'viewer', await newUser());
  await wait();

  guest.send({ type: 'chat', text: '안녕하세요' });
  await until(() => guest.inbox.some((m) => m.type === 'error'));
  assert.ok(!artist.inbox.some((m) => m.type === 'chat'));

  member.send({ type: 'chat', text: '  앵콜!  ' });
  member.send({ type: 'reaction', emoji: '👏' });
  member.send({ type: 'reaction', emoji: '💣' }); // not allowed, ignored
  await until(() => artist.inbox.some((m) => m.type === 'reaction'));

  assert.equal(artist.inbox.find((m) => m.type === 'chat').text, '앵콜!');
  assert.deepEqual(artist.inbox.filter((m) => m.type === 'reaction').map((m) => m.emoji), ['👏']);
  [artist, guest, member].forEach((c) => c.ws.close());
});

test('chat is rate limited per user', async () => {
  const artistToken = await newUser();
  const { body: b } = await call('/buskings/create', { method: 'POST', token: artistToken, body: { title: 'spam', genre: '힙합' } });
  const artist = await join(b.id, 'artist', artistToken);
  const spammer = await join(b.id, 'viewer', await newUser());
  await wait();

  for (let i = 0; i < 10; i++) spammer.send({ type: 'chat', text: `msg ${i}` });
  await wait(200);
  assert.equal(artist.inbox.filter((m) => m.type === 'chat').length, 5);
  assert.ok(spammer.inbox.some((m) => m.type === 'error'));
  [artist, spammer].forEach((c) => c.ws.close());
});

test('viewers are told when the artist leaves', async () => {
  const artistToken = await newUser();
  const { body: b } = await call('/buskings/create', { method: 'POST', token: artistToken, body: { title: 'bye', genre: '발라드' } });
  const artist = await join(b.id, 'artist', artistToken);
  const viewer = await join(b.id, 'viewer', null);
  await wait();
  artist.ws.close();
  await until(() => viewer.inbox.some((m) => m.type === 'ended'));
  viewer.ws.close();
});

test('only the artist can broadcast in their room', async () => {
  const { body: b } = await call('/buskings/create', { method: 'POST', token: await newUser(), body: { title: 'mine', genre: '인디' } });
  const intruder = await join(b.id, 'artist', await newUser());
  await until(() => intruder.inbox.some((m) => m.type === 'error'));
  intruder.ws.close();
});
