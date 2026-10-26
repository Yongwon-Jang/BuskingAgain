<template>
  <section>
    <div class="tabs">
      <button v-for="t in tabs" :key="t.mode" :class="{ active: mode === t.mode }" @click="select(t.mode)">
        {{ t.label }}
      </button>
      <button class="link" @click="load">새로고침</button>
    </div>

    <p v-if="mode === 'genre' && !isLoggedIn" class="hint">로그인하고 좋아하는 장르를 팔로우하면 맞춤 버스킹을 볼 수 있어요.</p>
    <p v-else-if="mode === 'genre' && !followGenres.length" class="hint">
      마이페이지에서 장르를 팔로우해 보세요.
    </p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!loading && !buskings.length" class="hint">지금 진행 중인 버스킹이 없어요.</p>

    <div class="grid">
      <BuskingCard v-for="b in buskings" :key="b.id" :busking="b" />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { api } from '../api/http';
import BuskingCard from '../components/BuskingCard.vue';

const tabs = [
  { mode: 'all', label: '전체' },
  { mode: 'random', label: '🎲 랜덤' },
  { mode: 'genre', label: '❤️ 선호 장르' },
];

const store = useStore();
const isLoggedIn = computed(() => store.getters.isLoggedIn);
const followGenres = computed(() => store.getters.followGenres);

const mode = ref('all');
const buskings = ref([]);
const loading = ref(false);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    buskings.value = await api.buskings(mode.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function select(m) {
  mode.value = m;
  load();
}

onMounted(load);
</script>
