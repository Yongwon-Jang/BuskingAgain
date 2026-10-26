<template>
  <router-link :to="`/buskings/${busking.id}`" class="card">
    <div class="thumb">
      <span class="live">LIVE</span>
      <span class="viewers">👀 {{ busking.viewerCount }}</span>
    </div>
    <div class="body">
      <span class="genre">{{ busking.genre }}</span>
      <h3>{{ busking.title }}</h3>
      <p>{{ busking.artist }} · {{ elapsed }}</p>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ busking: { type: Object, required: true } });

const elapsed = computed(() => {
  const min = Math.max(0, Math.floor((Date.now() - new Date(props.busking.startedAt)) / 60000));
  return min < 1 ? '방금 시작' : `${min}분째 공연 중`;
});
</script>
