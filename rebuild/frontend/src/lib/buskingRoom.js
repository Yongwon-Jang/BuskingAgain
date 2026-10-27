// Client side of a busking room: WebRTC media + chat over one WebSocket.
//
// Artist: captures camera/mic and creates one RTCPeerConnection per viewer.
// Viewer: waits for the artist's offer, answers, and plays the remote stream.

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export class BuskingRoom {
  constructor({ roomId, role, token, onStream, onChat, onReaction, onViewers, onEnded, onError }) {
    Object.assign(this, { roomId, role, token, onStream, onChat, onReaction, onViewers, onEnded, onError });
    this.peers = new Map(); // peerId -> RTCPeerConnection
    this.localStream = null;
    this.ws = null;
  }

  async start() {
    if (this.role === 'artist') {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.onStream?.(this.localStream);
    }

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws.onopen = () => this.send({ type: 'join', roomId: this.roomId, role: this.role, token: this.token });
    this.ws.onmessage = (e) => this.handle(JSON.parse(e.data));
    this.ws.onclose = () => this.closePeers();
  }

  send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  chat(text) {
    this.send({ type: 'chat', text });
  }

  react(emoji) {
    this.send({ type: 'reaction', emoji });
  }

  async handle(msg) {
    switch (msg.type) {
      case 'viewer-joined':
        if (this.role === 'artist') await this.offerTo(msg.peerId);
        break;
      case 'viewer-left':
        this.peers.get(msg.peerId)?.close();
        this.peers.delete(msg.peerId);
        break;
      case 'signal':
        await this.onSignal(msg.from, msg.data);
        break;
      case 'chat':
        this.onChat?.(msg);
        break;
      case 'reaction':
        this.onReaction?.(msg.emoji);
        break;
      case 'viewers':
        this.onViewers?.(msg.count);
        break;
      case 'ended':
        this.closePeers();
        this.onEnded?.();
        break;
      case 'error':
        this.onError?.(msg.message);
        break;
    }
  }

  createPeer(peerId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => e.candidate && this.send({ type: 'signal', to: peerId, data: { candidate: e.candidate } });
    pc.ontrack = (e) => this.onStream?.(e.streams[0]);
    this.peers.set(peerId, pc);
    return pc;
  }

  // artist -> viewer
  async offerTo(viewerId) {
    const pc = this.createPeer(viewerId);
    this.localStream.getTracks().forEach((t) => pc.addTrack(t, this.localStream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.send({ type: 'signal', to: viewerId, data: { sdp: pc.localDescription } });
  }

  async onSignal(from, data) {
    let pc = this.peers.get(from);
    if (data.sdp) {
      if (data.sdp.type === 'offer') {
        // viewer receives the artist's offer
        pc ??= this.createPeer(from);
        await pc.setRemoteDescription(data.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.send({ type: 'signal', to: from, data: { sdp: pc.localDescription } });
      } else if (pc) {
        await pc.setRemoteDescription(data.sdp);
      }
    } else if (data.candidate && pc) {
      await pc.addIceCandidate(data.candidate).catch(() => {});
    }
  }

  closePeers() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
  }

  leave() {
    this.closePeers();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.ws?.close();
  }
}
