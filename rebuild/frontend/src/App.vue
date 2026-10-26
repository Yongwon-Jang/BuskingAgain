<template>
  <header class="nav">
    <router-link to="/" class="logo">🎤 버스킹 어게인</router-link>
    <nav>
      <template v-if="isLoggedIn">
        <router-link to="/buskings/new" class="btn primary">버스킹 시작</router-link>
        <router-link to="/me">{{ user?.nickname }}님</router-link>
        <button class="link" @click="logout">로그아웃</button>
      </template>
      <template v-else>
        <router-link to="/login">로그인</router-link>
        <router-link to="/signup" class="btn">회원가입</router-link>
      </template>
    </nav>
  </header>
  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const isLoggedIn = computed(() => store.getters.isLoggedIn);
const user = computed(() => store.state.user);

async function logout() {
  await store.dispatch('logout');
  router.push('/');
}
</script>
