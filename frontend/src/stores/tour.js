import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';
import { useRouter } from 'vue-router';

export const useTourStore = defineStore('tour', () => {
  const authStore = useAuthStore();
  const router = useRouter();

  const tourName = ref('');
  const tours = ref([]);
  const loading = ref(false);
  const errorMessage = ref('');

  const createTour = async (tourData) => {
    loading.value = true;
    errorMessage.value = '';

    try {
      const token = authStore.token;

      const formattedTourData = {
        ...tourData,
        start_date: tourData.start_date || null,
        end_date: tourData.end_date || null,
      };

      const response = await axios.post('http://localhost:5002/api/tours', formattedTourData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201) {
        tours.value.push(response.data);
        router.push('/');
      }
    } catch (error) {
      errorMessage.value = error.response?.data?.message || 'Failed to create tour';
    } finally {
      loading.value = false;
    }
  };

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
        console.warn(`📌 No shows found for tour ${tourId}. Returning an empty array.`);
        return [];
      } else {
        console.error(
          `❌ Critical error fetching shows for tour ${tourId}:`,
          error.response?.data || error.message,
        );
        throw error;
      }
    }
  };

  const addShow = async (showData) => {
    try {
      const token = authStore.token;
      const response = await axios.post(
        'http://localhost:5002/api/shows',
        showData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const id = response.data.show.id;
      router.push(`/shows/${id}/?tour_id=${showData.tour_id}`);
    } catch (error) {
      console.error('Error creating show:', error.response?.data || error.message);
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
          (show) => show.id !== showId,
        );
      }

      console.log('Show deleted successfully.');
    } catch (error) {
      console.error('Error deleting show:', error.response?.data || error.message);
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

      tours.value = tours.value.filter((tour) => tour.id !== tourId);
    } catch (error) {
      console.error('Error deleting tour:', error.response?.data || error.message);
    }
  };

  return {
    tourName,
    tours,
    fetchTourDetails,
    fetchTours,
    fetchShows,
    deleteTour,
    deleteShow,
    createTour,
    addShow,
  };
});
