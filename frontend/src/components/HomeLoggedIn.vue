<template>
  <div class="flex min-h-screen">
    <!-- Sidebar (Visible on larger screens) -->
    <SidebarMenu class="w-64 hidden md:block" />

    <div class="flex-1 p-4 md:p-6">
      <h1 class="text-3xl font-bold mb-6 text-center">Your Tours</h1>

      <!-- Tours List -->
      <draggable
        v-if="tours?.length > 0"
        v-model="tours"
        item-key="id"
        @end="saveTourOrder"
        class="flex flex-col gap-2"
      >
        <template #item="{ element: tour }">
          <div
            :key="tour.id"
            class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce cursor-move"
          >
            <div>
              <div class="flex justify-between">
                <h2 class="text-xl font-semibold text-center md:text-left text-[#393f4d]">
                  {{ tour.name }}
                </h2>
                <h2 class="text-xl font-semibold text-center md:text-left text-[#393f4d]">
                  {{ tour.band_name }}
                </h2>
              </div>
              <div class="flex flex-col justify-between gap-1 py-2">
                <p class="text-gray-600 text-center md:text-left">
                  📅 {{ formatTourDate(tour.start_date) }} - {{ formatTourDate(tour.end_date) }}
                </p>
                <p class="text-gray-600 text-center md:text-left">
                  💰 Total Sales: ${{ salesStore.totalSales[tour.id] || 0 }}
                </p>
              </div>
            </div>
            <!-- Shows List -->
            <div v-if="tour.shows && tour.shows.length > 0" class="mt-2">
              <h3 class="text-[#393f4d] font-semibold text-center md:text-left">
                Shows:
                <span
                  class="text-blue-500 cursor-pointer hover:underline"
                  @click="expandShows(tour.id)"
                >
                  {{ showsExpanded[tour.id] ? 'Collapse' : 'Expand' }}
                </span>
              </h3>

              <div
                v-if="showsExpanded[tour.id]"
                class="absolute md:absolute left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0 mt-1 bg-ivory border border-gray-300 shadow-md rounded-md p-2 min-w-[18rem] max-w-[24rem] overflow-y-auto z-50"
                :style="{ maxHeight: getMaxHeight(tour.id) }"
              >
                <div
                  v-for="show in tour.shows"
                  :key="show.id"
                  class="flex items-center justify-between whitespace-nowrap px-2 py-1"
                >
                  <router-link
                    :to="`/shows/${show.id}?tour_id=${tour.id}`"
                    class="text-blue-500 hover:underline block"
                  >
                    📍 {{ show.venue }} - {{ formatTourDate(show.date) }}
                  </router-link>
                  <button
                    @click="tourStore.deleteShow(tour.id, show.id)"
                    class="text-red-500 hover:text-red-700 ml-6 px-2"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="text-gray-500 text-center md:text-left">No shows added yet.</p>

            <!-- Buttons -->
            <div class="flex flex-col md:flex-row gap-2 mt-4">
              <button @click="createShow(tour.id)" class="btn btn-primary flex-1">
                ➕ Add Show
              </button>
              <router-link :to="`/tours/${tour.id}/inventory`" class="btn btn-secondary flex-1">
                📦 View Inventory
              </router-link>
              <button @click="tourStore.deleteTour(tour.id)" class="btn btn-error flex-1">
                🗑 Delete Tour
              </button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- No Tours Placeholder -->
      <div v-else class="text-gray-500 text-center text-lg mt-6">No tours yet.</div>

      <!-- Create Tour Button -->
      <div class="flex justify-center mt-6">
        <button @click="createTour" class="btn btn-primary w-full sm:w-auto">
          ➕ Create New Tour
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { onMounted, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import draggable from 'vuedraggable';
import { useRouter } from 'vue-router';
import { useTourStore } from '@/stores/tour';
import { useSalesStore } from '@/stores/salesStore';

import SidebarMenu from '@/components/SidebarMenu.vue';

const router = useRouter();
const tourStore = useTourStore();
const salesStore = useSalesStore();

const showsExpanded = ref({});

const getMaxHeight = computed(() => {
  return (tourId) => {
    const tour = tours.value.find((t) => t.id === tourId);
    if (!tour || !tour.shows) return '0';
    return tour.shows.length > 5 ? '12rem' : `${tour.shows.length * 3}rem`;
  };
});

const { tours } = storeToRefs(tourStore);

const saveTourOrder = () => {
  console.log('New tour order:', tours.value);
};

const createShow = (tourId) => {
  router.push(`/shows/create?tour_id=${tourId}`);
};

const formatTourDate = (dateString) => {
  if (!dateString) return 'N/A';

  const parsedDate = new Date(dateString);
  return isNaN(parsedDate) ? 'Invalid Date' : format(parsedDate, 'MMM dd, yyyy');
};

const createTour = () => {
  router.push('/create-tour');
};

const expandShows = (tourId) => {
  showsExpanded.value[tourId] = !showsExpanded.value[tourId];
};

onMounted(async () => {
  await tourStore.fetchTours();
  for (const tour of tours.value) {
    await salesStore.fetchTourTotalSales(tour.id);
  }
});
</script>