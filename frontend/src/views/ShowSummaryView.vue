<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col items-center">
      <h1 class="text-2xl font-semibold text-center mb-4">Show Summary</h1>
      <button @click="backToShows" class="btn btn-primary mb-4 max-w-[200px]">
        Back To All Shows
      </button>
    </div>
    <ShowSummaryCard :showId="showId" />
  </div>
</template>
  
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import ShowSummaryCard from '@/components/ShowSummaryCard.vue';

const route = useRoute();
const router = useRouter();
const showId = computed(() => Number(route.params.id));

const backToShows = () => {
  router.push('/shows/closed');
};
</script>