<template>
  <form class="form" @submit.prevent="submit">
    <h2>버스킹 시작하기</h2>
    <label>공연 제목 <input v-model="form.title" required maxlength="40" placeholder="예) 퇴근길 어쿠스틱 라이브" /></label>
    <label>장르
      <select v-model="form.genre" required>
        <option disabled value="">장르를 선택하세요</option>
        <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
      </select>
    </label>
    <label>소개 <textarea v-model="form.description" rows="3" maxlength="200" placeholder="오늘 들려줄 곡을 소개해 주세요" /></label>
    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn primary" :disabled="submitting">카메라 켜고 시작</button>
  </form>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api/http';

const router = useRouter();
const genres = ref([]);
const form = reactive({ title: '', genre: '', description: '' });
const error = ref('');
const submitting = ref(false);

onMounted(async () => (genres.value = await api.genres()));

async function submit() {
  submitting.value = true;
  error.value = '';
  try {
    const busking = await api.createBusking(form);
    router.push(`/buskings/${busking.id}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>
