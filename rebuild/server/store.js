// In-memory data store for the rebuild.
// The original project used Spring Boot + MySQL; this keeps the same
// domain (users, genres, buskings, follows) without a database.
import crypto from 'node:crypto';

export const GENRES = ['발라드', '인디', '어쿠스틱', '힙합', '재즈', 'R&B', '록'];

export function createStore() {
  const users = new Map(); // id -> { id, email, nickname, passwordHash, followGenres:Set }
  const sessions = new Map(); // token -> userId
  const buskings = new Map(); // id -> { id, title, genre, description, artistId, startedAt, viewers:Set }
  let seq = 1;

  const hash = (pw) => crypto.createHash('sha256').update(pw).digest('hex');
  const publicUser = (u) => u && {
    id: u.id,
    email: u.email,
    nickname: u.nickname,
    followGenres: [...u.followGenres],
  };
  const publicBusking = (b) => b && {
    id: b.id,
    title: b.title,
    genre: b.genre,
    description: b.description,
    artist: publicUser(users.get(b.artistId))?.nickname ?? 'unknown',
    artistId: b.artistId,
    startedAt: b.startedAt,
    viewerCount: b.viewers.size,
  };

  return {
    signup({ email, password, nickname }) {
      if (!email || !password || !nickname) throw httpError(400, '이메일, 비밀번호, 닉네임은 필수입니다.');
      for (const u of users.values()) {
        if (u.email === email) throw httpError(409, '이미 가입된 이메일입니다.');
        if (u.nickname === nickname) throw httpError(409, '이미 사용 중인 닉네임입니다.');
      }
      const user = { id: seq++, email, nickname, passwordHash: hash(password), followGenres: new Set() };
      users.set(user.id, user);
      return publicUser(user);
    },

    login({ email, password }) {
      const user = [...users.values()].find((u) => u.email === email);
      if (!user || user.passwordHash !== hash(password ?? '')) throw httpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, user.id);
      return { token, user: publicUser(user) };
    },

    logout(token) {
      sessions.delete(token);
    },

    userByToken(token) {
      const id = sessions.get(token);
      return id ? users.get(id) : undefined;
    },

    me(user) {
      return publicUser(user);
    },

    updateMe(user, { nickname }) {
      if (nickname) user.nickname = nickname;
      return publicUser(user);
    },

    followGenre(user, genre) {
      if (!GENRES.includes(genre)) throw httpError(400, '지원하지 않는 장르입니다.');
      user.followGenres.add(genre);
      return publicUser(user);
    },

    unfollowGenre(user, genre) {
      user.followGenres.delete(genre);
      return publicUser(user);
    },

    createBusking(user, { title, genre, description = '' }) {
      if (!title || !genre) throw httpError(400, '제목과 장르는 필수입니다.');
      if (!GENRES.includes(genre)) throw httpError(400, '지원하지 않는 장르입니다.');
      for (const b of buskings.values()) {
        if (b.artistId === user.id) throw httpError(409, '이미 진행 중인 버스킹이 있습니다.');
      }
      const busking = {
        id: seq++, title, genre, description,
        artistId: user.id, startedAt: new Date().toISOString(), viewers: new Set(),
      };
      buskings.set(busking.id, busking);
      return publicBusking(busking);
    },

    endBusking(user, id) {
      const b = buskings.get(Number(id));
      if (!b) throw httpError(404, '버스킹을 찾을 수 없습니다.');
      if (b.artistId !== user.id) throw httpError(403, '본인의 버스킹만 종료할 수 있습니다.');
      buskings.delete(b.id);
    },

    getBusking(id) {
      const b = buskings.get(Number(id));
      if (!b) throw httpError(404, '버스킹을 찾을 수 없습니다.');
      return publicBusking(b);
    },

    rawBusking(id) {
      return buskings.get(Number(id));
    },

    // mode: all | random | genre
    listBuskings({ mode = 'all', user } = {}) {
      let list = [...buskings.values()].map(publicBusking);
      if (mode === 'genre') {
        const follows = user ? user.followGenres : new Set();
        list = list.filter((b) => follows.has(b.genre));
      }
      if (mode === 'random') {
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        return list.slice(0, 6);
      }
      return list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
  };
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
