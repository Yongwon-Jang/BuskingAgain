// WebRTC signaling + chat over a single WebSocket.
//
// Topology: 1 artist -> N viewers (mesh, one RTCPeerConnection per viewer).
// The artist creates an offer for each viewer that joins; the server only relays.
//
// Client -> server messages
//   { type: 'join', roomId, token, role: 'artist' | 'viewer' }
//   { type: 'signal', to, data }      // offer / answer / ice candidate
//   { type: 'chat', text }            // logged-in users only
//   { type: 'reaction', emoji }       // 👏 ❤️ 🔥 🎵 😂, rate limited
// Server -> client messages
//   { type: 'joined', peerId, artistPeerId }
//   { type: 'viewer-joined', peerId, nickname }
//   { type: 'viewer-left', peerId }
//   { type: 'signal', from, data }
//   { type: 'chat', nickname, text, at }
//   { type: 'reaction', emoji }
//   { type: 'viewers', count }
//   { type: 'ended' }
//   { type: 'error', message }

export const REACTIONS = ['👏', '❤️', '🔥', '🎵', '😂'];
const RATE_WINDOW_MS = 1000;
const MAX_EVENTS_PER_WINDOW = 5;

// Simple per-peer rate limiter so one client cannot flood a room.
function allow(peer, now = Date.now()) {
  peer.events = (peer.events ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (peer.events.length >= MAX_EVENTS_PER_WINDOW) return false;
  peer.events.push(now);
  return true;
}

export function createSignaling(wss, store) {
  const rooms = new Map(); // roomId -> { artist: peer|null, viewers: Map<peerId, peer> }
  let peerSeq = 1;

  const send = (ws, msg) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(msg));
  const roomOf = (id) => {
    if (!rooms.has(id)) rooms.set(id, { artist: null, viewers: new Map() });
    return rooms.get(id);
  };
  const broadcast = (room, msg) => {
    if (room.artist) send(room.artist.ws, msg);
    for (const v of room.viewers.values()) send(v.ws, msg);
  };
  const updateViewerCount = (roomId, room) => {
    const b = store.rawBusking(roomId);
    if (b) b.viewers = new Set(room.viewers.keys());
    broadcast(room, { type: 'viewers', count: room.viewers.size });
  };

  wss.on('connection', (ws) => {
    const peer = { id: String(peerSeq++), ws, roomId: null, role: null, nickname: '익명', userId: null };

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === 'join') {
        const busking = store.rawBusking(msg.roomId);
        if (!busking) return send(ws, { type: 'error', message: '종료되었거나 없는 버스킹입니다.' });
        const user = store.userByToken(msg.token);
        if (user) {
          peer.nickname = user.nickname;
          peer.userId = user.id;
        }

        const room = roomOf(busking.id);
        peer.roomId = busking.id;

        if (msg.role === 'artist') {
          if (!user || user.id !== busking.artistId) return send(ws, { type: 'error', message: '공연자만 방송할 수 있습니다.' });
          peer.role = 'artist';
          room.artist = peer;
          send(ws, { type: 'joined', peerId: peer.id, artistPeerId: peer.id });
          // viewers who were waiting get an offer now
          for (const v of room.viewers.values()) send(ws, { type: 'viewer-joined', peerId: v.id, nickname: v.nickname });
        } else {
          peer.role = 'viewer';
          room.viewers.set(peer.id, peer);
          send(ws, { type: 'joined', peerId: peer.id, artistPeerId: room.artist?.id ?? null });
          if (room.artist) send(room.artist.ws, { type: 'viewer-joined', peerId: peer.id, nickname: peer.nickname });
        }
        updateViewerCount(busking.id, room);
        return;
      }

      const room = peer.roomId && rooms.get(peer.roomId);
      if (!room) return;

      if (msg.type === 'signal') {
        const target = room.artist?.id === msg.to ? room.artist : room.viewers.get(msg.to);
        if (target) send(target.ws, { type: 'signal', from: peer.id, data: msg.data });
      }

      if (msg.type === 'chat' && typeof msg.text === 'string' && msg.text.trim()) {
        if (!peer.userId) return send(ws, { type: 'error', message: '로그인 후 채팅할 수 있어요.' });
        if (!allow(peer)) return send(ws, { type: 'error', message: '메시지를 너무 빠르게 보내고 있어요.' });
        broadcast(room, { type: 'chat', nickname: peer.nickname, text: msg.text.trim().slice(0, 300), at: new Date().toISOString() });
      }

      if (msg.type === 'reaction' && REACTIONS.includes(msg.emoji) && allow(peer)) {
        broadcast(room, { type: 'reaction', emoji: msg.emoji });
      }
    });

    ws.on('close', () => {
      const room = peer.roomId && rooms.get(peer.roomId);
      if (!room) return;
      if (peer.role === 'artist' && room.artist?.id === peer.id) {
        room.artist = null;
        for (const v of room.viewers.values()) send(v.ws, { type: 'ended' });
      } else {
        room.viewers.delete(peer.id);
        if (room.artist) send(room.artist.ws, { type: 'viewer-left', peerId: peer.id });
        updateViewerCount(peer.roomId, room);
      }
      if (!room.artist && room.viewers.size === 0) rooms.delete(peer.roomId);
    });
  });
}
