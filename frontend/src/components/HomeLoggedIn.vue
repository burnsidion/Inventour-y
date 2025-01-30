<template>
    <div class="flex min-h-screen">
      <SidebarMenu />
  
      <div class="flex-1 p-6">
        <h1 class="text-3xl font-bold mb-6">Your Tours</h1>
  
        <div v-if="tours.length > 0" class="grid gap-4">
          <div 
            v-for="tour in tours" 
            :key="tour.id" 
            class="p-4 bg-white rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <h2 class="text-xl font-semibold">{{ tour.name }}</h2>
              <p class="text-gray-600">📅 {{ formatTourDate(tour.start_date) }} - {{ formatTourDate(tour.end_date) }}</p>
            </div>
  
            <!-- Delete Button -->
            <button 
              @click="deleteTour(tour.id)" 
              class="btn btn-error text-white"
            >
              🗑 Delete
            </button>
          </div>
        </div>
  
        <div v-else class="flex flex-col items-center">
          <p class="text-gray-500 text-lg">No tours yet.</p>
          <button @click="createTour" class="btn btn-primary mt-4 animate-pulse">+ Create Your First Tour</button>
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

const fetchTours = async () => {
    try {
        const token = authStore.token;
        const response = await axios.get('http://localhost:5002/api/tours', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });

        tours.value = response.data;
    } catch (error) {
        console.error('Error fetching tours:', error.response?.data || error.message);
    }
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

        // Remove the tour from the local state after deletion
        tours.value = tours.value.filter(tour => tour.id !== tourId);
    } catch (error) {
        console.error('Error deleting tour:', error.response?.data || error.message);
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