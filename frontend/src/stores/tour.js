import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useTourStore = defineStore('tour', () => {
  const authStore = useAuthStore();
  const tourName = ref('');
  const tours = ref([]);

  const fetchTourDetails = async (tourId) => {
    try {
      const token = authStore.token;
      const response = await axios.get(`http://localhost:5002/api/tours/${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.name) {
        tourName.value = response.data.name;
      }
    } catch (error) {
      console.error('Error fetching tour details', error);
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
        })),
      );
    } catch (error) {
      console.error('Error fetching tours:', error.response?.data || error.message);
    }
  };

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
          error.response?.data || error.message,
        );
        return [];
      }
    }
  };

  return {
    tourName,
    tours,
    fetchTourDetails,
    fetchTours,
    fetchShows,
  };
});
