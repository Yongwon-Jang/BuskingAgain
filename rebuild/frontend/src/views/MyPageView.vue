<template>
  <section class="form">
    <h2>마이페이지</h2>
    <label>닉네임
      <span class="row">
        <input v-model="nickname" maxlength="12" />
        <button class="btn" @click="saveNickname">변경</button>
      </span>
    </label>
    <p v-if="message" class="hint">{{ message }}</p>

    <h3>좋아하는 장르 팔로우</h3>
    <p class="hint">팔로우한 장르의 버스킹은 '선호 장르' 탭에 모아서 보여드려요.</p>
    <div class="chips">
      <button v-for="g in genres" :key="g" :class="['chip', { on: followGenres.includes(g) }]" @click="toggle(g)">
        {{ followGenres.includes(g) ? '✓ ' : '+ ' }}{{ g }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { api } from '../api/http';

const store = useStore();
const genres = ref([]);
const nickname = ref(store.state.user?.nickname ?? '');
const message = ref('');
const followGenres = computed(() => store.getters.followGenres);

onMounted(async () => {
  genres.value = await api.genres();
  store.commit('setUser', await api.me());
});

async function saveNickname() {
  try {
    store.commit('setUser', await api.updateMe({ nickname: nickname.value }));
    message.value = '닉네임을 변경했어요.';
  } catch (e) {
    message.value = e.message;
  }
}

const toggle = (genre) => store.dispatch('toggleFollow', genre);
</script>
