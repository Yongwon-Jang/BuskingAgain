<template>
  <form class="form" @submit.prevent="submit">
    <h2>로그인</h2>
    <label>이메일 <input v-model="email" type="email" required autocomplete="username" /></label>
    <label>비밀번호 <input v-model="password" type="password" required autocomplete="current-password" /></label>
    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn primary">로그인</button>
    <router-link to="/signup" class="link">아직 회원이 아니신가요? 회원가입</router-link>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

const store = useStore();
const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await store.dispatch('login', { email: email.value, password: password.value });
    router.push(route.query.redirect ?? '/');
  } catch (e) {
    error.value = e.message;
  }
}
</script>
