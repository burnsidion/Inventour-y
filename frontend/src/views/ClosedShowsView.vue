<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-semibold text-center mb-4">Closed Shows</h1>

    <div v-if="isLoading" class="text-center">
      <p>Loading closed shows...</p>
    </div>

    <!-- Closed Shows -->
    <div v-else-if="closedShows.length > 0">
      <div v-for="tour in groupedShows" :key="tour.tour_id" class="mb-6">
        <h2 class="text-xl font-bold mb-2">{{ tour.tour_name }}</h2>
        <ul class="list-none ml-6">
          <li v-for="show in tour.shows" :key="show.show_id" class="mb-2">
            <div
              @click="toggleShow(show.show_id)"
              class="cursor-pointer bg-gray-800 p-4 rounded-lg"
            >
              📍 {{ show.venue }} - {{ formatDate(show.date) }}
            </div>

            <RouterLink :to="`${show.show_id}/summary`">
              <div v-if="expandedShows[show.show_id]" class="mt-2 p-4 bg-gray-700 rounded-lg">
                <ShowSummaryCard :showId="show.show_id" />
              </div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- No closed shows found  -->
    <div v-else class="text-center text-gray-500">No closed shows found.</div>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useShowSummariesStore } from '@/stores/showSummariesStore';
import ShowSummaryCard from '@/components/ShowSummaryCard.vue';

const showSummariesStore = useShowSummariesStore();
const isLoading = ref(true);
const expandedShows = ref({});
const { closedShows } = storeToRefs(showSummariesStore);

onMounted(async () => {
  await showSummariesStore.fetchClosedShows();
  isLoading.value = false;
});

const groupedShows = computed(() => {
  const grouped = {};
  closedShows.value.forEach((show) => {
    if (!grouped[show.tour_id]) {
      grouped[show.tour_id] = { tour_name: show.tour_name, tour_id: show.tour_id, shows: [] };
    }
    grouped[show.tour_id].shows.push(show);
  });
  return Object.values(grouped);
});

const toggleShow = (showId) => {
  expandedShows.value[showId] = !expandedShows.value[showId];
};

const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
</script>