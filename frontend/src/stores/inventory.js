import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

export const useInventoryStore = defineStore('inventory', () => {
  const authStore = useAuthStore();
  const inventory = ref([]);

  console.log('Inventory from Pinia:', inventory);

  const fetchInventory = async (tourId) => {
    try {
      const token = authStore.token;
      const response = await axios.get(`http://localhost:5002/api/inventory?tour_id=${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      inventory.value = response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  return {
    inventory,
    fetchInventory,
  };
});
