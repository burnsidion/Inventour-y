<template>
  <div class="flex min-h-screen">
    <!-- Sidebar (Visible on larger screens) -->
    <SidebarMenu class="w-64 hidden md:block" />

    <div class="flex-1 p-4 md:p-6">
      <h1 class="text-3xl font-bold mb-6 text-center">Your Tours</h1>

      <!-- Tours List -->
      <div v-if="tours.length > 0" class="flex flex-col gap-4">
        <div
          v-for="tour in tours"
          :key="tour.id"
          class="p-4 bg-ivory rounded-lg shadow transition-transform duration-200 lg:hover:animate-bounceOnce"
        >
          <div>
            <h2 class="text-xl font-semibold text-center md:text-left text-[#393f4d]">
              {{ tour.name }}
            </h2>
            <p class="text-gray-600 text-center md:text-left">
              📅 {{ formatTourDate(tour.start_date) }} - {{ formatTourDate(tour.end_date) }}
            </p>
          </div>

          <!-- Shows List -->
          <div v-if="tour.shows && tour.shows.length > 0" class="mt-4">
            <h3 class="text-[#393f4d] font-semibold text-center md:text-left">Shows:</h3>
            <div v-for="show in tour.shows" :key="show.id" class="text-center md:text-left flex">
              <router-link
                :to="`/shows/${show.id}?tour_id=${tour.id}`"
                class="text-blue-500 hover:underline block"
              >
                📍 {{ show.venue }} - {{ formatTourDate(show.date) }}
              </router-link>
              <button
                @click="deleteShow(tour.id, show.id)"
                class="text-red-500 hover:text-red-700 ml-4"
              >
                🗑 Delete
              </button>
            </div>
          </div>
          <p v-else class="text-gray-500 text-center md:text-left">No shows added yet.</p>

          <!-- Buttons -->
          <div class="flex flex-col md:flex-row gap-2 mt-4">
            <button @click="createShow(tour.id)" class="btn btn-primary flex-1">➕ Add Show</button>
            <router-link :to="`/tours/${tour.id}/inventory`" class="btn btn-secondary flex-1">
              📦 View Inventory
            </router-link>
            <button @click="deleteTour(tour.id)" class="btn btn-error flex-1">🗑 Delete Tour</button>
          </div>
        </div>
      </div>

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
import { ref, onMounted } from 'vue';
import SidebarMenu from '@/components/SidebarMenu.vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';

const authStore = useAuthStore();
const router = useRouter();
const tours = ref([]);

const fetchShows = async (tourId) => {
  try {
    const token = authStore.token;
    const response = await axios.get(`http://localhost:5002/api/shows?tour_id=${tourId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`No shows found for tour ${tourId}.`);
      return [];
    } else {
      console.error(
        `Error fetching shows for tour ${tourId}:`,
        error.response?.data || error.message
      );
      return [];
    }
  }
};

const fetchTours = async () => {
  try {
    const token = authStore.token;
    const response = await axios.get('http://localhost:5002/api/tours', {
      headers: { Authorization: `Bearer ${token}` },
    });

    tours.value = await Promise.all(
      response.data.map(async (tour) => ({
        ...tour,
        shows: await fetchShows(tour.id),
      }))
    );
  } catch (error) {
    console.error('Error fetching tours:', error.response?.data || error.message);
  }
};

const createShow = (tourId) => {
  router.push(`/shows/create?tour_id=${tourId}`);
};

const deleteTour = async (tourId) => {
  if (!confirm('Are you sure you want to delete this tour?')) return;

  try {
    const token = authStore.token;
    await axios.delete(`http://localhost:5002/api/tours/${tourId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    tours.value = tours.value.filter((tour) => tour.id !== tourId);
  } catch (error) {
    console.error('Error deleting tour:', error.response?.data || error.message);
  }
};

const deleteShow = async (tourId, showId) => {
  if (!confirm('Are you sure you want to delete this show?')) return;

  try {
    const token = authStore.token;
    await axios.delete(`http://localhost:5002/api/shows/${showId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tourIndex = tours.value.findIndex((tour) => tour.id === tourId);
    if (tourIndex !== -1) {
      tours.value[tourIndex].shows = tours.value[tourIndex].shows.filter(
        (show) => show.id !== showId
      );
    }

    console.log('Show deleted successfully.');
  } catch (error) {
    console.error('Error deleting show:', error.response?.data || error.message);
  }
};

const formatTourDate = (dateString) => {
  return format(new Date(dateString), 'MMM dd, yyyy');
};

const createTour = () => {
  router.push('/create-tour');
};

onMounted(fetchTours);
</script>