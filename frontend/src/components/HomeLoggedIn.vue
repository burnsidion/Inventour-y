<template>
  <div class="flex min-h-screen relative">
    <!-- Mobile Menu Button -->
    <button
      v-if="!menuOpen"
      @click="menuOpen = !menuOpen"
      class="absolute top-4 left-4 z-1 md:hidden bg-gray-800 text-white p-2 rounded"
    >
      ☰
    </button>

    <!-- Sidebar (Expandable/Collapsable for mobile ONLY) -->
    <SidebarMenu
      class="z-2 fixed inset-y-0 left-0 bg-gray-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 h-[60vh] md:h-screen"
      :class="{ '-translate-x-full': !menuOpen, 'translate-x-0': menuOpen }"
      :menuOpen="menuOpen"
      @closeMenu="menuOpen = false"
    />

    <div class="flex-1 p-4 md:p-6">
      <h1 v-if="!isUserLoading" class="text-3xl font-bold mb-6 text-center mt-12 md:mt-0">
        {{ `Welcome ${userName}` }}
      </h1>
      <h1 class="text-3xl font-bold mb-6 text-center">Behold Your Home Page!</h1>
      <!-- Create Tour Button -->
      <div class="flex justify-center my-6">
        <button @click="createTour" class="btn btn-primary w-full sm:w-auto">
          ➕ Create New Tour
        </button>
      </div>

      <!-- Skeleton Loader -->
      <template v-if="isLoading">
        <div class="flex flex-col space-y-2">
          <TourCardSkeleton v-for="n in tours.length" :key="n" />
        </div>
      </template>

      <!-- Tours List -->
      <draggable
        v-else-if="tours?.length > 0 && !isLoading"
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
            <!-- Tour Info -->
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

            <!-- Dropdowns -->
            <div class="mt-2 flex flex-col md:flex-row justify-around">
              <CurrentShows :tour="tour" />
              <ClosedShowsDropdown />
            </div>

            <!-- Buttons -->
            <div class="flex flex-col md:flex-row gap-2 mt-4">
              <button @click="createShow(tour.id)" class="btn btn-primary flex-1">
                ➕ Add Show
              </button>
              <router-link :to="`/tours/${tour.id}/inventory`" class="btn btn-secondary flex-1">
                📦 View Inventory
              </router-link>
              <router-link :to="`/tours/${tour.id}/edit`" class="btn btn-error flex-1">
                📝 Edit Tour
              </router-link>
            </div>
          </div>
        </template>
      </draggable>

      <!-- No Tours Placeholder -->
      <div v-else class="text-gray-500 text-center text-lg mt-6">No tours yet.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';
import { useTourStore } from '@/stores/tour';
import { useSalesStore } from '@/stores/salesStore';
import { useAuthStore } from '@/stores/auth';
import draggable from 'vuedraggable';

import SidebarMenu from '@/components/SidebarMenu.vue';
import TourCardSkeleton from './TourCardSkeleton.vue';
import ClosedShowsDropdown from './ClosedShowsDropdown.vue';
import CurrentShows from './CurrentShowsDropdown.vue';

const router = useRouter();
const tourStore = useTourStore();
const salesStore = useSalesStore();
const authStore = useAuthStore();
const isLoading = ref(true);
const menuOpen = ref(false);
const isUserLoading = ref(true);

const { tours } = storeToRefs(tourStore);

const userName = computed(() => {
  if (isUserLoading.value) return '';
  return authStore.user?.name || 'Guest';
});

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
  router.push('/tours/create');
};

onMounted(async () => {
  await tourStore.fetchTours();
  await authStore.fetchUserData();
  console.log(authStore.user.name);
  for (const tour of tours.value) {
    await salesStore.fetchTourTotalSales(tour.id);
    isUserLoading.value = false;
  }

  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
});
</script>