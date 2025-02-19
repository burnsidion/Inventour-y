import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useShowSummariesStore = defineStore('showSummaries', () => {
  const authStore = useAuthStore();

  const summaries = ref([]);
  const currentSummary = ref(null);

  const fetchShowSummary = async (showId) => {
    try {
      const token = authStore.token;

      const response = await axios.get(`http://localhost:5002/api/shows/${showId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      currentSummary.value = response.data;
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching show summary:', error.response?.data || error);
      return null;
    }
  };

  return {
    summaries,
    currentSummary,
    fetchShowSummary,
  };
});
