import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from './store.js';

const setup = () => {
  const s = createStore();
  s.signup({ email: 'a@a.com', password: 'pw', nickname: '아티스트' });
  s.signup({ email: 'b@b.com', password: 'pw', nickname: '관객' });
  const artist = s.userByToken(s.login({ email: 'a@a.com', password: 'pw' }).token);
  const viewer = s.userByToken(s.login({ email: 'b@b.com', password: 'pw' }).token);
  return { s, artist, viewer };
};

test('duplicate email or nickname is rejected', () => {
  const { s } = setup();
  assert.throws(() => s.signup({ email: 'a@a.com', password: 'x', nickname: 'new' }), { status: 409 });
  assert.throws(() => s.signup({ email: 'c@c.com', password: 'x', nickname: '관객' }), { status: 409 });
});

test('wrong password fails login', () => {
  const { s } = setup();
  assert.throws(() => s.login({ email: 'a@a.com', password: 'nope' }), { status: 401 });
});

test('an artist can run only one busking at a time', () => {
  const { s, artist } = setup();
  s.createBusking(artist, { title: '첫 공연', genre: '인디' });
  assert.throws(() => s.createBusking(artist, { title: '둘째 공연', genre: '인디' }), { status: 409 });
});

test('genre mode lists only followed genres', () => {
  const { s, artist, viewer } = setup();
  s.createBusking(artist, { title: '재즈 나이트', genre: '재즈' });
  assert.equal(s.listBuskings({ mode: 'genre', user: viewer }).length, 0);
  s.followGenre(viewer, '재즈');
  assert.equal(s.listBuskings({ mode: 'genre', user: viewer }).length, 1);
});

test('only the artist can end a busking', () => {
  const { s, artist, viewer } = setup();
  const b = s.createBusking(artist, { title: '공연', genre: '록' });
  assert.throws(() => s.endBusking(viewer, b.id), { status: 403 });
  s.endBusking(artist, b.id);
  assert.throws(() => s.getBusking(b.id), { status: 404 });
});
