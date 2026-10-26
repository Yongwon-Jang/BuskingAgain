<template>
  <form class="form" @submit.prevent="submit">
    <h2>회원가입</h2>
    <label>이메일 <input v-model="form.email" type="email" required autocomplete="username" /></label>
    <label>닉네임 <input v-model="form.nickname" required maxlength="12" /></label>
    <label>비밀번호 <input v-model="form.password" type="password" required minlength="8" autocomplete="new-password" /></label>
    <label>비밀번호 확인 <input v-model="confirm" type="password" required autocomplete="new-password" /></label>
    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn primary">가입하기</button>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { api } from '../api/http';

const store = useStore();
const router = useRouter();
const form = reactive({ email: '', nickname: '', password: '' });
const confirm = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  if (form.password !== confirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }
  try {
    await api.signup(form);
    await store.dispatch('login', { email: form.email, password: form.password });
    router.push('/me');
  } catch (e) {
    error.value = e.message;
  }
}
</script>
