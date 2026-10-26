<template>
  <section v-if="busking" class="room">
    <div class="stage">
      <video ref="videoEl" autoplay playsinline :muted="isArtist"></video>
      <div v-if="!hasStream" class="waiting">{{ waitingText }}</div>
      <div class="stage-info">
        <span class="genre">{{ busking.genre }}</span>
        <h2>{{ busking.title }}</h2>
        <p>{{ busking.artist }} · 👀 {{ viewerCount }}명 시청 중</p>
        <p class="desc">{{ busking.description }}</p>
        <button v-if="isArtist" class="btn danger" @click="end">공연 종료</button>
      </div>
    </div>

    <aside class="chat">
      <ul ref="chatList">
        <li v-for="(m, i) in messages" :key="i"><b>{{ m.nickname }}</b> {{ m.text }}</li>
      </ul>
      <form @submit.prevent="sendChat">
        <input v-model="draft" :placeholder="isLoggedIn ? '응원 메시지를 보내보세요' : '로그인 후 채팅할 수 있어요'"
               :disabled="!isLoggedIn" maxlength="300" />
        <button class="btn primary" :disabled="!isLoggedIn">전송</button>
      </form>
    </aside>
  </section>
  <p v-else-if="error" class="error">{{ error }}</p>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { api } from '../api/http';
import { BuskingRoom } from '../lib/buskingRoom';

const props = defineProps({ id: { type: String, required: true } });
const store = useStore();
const router = useRouter();

const busking = ref(null);
const error = ref('');
const videoEl = ref(null);
const hasStream = ref(false);
const ended = ref(false);
const viewerCount = ref(0);
const messages = ref([]);
const draft = ref('');
const chatList = ref(null);
let room = null;

const isLoggedIn = computed(() => store.getters.isLoggedIn);
const isArtist = computed(() => busking.value && store.state.user?.id === busking.value.artistId);
const waitingText = computed(() => (ended.value ? '공연이 끝났어요. 함께해 주셔서 감사합니다!' : '공연자를 기다리는 중...'));

onMounted(async () => {
  try {
    busking.value = await api.busking(props.id);
  } catch (e) {
    error.value = e.message;
    return;
  }

  room = new BuskingRoom({
    roomId: busking.value.id,
    role: isArtist.value ? 'artist' : 'viewer',
    token: store.state.token,
    onStream: (stream) => {
      videoEl.value.srcObject = stream;
      hasStream.value = true;
    },
    onChat: async (m) => {
      messages.value.push(m);
      await nextTick();
      chatList.value?.scrollTo({ top: chatList.value.scrollHeight });
    },
    onViewers: (n) => (viewerCount.value = n),
    onEnded: () => {
      ended.value = true;
      hasStream.value = false;
    },
    onError: (m) => (error.value = m),
  });

  try {
    await room.start();
  } catch {
    error.value = '카메라·마이크 권한을 허용해 주세요.';
  }
});

onBeforeUnmount(() => room?.leave());

function sendChat() {
  if (!draft.value.trim()) return;
  room.chat(draft.value);
  draft.value = '';
}

async function end() {
  await api.endBusking(busking.value.id);
  room.leave();
  router.push('/');
}
</script>
